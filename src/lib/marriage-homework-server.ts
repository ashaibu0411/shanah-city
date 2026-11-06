import { randomUUID } from "crypto";
import type { PublicMember } from "@/lib/auth-types";
import { getUserById } from "@/lib/auth-server";
import {
  assertJourneyParticipantLoose,
  assertMarriageCounselorRole,
  isJourneyCounselorAccessRevoked,
  isMarriageCurriculumAdmin,
  viewerIsAssignedClinicalCounselor,
} from "@/lib/marriage-counseling-access";
import {
  assertHomeworkAvailableForPartnerState,
  homeworkRequiresJoinedPartner,
  journeyPartnerJoined,
} from "@/lib/marriage-homework-partner-policy";
import type { MarriageCounselingJourneyRecord } from "@/lib/marriage-counseling-types";
import { getPublicDisplayName } from "@/lib/member-display-name";
import {
  cloneTemplateActivities,
  listHomeworkTemplateSummaries,
  templateMeta,
} from "@/lib/marriage-homework-templates";
import { homeworkTemplateMeta } from "@/lib/marriage-homework-template-meta";
import type { MarriageHubSessionHomeworkView } from "@/lib/marriage-counseling-types";
import type {
  MarriageCounselorHomeworkListItem,
  MarriageHomeworkActivityDef,
  MarriageHomeworkParticipantStatus,
  MarriageSessionHomeworkRecord,
  MarriageSessionHomeworkResponseRecord,
} from "@/lib/marriage-homework-types";
import {
  homeworkIsCompleteForSubmit,
  participantHomeworkStatus,
  totalWritableQuestions,
  countAnsweredQuestions,
} from "@/lib/marriage-homework-status";
import {
  homeworkBlocksSessionApproval,
  normalizeHomeworkReviewStatus,
  partnerMayEditHomeworkAnswers,
} from "@/lib/marriage-homework-review";
import type { MarriageHomeworkCounselorReviewStatus } from "@/lib/marriage-homework-types";
import { normalizeAssignmentDueAtInput } from "@/lib/marriage-session-scheduling";
import { marriageStore } from "@/lib/stores/marriage-counseling-store";

const store = () => marriageStore();

async function assertHomeworkManager(user: PublicMember, journey: MarriageCounselingJourneyRecord) {
  if (viewerIsAssignedClinicalCounselor(user.id, journey)) {
    await assertMarriageCounselorRole(user);
    if (isJourneyCounselorAccessRevoked(journey)) {
      throw new Error("Counselor access has been revoked for this journey.");
    }
    return;
  }
  if (!(await isMarriageCurriculumAdmin(user))) {
    throw new Error("Access denied.");
  }
}

async function partnerIds(journey: MarriageCounselingJourneyRecord): Promise<[string, string]> {
  const a = journey.participantAId;
  const b = journey.participantBId;
  if (!a || !b) throw new Error("Both partners must join before homework can be released.");
  return [a, b];
}

async function partnerLabel(userId: string) {
  const user = await getUserById(userId);
  return user ? getPublicDisplayName(user).trim() || "Partner" : "Partner";
}

export function listHomeworkTemplatesForCounselor() {
  return listHomeworkTemplateSummaries();
}

