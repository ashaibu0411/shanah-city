import { randomUUID } from "crypto";
import type { PublicMember } from "@/lib/auth-types";
import { getUserById } from "@/lib/auth-server";
import {
  assertJourneyParticipant,
  assertMarriageCounselorRole,
  isJourneyCounselorAccessRevoked,
  isMarriageCurriculumAdmin,
  viewerIsAssignedClinicalCounselor,
} from "@/lib/marriage-counseling-access";
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
  MarriageSessionHomeworkRecord,
  MarriageSessionHomeworkResponseRecord,
} from "@/lib/marriage-homework-types";
import {
  homeworkIsCompleteForSubmit,
  participantHomeworkStatus,
  totalWritableQuestions,
  countAnsweredQuestions,
} from "@/lib/marriage-homework-status";
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
      });
    }
  }
  return {
    homework,
    partnerViews,
  };
}

export async function listReleasedHomeworkForParticipant(viewer: PublicMember, journeyId: string) {
  const journey = await store().getJourneyById(journeyId);
  if (!journey) throw new Error("Journey not found.");
  await assertJourneyParticipant(journey, viewer.id);
  const rows = await store().listSessionHomeworkForJourney(journeyId);
  const released = rows.filter((h) => h.status === "released");
  const now = Date.now();
  const views: MarriageHubSessionHomeworkView[] = [];
  for (const hw of released) {
    const response = await store().getSessionHomeworkResponse(hw.id, viewer.id);
    const status = participantHomeworkStatus({ homework: hw, response, nowMs: now });
    const timing = homeworkTemplateMeta(hw.templateKey);
    views.push({
      id: hw.id,
      title: hw.title,
      dueAt: hw.dueAt,
      dueAtTimeZone: hw.dueAtTimeZone,
      status,
      submitted: Boolean(response?.submittedAt),
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

export async function getParticipantHomeworkWorkspace(viewer: PublicMember, homeworkId: string) {
  const homework = await store().getSessionHomeworkById(homeworkId);
  if (!homework) throw new Error("Homework not found.");
  if (homework.status !== "released") throw new Error("This homework is not available yet.");
  const journey = await store().getJourneyById(homework.journeyId);
  if (!journey) throw new Error("Journey not found.");
  await assertJourneyParticipant(journey, viewer.id);
  const response: MarriageSessionHomeworkResponseRecord =
    (await store().getSessionHomeworkResponse(homeworkId, viewer.id)) ?? {
      homeworkId,
      userId: viewer.id,
      answers: {},
      lastSavedAt: new Date().toISOString(),
    };
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
    },
    progress: { answered, total },
    status: participantHomeworkStatus({ homework, response }),
    counselorFeedback: homework.partnerFeedback?.[viewer.id],
  };
}

export async function saveParticipantHomeworkDraft(
  viewer: PublicMember,
  homeworkId: string,
  patch: Record<string, string>,
) {
  const homework = await store().getSessionHomeworkById(homeworkId);
  if (!homework) throw new Error("Homework not found.");
  if (homework.status !== "released") throw new Error("This homework is not available yet.");
  const journey = await store().getJourneyById(homework.journeyId);
  if (!journey) throw new Error("Journey not found.");
  await assertJourneyParticipant(journey, viewer.id);
  const existing = await store().getSessionHomeworkResponse(homeworkId, viewer.id);
  if (existing?.submittedAt && !homework.reopenedAt) {
    throw new Error("Homework already submitted.");
  }
  if (existing?.submittedAt && homework.reopenedAt) {
    const reopenedMs = new Date(homework.reopenedAt).getTime();
    const submittedMs = new Date(existing.submittedAt).getTime();
    if (submittedMs > reopenedMs) {
      throw new Error("Homework already submitted.");
    }
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
  const record = {
    homeworkId,
    userId: viewer.id,
    answers: merged,
    lastSavedAt: now,
    submittedAt: existing?.submittedAt,
  };
  await store().saveSessionHomeworkResponse(record);
  return { lastSavedAt: now, progress: { answered: countAnsweredQuestions(homework.activities, merged), total: totalWritableQuestions(homework.activities) } };
}

export async function submitParticipantHomework(viewer: PublicMember, homeworkId: string) {
  const homework = await store().getSessionHomeworkById(homeworkId);
  if (!homework) throw new Error("Homework not found.");
  if (homework.status !== "released") throw new Error("This homework is not available yet.");
  const journey = await store().getJourneyById(homework.journeyId);
  if (!journey) throw new Error("Journey not found.");
  await assertJourneyParticipant(journey, viewer.id);
  const existing = await store().getSessionHomeworkResponse(homeworkId, viewer.id);
  const answers = existing?.answers ?? {};
  if (!homeworkIsCompleteForSubmit(homework.activities, answers)) {
    throw new Error("Please answer all reflection questions before submitting.");
  }
  if (existing?.submittedAt && homework.reopenedAt) {
    const reopenedMs = new Date(homework.reopenedAt).getTime();
    const submittedMs = new Date(existing.submittedAt).getTime();
    if (submittedMs > reopenedMs) {
      throw new Error("Already submitted.");
    }
  } else if (existing?.submittedAt) {
    throw new Error("Already submitted.");
  }
  const now = new Date().toISOString();
  await store().saveSessionHomeworkResponse({
    homeworkId,
    userId: viewer.id,
    answers,
    lastSavedAt: now,
    submittedAt: now,
  });
  const { notifyCounselorHomeworkSubmitted, notifyCounselorHomeworkReviewPending } = await import(
    "@/lib/marriage-prep-notification-triggers"
  );
  void notifyCounselorHomeworkSubmitted(journey, homeworkId, viewer.id);
  void notifyCounselorHomeworkReviewPending(journey, homeworkId, viewer.id);
  return { submittedAt: now };
}