export async function listCounselorHomeworkForJourney(
  viewer: PublicMember,
  journeyId: string,
): Promise<MarriageCounselorHomeworkListItem[]> {
  const journey = await store().getJourneyById(journeyId);
  if (!journey) throw new Error("Journey not found.");
  await assertHomeworkManager(viewer, journey);
  const [partnerAId, partnerBId] = await partnerIds(journey).catch(() => [null, null] as const);
  const rows = await store().listSessionHomeworkForJourney(journeyId);
  const now = Date.now();
  const items: MarriageCounselorHomeworkListItem[] = [];
  const sessionTemplateKeys = new Set(
    rows.filter((h) => h.status === "released" && h.templateKey).map((h) => h.templateKey as string),
  );

  for (const hw of rows) {
    const responses = await store().listSessionHomeworkResponses(hw.id);
    const respA = responses.find((r) => r.userId === partnerAId) ?? null;
    const respB = responses.find((r) => r.userId === partnerBId) ?? null;
    items.push({
      id: hw.id,
      title: hw.title,
      status: hw.status,
      templateKey: hw.templateKey,
      dueAt: hw.dueAt,
      dueAtTimeZone: hw.dueAtTimeZone,
      releasedAt: hw.releasedAt,
      rowKind: "session_homework",
      partnerA: {
        userId: partnerAId ?? "",
        name: partnerAId ? await partnerLabel(partnerAId) : "Partner A",
        status: partnerAId
          ? participantHomeworkStatus({ homework: hw, response: respA, nowMs: now })
          : "not_started",
      },
      partnerB: {
        userId: partnerBId ?? "",
        name: partnerBId ? await partnerLabel(partnerBId) : "Partner B",
        status: partnerBId
          ? participantHomeworkStatus({ homework: hw, response: respB, nowMs: now })
          : "not_started",
      },
    });
  }

  const { legacyAssignmentHomeworkId } = await import("@/lib/marriage-couple-homework-hub");
  const aId = journey.participantAId;
  const bId = journey.participantBId;
  const legacyAssignments = await store().listAssignments(journeyId);
  for (const assignment of legacyAssignments) {
    if (!assignment.dueAt) continue;
    if (assignment.moduleId && sessionTemplateKeys.has(assignment.moduleId)) continue;
    const syntheticId = legacyAssignmentHomeworkId(assignment.id);
    if (items.some((i) => i.id === syntheticId)) continue;
    const statusFor = (userId: string | null | undefined): MarriageHomeworkParticipantStatus => {
      if (!userId) return "not_started";
      return assignment.completedByUserIds.includes(userId) ? "submitted" : "not_started";
    };
    items.push({
      id: syntheticId,
      title: assignment.title,
      status: "released",
      templateKey: assignment.moduleId ? `legacy-module:${assignment.moduleId}` : "legacy-assignment",
      dueAt: assignment.dueAt,
      dueAtTimeZone: assignment.dueAtTimeZone,
      rowKind: "legacy_module_assignment",
      moduleId: assignment.moduleId,
      partnerA: {
        userId: aId ?? "",
        name: aId ? await partnerLabel(aId) : "Partner A",
        status: statusFor(aId),
      },
      partnerB: {
        userId: bId ?? "",
        name: bId ? await partnerLabel(bId) : "Partner B",
        status: statusFor(bId),
      },
    });
  }

  return items;
}

export async function createSessionHomeworkDraft(
  viewer: PublicMember,
  input: {
    journeyId: string;
    templateKey?: string;
    title?: string;
    instructions?: string;
    sessionId?: string;
    activities?: MarriageHomeworkActivityDef[];
  },
) {
  const journey = await store().getJourneyById(input.journeyId);
  if (!journey) throw new Error("Journey not found.");
  await assertHomeworkManager(viewer, journey);

  if (input.templateKey?.trim()) {
    const existing = await store().findDraftSessionHomeworkByTemplate(
      journey.id,
      input.templateKey.trim(),
    );
    if (existing) return existing;
    const releasedDup = (await store().listSessionHomeworkForJourney(journey.id)).find(
      (h) => h.templateKey === input.templateKey?.trim() && h.status === "released",
    );
    if (releasedDup) {
      throw new Error("This template is already released for this couple. Create a custom homework instead.");
    }
    const meta = templateMeta(input.templateKey.trim());
    const timing = homeworkTemplateMeta(input.templateKey.trim());
    const now = new Date().toISOString();
    let dueAt: string | undefined;
    if (timing?.suggestedDueDaysAfterRelease) {
      const due = new Date();
      due.setDate(due.getDate() + timing.suggestedDueDaysAfterRelease);
      dueAt = due.toISOString();
    }
    const record: MarriageSessionHomeworkRecord = {
      id: randomUUID(),
      journeyId: journey.id,
      counselorUserId: viewer.id,
      sessionId: input.sessionId,
      templateKey: input.templateKey.trim(),
      title: input.title?.trim() || meta.title,
      instructions: input.instructions?.trim() || meta.description,
      status: "draft",
      dueAt,
      activities: cloneTemplateActivities(input.templateKey.trim()),
      createdAt: now,
      updatedAt: now,
    };
    await store().saveSessionHomework(record);
    return record;
  }

  const title = input.title?.trim();
  if (!title) throw new Error("Title is required for custom homework.");
  const now = new Date().toISOString();
  const record: MarriageSessionHomeworkRecord = {
    id: randomUUID(),
    journeyId: journey.id,
    counselorUserId: viewer.id,
    sessionId: input.sessionId,
    title,
    instructions: input.instructions?.trim(),
    status: "draft",
    activities: input.activities?.length ? input.activities : [],
    createdAt: now,
    updatedAt: now,
  };
  await store().saveSessionHomework(record);
  return record;
}

export async function updateSessionHomeworkDraft(
  viewer: PublicMember,
  homeworkId: string,
  patch: {
    title?: string;
    instructions?: string;
    dueAt?: string;
    dueAtLocal?: string;
    schedulingTimeZone?: string;
    activities?: MarriageHomeworkActivityDef[];
    counselorPrivateNotes?: string;
    partnerFeedback?: Record<string, string>;
    sessionId?: string;
  },
) {
  const homework = await store().getSessionHomeworkById(homeworkId);
  if (!homework) throw new Error("Homework not found.");
  const journey = await store().getJourneyById(homework.journeyId);
  if (!journey) throw new Error("Journey not found.");
  await assertHomeworkManager(viewer, journey);
  if (homework.status !== "draft" && patch.activities) {
    throw new Error("Released homework cannot change activities. Reopen for revision first.");
  }
  const due = normalizeAssignmentDueAtInput({
    dueAt: patch.dueAt,
    dueAtLocal: patch.dueAtLocal,
    schedulingTimeZone: patch.schedulingTimeZone,
  });
  const previousFeedback = homework.partnerFeedback ?? {};
  const nextFeedback = patch.partnerFeedback ?? homework.partnerFeedback;
  const updated: MarriageSessionHomeworkRecord = {
    ...homework,
    title: patch.title?.trim() || homework.title,
    instructions: patch.instructions !== undefined ? patch.instructions.trim() : homework.instructions,
    activities: patch.activities ?? homework.activities,
    counselorPrivateNotes:
      patch.counselorPrivateNotes !== undefined
        ? patch.counselorPrivateNotes
        : homework.counselorPrivateNotes,
    partnerFeedback: nextFeedback,
    sessionId: patch.sessionId ?? homework.sessionId,
    dueAt: due?.dueAt ?? (patch.dueAt === "" ? undefined : homework.dueAt),
    dueAtTimeZone: due?.dueAtTimeZone ?? homework.dueAtTimeZone,
    updatedAt: new Date().toISOString(),
  };
  await store().saveSessionHomework(updated);
  if (patch.partnerFeedback && homework.status === "released") {
    const { notifyMarriageCounselorFeedbackAvailable } = await import("@/lib/marriage-counseling-notify");
    for (const [userId, text] of Object.entries(patch.partnerFeedback)) {
      const trimmed = text?.trim();
      if (!trimmed) continue;
      const had = previousFeedback[userId]?.trim();
      if (had === trimmed) continue;
      void notifyMarriageCounselorFeedbackAvailable(journey, userId, homework.id);
    }
  }
  return updated;
}

export async function releaseSessionHomework(viewer: PublicMember, homeworkId: string) {
  const homework = await store().getSessionHomeworkById(homeworkId);
  if (!homework) throw new Error("Homework not found.");
  const journey = await store().getJourneyById(homework.journeyId);
  if (!journey) throw new Error("Journey not found.");
  await assertHomeworkManager(viewer, journey);
  await partnerIds(journey);
  if (homework.status === "released") return homework;
  const { journeyUsesSelfPacedCounselingReview } = await import("@/lib/marriage-counseling-delivery-mode");
  if (journeyUsesSelfPacedCounselingReview(journey) && !homework.sessionId?.trim()) {
    throw new Error(
      "Self-paced couples require homework linked to a session (sessionKey). Open homework from the session review page or set sessionId before releasing.",
    );
  }
  const now = new Date().toISOString();
  const updated: MarriageSessionHomeworkRecord = {
    ...homework,
    status: "released",
    releasedAt: now,
    updatedAt: now,
  };
  await store().saveSessionHomework(updated);
  const { notifyMarriageHomeworkReleased } = await import("@/lib/marriage-counseling-notify");
  void notifyMarriageHomeworkReleased(journey, homeworkId);
  return updated;
}

export async function reopenSessionHomework(viewer: PublicMember, homeworkId: string) {
  const homework = await store().getSessionHomeworkById(homeworkId);
  if (!homework) throw new Error("Homework not found.");
  const journey = await store().getJourneyById(homework.journeyId);
  if (!journey) throw new Error("Journey not found.");
  await assertHomeworkManager(viewer, journey);
  const now = new Date().toISOString();
  const responses = await store().listSessionHomeworkResponses(homeworkId);
  for (const response of responses) {
    await store().saveSessionHomeworkResponse({
      ...response,
      submittedAt: undefined,
      lastSavedAt: now,
      reviewStatus: "assigned",
      revisionNote: null,
      reviewedAt: null,
    });
  }
  const updated: MarriageSessionHomeworkRecord = {
    ...homework,
    reopenedAt: now,
    updatedAt: now,
  };
  await store().saveSessionHomework(updated);
  return updated;
}

export async function getCounselorHomeworkDetail(viewer: PublicMember, homeworkId: string) {
  const { isLegacyAssignmentHomeworkId } = await import("@/lib/marriage-couple-homework-hub");
  if (isLegacyAssignmentHomeworkId(homeworkId)) {
    throw new Error(
      "Legacy module assignments are completed on module assessments. Use the module link from the homework list.",
    );
  }
  const homework = await store().getSessionHomeworkById(homeworkId);
  if (!homework) throw new Error("Homework not found.");
  const journey = await store().getJourneyById(homework.journeyId);
  if (!journey) throw new Error("Journey not found.");
  await assertHomeworkManager(viewer, journey);
  const responses = await store().listSessionHomeworkResponses(homeworkId);
  const partners = await partnerIds(journey).catch(() => null);
  const partnerViews = [];
  if (partners) {
    for (const userId of partners) {
      const response = responses.find((r) => r.userId === userId) ?? null;
      partnerViews.push({
        userId,
        name: await partnerLabel(userId),
        status: participantHomeworkStatus({ homework, response }),
        submittedAt: response?.submittedAt,
        answers: response?.answers ?? {},
        feedback: homework.partnerFeedback?.[userId],
        reviewStatus: normalizeHomeworkReviewStatus(response?.reviewStatus),
        revisionNote: response?.revisionNote ?? null,
        reviewedAt: response?.reviewedAt ?? null,
      });
    }
  }
  return {
    homework,
    partnerViews,
  };
}

async function assertParticipantHomeworkAccess(
  viewer: PublicMember,
  journey: MarriageCounselingJourneyRecord,
  homework: MarriageSessionHomeworkRecord,
) {
  await assertJourneyParticipantLoose(journey, viewer.id);
  const joined = await journeyPartnerJoined(journey, viewer.id);
  assertHomeworkAvailableForPartnerState(homework, joined);
}

export async function listReleasedHomeworkForParticipant(viewer: PublicMember, journeyId: string) {
  const journey = await store().getJourneyById(journeyId);
  if (!journey) throw new Error("Journey not found.");
  await assertJourneyParticipantLoose(journey, viewer.id);
  const partnerJoined = await journeyPartnerJoined(journey, viewer.id);
  const rows = await store().listSessionHomeworkForJourney(journeyId);
  const released = rows.filter((h) => h.status === "released");
  const now = Date.now();
  const views: MarriageHubSessionHomeworkView[] = [];
  for (const hw of released) {
    if (!partnerJoined && homeworkRequiresJoinedPartner(hw)) continue;
    const response = await store().getSessionHomeworkResponse(hw.id, viewer.id);
    const status = participantHomeworkStatus({ homework: hw, response, nowMs: now });
    const timing = homeworkTemplateMeta(hw.templateKey);
    const reviewStatus = normalizeHomeworkReviewStatus(response?.reviewStatus);
    const actionRequired =
      reviewStatus === "revision_requested" ||
      (!response?.submittedAt && status !== "not_started");
    views.push({
      id: hw.id,
      title: hw.title,
      dueAt: hw.dueAt,
      dueAtTimeZone: hw.dueAtTimeZone,
      status,
      submitted: Boolean(response?.submittedAt),
      counselorReviewStatus: reviewStatus,
      revisionNote:
        reviewStatus === "revision_requested" ? (response?.revisionNote?.trim() || undefined) : undefined,
      actionRequired,
      hasCounselorFeedback: Boolean(hw.partnerFeedback?.[viewer.id]?.trim()),
      activityCount: hw.activities.length,
      templateKey: hw.templateKey,
      timingLabel: timing?.timingLabel,
      assignedAfterLabel: timing?.assignedAfterLabel,
      preparingForLabel: timing?.preparingForLabel,
      postProgramNote: timing?.postProgramNote,
      estimatedMinutes: timing?.estimatedMinutes,
    });
  }
  return views;
}

/** Couple homework list aligned with Marriage Prep hub (session + open legacy assignments). */
export async function listUnifiedCoupleHomeworkForParticipant(
  viewer: PublicMember,
  journey: MarriageCounselingJourneyRecord,
  options: { myConsent: boolean },
): Promise<MarriageHubSessionHomeworkView[]> {
  if (!options.myConsent) {
    return listReleasedHomeworkForParticipant(viewer, journey.id);
  }
  const released = await listReleasedHomeworkForParticipant(viewer, journey.id);
  const assignments = await store().listAssignments(journey.id);
  const legacy = assignments
    .filter((a) => a.dueAt && !a.completedByUserIds.includes(viewer.id))
    .map((a) => ({
      id: a.id,
      title: a.title,
      dueAt: a.dueAt,
      dueAtTimeZone: a.dueAtTimeZone,
      completed: false,
      moduleId: a.moduleId,
    }));
  const { mergeCoupleHomeworkHubViews } = await import("@/lib/marriage-couple-homework-hub");
  return mergeCoupleHomeworkHubViews(released, legacy);
}

export async function getParticipantHomeworkWorkspace(viewer: PublicMember, homeworkId: string) {
  await assertNotLegacyHomeworkListItem(homeworkId);
  const homework = await store().getSessionHomeworkById(homeworkId);
  if (!homework) throw new Error("Homework not found.");
  if (homework.status !== "released") throw new Error("This homework is not available yet.");
  const journey = await store().getJourneyById(homework.journeyId);
  if (!journey) throw new Error("Journey not found.");
  await assertParticipantHomeworkAccess(viewer, journey, homework);
  const response: MarriageSessionHomeworkResponseRecord =
    (await store().getSessionHomeworkResponse(homeworkId, viewer.id)) ?? {
      homeworkId,
      userId: viewer.id,
      answers: {},
      lastSavedAt: new Date().toISOString(),
      reviewStatus: "assigned",
    };
  const reviewStatus = normalizeHomeworkReviewStatus(response.reviewStatus);
  const canEdit = partnerMayEditHomeworkAnswers({ homework, response });
  const total = totalWritableQuestions(homework.activities);
  const answered = countAnsweredQuestions(homework.activities, response.answers);
  const timing = homeworkTemplateMeta(homework.templateKey);
  return {
    homework: {
      id: homework.id,
      title: homework.title,
      instructions: homework.instructions,
      dueAt: homework.dueAt,
      dueAtTimeZone: homework.dueAtTimeZone,
      activities: homework.activities,
      timingLabel: timing?.timingLabel,
      assignedAfterLabel: timing?.assignedAfterLabel,
      preparingForLabel: timing?.preparingForLabel,
      postProgramNote: timing?.postProgramNote,
      estimatedMinutes: timing?.estimatedMinutes,
    },
    response: {
      answers: response.answers,
      lastSavedAt: response.lastSavedAt,
      submittedAt: response.submittedAt,
      reviewStatus,
      revisionNote: response.revisionNote ?? null,
    },
    progress: { answered, total },
    status: participantHomeworkStatus({ homework, response }),
    counselorFeedback: homework.partnerFeedback?.[viewer.id],
    canEdit,
    actionRequired: reviewStatus === "revision_requested",
  };
}

async function assertNotLegacyHomeworkListItem(homeworkId: string) {
  const { isLegacyAssignmentHomeworkId } = await import("@/lib/marriage-couple-homework-hub");
  if (isLegacyAssignmentHomeworkId(homeworkId)) {
    throw new Error(
      "This item is a module assignment. Complete it on the module assessment page linked from your homework list.",
    );
  }
}

export async function saveParticipantHomeworkDraft(
  viewer: PublicMember,
  homeworkId: string,
  patch: Record<string, string>,
) {
  await assertNotLegacyHomeworkListItem(homeworkId);
  const homework = await store().getSessionHomeworkById(homeworkId);
  if (!homework) throw new Error("Homework not found.");
  if (homework.status !== "released") throw new Error("This homework is not available yet.");
  const journey = await store().getJourneyById(homework.journeyId);
  if (!journey) throw new Error("Journey not found.");
  await assertParticipantHomeworkAccess(viewer, journey, homework);
  const existing = await store().getSessionHomeworkResponse(homeworkId, viewer.id);
  if (existing && !partnerMayEditHomeworkAnswers({ homework, response: existing })) {
    throw new Error("Homework already submitted.");
  }
  const allowedKeys = new Set<string>();
  for (const activity of homework.activities) {
    for (const q of activity.questions) {
      allowedKeys.add(`${activity.id}:${q.id}`);
    }
  }
  const merged = { ...(existing?.answers ?? {}) };
  for (const [key, value] of Object.entries(patch)) {
    if (!allowedKeys.has(key)) continue;
    merged[key] = String(value ?? "");
  }
  const now = new Date().toISOString();
  const record: MarriageSessionHomeworkResponseRecord = {
    homeworkId,
    userId: viewer.id,
    answers: merged,
    lastSavedAt: now,
    submittedAt: existing?.submittedAt,
    reviewStatus: normalizeHomeworkReviewStatus(existing?.reviewStatus),
    revisionNote: existing?.revisionNote ?? null,
    reviewedAt: existing?.reviewedAt ?? null,
  };
  await store().saveSessionHomeworkResponse(record);
  return { lastSavedAt: now, progress: { answered: countAnsweredQuestions(homework.activities, merged), total: totalWritableQuestions(homework.activities) } };
}

export async function submitParticipantHomework(viewer: PublicMember, homeworkId: string) {
  await assertNotLegacyHomeworkListItem(homeworkId);
  const homework = await store().getSessionHomeworkById(homeworkId);
  if (!homework) throw new Error("Homework not found.");
  if (homework.status !== "released") throw new Error("This homework is not available yet.");
  const journey = await store().getJourneyById(homework.journeyId);
  if (!journey) throw new Error("Journey not found.");
  await assertParticipantHomeworkAccess(viewer, journey, homework);
  const existing = await store().getSessionHomeworkResponse(homeworkId, viewer.id);
  const answers = existing?.answers ?? {};
  if (!homeworkIsCompleteForSubmit(homework.activities, answers)) {
    throw new Error("Please answer all reflection questions before submitting.");
  }
  const priorStatus = normalizeHomeworkReviewStatus(existing?.reviewStatus);
  const isResubmit = Boolean(existing?.submittedAt) && priorStatus === "revision_requested";
  if (existing?.submittedAt && !isResubmit && !partnerMayEditHomeworkAnswers({ homework, response: existing })) {
    throw new Error("Already submitted.");
  }
  const now = new Date().toISOString();
  const nextReviewStatus: MarriageHomeworkCounselorReviewStatus = isResubmit ? "resubmitted" : "submitted";
  await store().saveSessionHomeworkResponse({
    homeworkId,
    userId: viewer.id,
    answers,
    lastSavedAt: now,
    submittedAt: now,
    reviewStatus: nextReviewStatus,
    revisionNote: isResubmit ? existing?.revisionNote ?? null : null,
    reviewedAt: null,
  });
  const { notifyCounselorHomeworkSubmitted, notifyCounselorHomeworkReviewPending, notifyCounselorHomeworkResubmitted } =
    await import("@/lib/marriage-prep-notification-triggers");
  if (isResubmit) {
    void notifyCounselorHomeworkResubmitted(journey, homeworkId, viewer.id);
  } else {
    void notifyCounselorHomeworkSubmitted(journey, homeworkId, viewer.id);
    void notifyCounselorHomeworkReviewPending(journey, homeworkId, viewer.id);
  }
  return { submittedAt: now, reviewStatus: nextReviewStatus };
}

export async function assertSelfPacedSessionHomeworkApproved(journeyId: string, sessionKey: string) {
  const journey = await store().getJourneyById(journeyId);
  if (!journey?.participantAId || !journey.participantBId) return;
  const rows = await store().listSessionHomeworkForJourney(journeyId);
  const linked = rows.filter((h) => h.status === "released" && h.sessionId === sessionKey);
  for (const hw of linked) {
    const responses = await store().listSessionHomeworkResponses(hw.id);
    const blocker = homeworkBlocksSessionApproval(
      hw,
      responses,
      journey.participantAId,
      journey.participantBId,
    );
    if (blocker) throw new Error(blocker);
  }
}

export async function counselorRequestHomeworkRevision(
  viewer: PublicMember,
  homeworkId: string,
  partnerUserId: string,
  revisionNote: string,
) {
  const homework = await store().getSessionHomeworkById(homeworkId);
  if (!homework) throw new Error("Homework not found.");
  const journey = await store().getJourneyById(homework.journeyId);
  if (!journey) throw new Error("Journey not found.");
  await assertHomeworkManager(viewer, journey);
  const note = revisionNote.trim();
  if (!note) throw new Error("Describe what needs to be revised.");
  const [aId, bId] = await partnerIds(journey);
  if (partnerUserId !== aId && partnerUserId !== bId) {
    throw new Error("Invalid partner for this homework.");
  }
  const response = await store().getSessionHomeworkResponse(homeworkId, partnerUserId);
  if (!response?.submittedAt) throw new Error("Partner has not submitted this homework yet.");
  const status = normalizeHomeworkReviewStatus(response.reviewStatus);
  if (status === "approved") throw new Error("Homework is already approved.");
  const now = new Date().toISOString();
  await store().saveSessionHomeworkResponse({
    ...response,
    reviewStatus: "revision_requested",
    revisionNote: note,
    reviewedAt: now,
  });
  const { notifyCoupleHomeworkRevisionRequested } = await import(
    "@/lib/marriage-prep-notification-triggers"
  );
  void notifyCoupleHomeworkRevisionRequested(journey, homeworkId, partnerUserId);
  return { ok: true as const, reviewStatus: "revision_requested" as const };
}

export async function counselorApproveHomeworkSubmission(
  viewer: PublicMember,
  homeworkId: string,
  partnerUserId: string,
) {
  const homework = await store().getSessionHomeworkById(homeworkId);
  if (!homework) throw new Error("Homework not found.");
  const journey = await store().getJourneyById(homework.journeyId);
  if (!journey) throw new Error("Journey not found.");
  await assertHomeworkManager(viewer, journey);
  const [aId, bId] = await partnerIds(journey);
  if (partnerUserId !== aId && partnerUserId !== bId) {
    throw new Error("Invalid partner for this homework.");
  }
  const response = await store().getSessionHomeworkResponse(homeworkId, partnerUserId);
  if (!response?.submittedAt) throw new Error("Partner has not submitted this homework yet.");
  const status = normalizeHomeworkReviewStatus(response.reviewStatus);
  if (status === "approved") return { ok: true as const, reviewStatus: "approved" as const };
  if (status !== "submitted" && status !== "resubmitted") {
    throw new Error("Approve only after the partner submits or resubmits homework.");
  }
  const now = new Date().toISOString();
  await store().saveSessionHomeworkResponse({
    ...response,
    reviewStatus: "approved",
    reviewedAt: now,
  });
  return { ok: true as const, reviewStatus: "approved" as const };
}
