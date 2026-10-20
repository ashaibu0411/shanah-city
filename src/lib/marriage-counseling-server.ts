import type { PublicMember } from "@/lib/auth-types";
import { getUserById } from "@/lib/auth-server";
import { getCoupleLinkStatus } from "@/lib/couple-link-server";
import { partnerIdFromLink } from "@/lib/couple-link-utils";
import {
  assertJourneyParticipant,
  isMarriageCounselor,
} from "@/lib/marriage-counseling-access";
import { MARRIAGE_CONSENT_VERSION, MARRIAGE_COUNSELING_CONTENT_VERSION } from "@/lib/marriage-counseling-curriculum";
import {
  getActiveContentVersionLabel,
  getModuleDefinition,
  getModuleForContentVersion,
  listModulesForJourney,
} from "@/lib/marriage-curriculum-service";
import { getPendingInviteCodeForJourney } from "@/lib/marriage-counseling-invite-server";
import { isMarriageCurriculumAdmin } from "@/lib/marriage-counseling-access";
import { resolveJourneyPartnerId } from "@/lib/marriage-counseling-participants";
import { buildSharedComparisonItems } from "@/lib/marriage-counseling-comparison-utils";
import { attachDiscussionToComparisonItems } from "@/lib/marriage-discussion-utils";
import { validateBudgetAnswer } from "@/lib/marriage-budget-utils";
import {
  notifyMarriageComparisonReady,
  notifyMarriagePartnerJoined,
  notifyMarriagePartnerSubmitted,
} from "@/lib/marriage-counseling-notify";
import type {
  MarriageComparisonItem,
  MarriageHubModuleProgress,
  MarriageHubSummary,
  MarriageHubAssignmentView,
  MarriageAssessmentResponseRecord,
  MarriageCounselingSessionRecord,
  MarriageJourneyConsentRecord,
  MarriageProgramType,
  MarriageQuestionDefinition,
  MarriageDiscussionMarkRecord,
} from "@/lib/marriage-counseling-types";
import { marriageStore } from "@/lib/stores/marriage-counseling-store";

const store = () => marriageStore();

async function resolveActiveJourney(viewer: PublicMember) {
  return store().getActiveJourneyForUser(viewer.id);
}

function partnerStatus(
  response: { status: string } | null,
): MarriageHubModuleProgress["partnerStatus"] {
  if (!response) return "not_started";
  if (response.status === "submitted") return "submitted";
  return "draft";
}

function myStatus(response: { status: string } | null): MarriageHubModuleProgress["myStatus"] {
  if (!response) return "not_started";
  if (response.status === "submitted") return "submitted";
  return "draft";
}

export async function getMarriageHubSummary(viewer: PublicMember): Promise<MarriageHubSummary> {
  const linkStatus = await getCoupleLinkStatus(viewer);
  const activeLink = linkStatus.link?.status === "active" ? linkStatus.link : null;
  const coupleLinkActive = Boolean(activeLink);
  const pendingPartnerLink = Boolean(linkStatus.pendingIncoming || (linkStatus.link?.status === "pending"));

  let journey = await resolveActiveJourney(viewer);
  let partnerName = activeLink?.partnerName ?? null;
  let myConsent = false;
  let partnerConsent = false;
  let partnerJoined = false;
  let modules: MarriageHubModuleProgress[] = [];
  let nextSession = null;
  let programType: MarriageProgramType | null = null;
  let pendingInviteCode: string | null = null;
  let upcomingHomework: MarriageHubAssignmentView[] = [];
  const contentVersion = await getActiveContentVersionLabel();

  if (journey) {
    programType = journey.programType;
    const consents = await store().getConsentsForJourney(journey.id);
    myConsent = consents.some(
      (c: MarriageJourneyConsentRecord) =>
        c.userId === viewer.id && c.consentVersion === MARRIAGE_CONSENT_VERSION,
    );
    const partnerId = await resolveJourneyPartnerId(journey, viewer.id);
    partnerJoined = Boolean(journey.participantBId || partnerId);
    if (partnerId) {
      const partner = await getUserById(partnerId);
      partnerName = partner?.name ?? partnerName;
      partnerConsent = consents.some(
        (c: MarriageJourneyConsentRecord) =>
          c.userId === partnerId && c.consentVersion === MARRIAGE_CONSENT_VERSION,
      );
    } else if (!journey.participantBId) {
      pendingInviteCode = await getPendingInviteCodeForJourney(journey.id);
    }

    const moduleList = await listModulesForJourney(journey);
    for (const mod of moduleList) {
      const myResponse = await store().getResponse(journey.id, mod.id, viewer.id);
      const partnerResponse = partnerId
        ? await store().getResponse(journey.id, mod.id, partnerId)
        : null;
      const versionKey = myResponse?.contentVersion ?? contentVersion;
      const unlock = await store().getUnlock(journey.id, mod.id, versionKey);
      modules.push({
        moduleId: mod.id,
        title: mod.title,
        summary: mod.summary,
        myStatus: myStatus(myResponse),
        partnerStatus: partnerStatus(partnerResponse),
        comparisonReady: Boolean(unlock),
        discussionAvailable: Boolean(unlock),
      });
    }

    const sessions = await store().listSessions(journey.id);
    const now = Date.now();
    nextSession =
      sessions.find(
        (s: MarriageCounselingSessionRecord) =>
          s.status !== "cancelled" && new Date(s.scheduledAt).getTime() >= now,
      ) ?? null;

    const assignments = await store().listAssignments(journey.id);
    upcomingHomework = assignments
      .filter((a) => a.dueAt && !a.completedByUserIds.includes(viewer.id))
      .map((a) => ({
        id: a.id,
        title: a.title,
        dueAt: a.dueAt,
        completed: false,
        moduleId: a.moduleId,
      }));
  }

  const isCounselor = await isMarriageCounselor(viewer);
  const isCurriculumAdmin = await isMarriageCurriculumAdmin(viewer);
  const { canSubmitCounselorAssignmentRequest, isSeniorPastor } = await import(
    "@/lib/marriage-counselor-assignment-authority"
  );
  const canSubmitCounselorAssignment = await canSubmitCounselorAssignmentRequest(viewer);
  const isSeniorPastorCounselorApprover = await isSeniorPastor(viewer);

  const { buildStage2Dashboard } = await import("@/lib/marriage-stage2-server");
  const stage2 = await buildStage2Dashboard(viewer);

  return {
    viewerId: viewer.id,
    journey,
    programType,
    partnerName,
    coupleLinkActive,
    pendingPartnerLink,
    myConsent,
    partnerConsent,
    partnerJoined,
    modules,
    nextSession,
    upcomingHomework,
    pendingInviteCode,
    isCounselor,
    isCurriculumAdmin,
    canSubmitCounselorAssignment,
    isSeniorPastorCounselorApprover,
    contentVersion,
    stage2: stage2 ?? undefined,
  };
}

export async function startMarriageJourney(viewer: PublicMember, programType: MarriageProgramType) {
  const linkStatus = await getCoupleLinkStatus(viewer);
  if (!linkStatus.link || linkStatus.link.status !== "active") {
    throw new Error("Link your spouse account before starting a journey.");
  }
  const link = await import("@/lib/couple-link-server").then((m) =>
    m.getCoupleLinkById(linkStatus.link!.id),
  );
  if (!link) throw new Error("Couple link not found.");

  const existing = await store().getActiveJourneyForCoupleLink(link.id);
  if (existing) return existing;

  const curriculumVersion = await getActiveContentVersionLabel();
  const moduleList = await listModulesForJourney({
    id: "temp",
    coupleLinkId: link.id,
    programType,
    status: "active",
    currentModuleId: null,
    counselorUserId: null,
    createdBy: viewer.id,
    createdAt: "",
    updatedAt: "",
    pairingMode: "spouse_link",
    participantAId: viewer.id,
    participantBId: partnerIdFromLink(link, viewer.id) ?? null,
    curriculumVersion,
  });
  const firstModule = moduleList[0]?.id ?? null;
  const journey = await store().createJourney({
    coupleLinkId: link.id,
    programType,
    status: "active",
    currentModuleId: firstModule,
    counselorUserId: null,
    createdBy: viewer.id,
    pairingMode: "spouse_link",
    participantAId: link.userAId,
    participantBId: link.userBId,
    curriculumVersion,
  });

  await store().upsertConsent({
    journeyId: journey.id,
    userId: viewer.id,
    consentVersion: MARRIAGE_CONSENT_VERSION,
    consentedAt: new Date().toISOString(),
  });

  const partnerId = partnerIdFromLink(link, viewer.id);
  if (partnerId) notifyMarriagePartnerJoined(partnerId);

  return journey;
}

export async function recordMarriageConsent(viewer: PublicMember, journeyId: string) {
  const journey = await store().getJourneyById(journeyId);
  if (!journey) throw new Error("Journey not found.");
  await assertJourneyParticipant(journey, viewer.id);
  await store().upsertConsent({
    journeyId,
    userId: viewer.id,
    consentVersion: MARRIAGE_CONSENT_VERSION,
    consentedAt: new Date().toISOString(),
  });
  return { ok: true };
}

export async function getAssessmentForViewer(
  viewer: PublicMember,
  moduleId: string,
) {
  const hub = await getMarriageHubSummary(viewer);
  if (!hub.journey) throw new Error("No active journey.");
  if (!hub.myConsent) throw new Error("Complete consent before assessments.");

  const mod = await getModuleDefinition(moduleId);
  if (!mod) throw new Error("Module not found.");
  const { marriageStage2IntimacyModuleAccessible, isMarriageStage2IntimacyModule } = await import(
    "@/lib/marriage-stage2-feature"
  );
  if (isMarriageStage2IntimacyModule(moduleId) && !marriageStage2IntimacyModuleAccessible(moduleId)) {
    throw new Error("This module is awaiting pastoral content approval.");
  }

  const myResponse = await store().getResponse(hub.journey.id, moduleId, viewer.id);
  let partnerProgress: { status: string } = { status: "not_started" };
  try {
    const { partnerId } = await assertJourneyParticipant(hub.journey, viewer.id);
    const partnerResponse = await store().getResponse(hub.journey.id, moduleId, partnerId);
    partnerProgress = {
      status:
        partnerResponse?.status === "submitted"
          ? "submitted"
          : partnerResponse
            ? "in_progress"
            : "not_started",
    };
  } catch {
    partnerProgress = { status: "not_started" };
  }

  const contentVersion = myResponse?.contentVersion ?? hub.contentVersion;
  const unlock = await store().getUnlock(hub.journey.id, moduleId, contentVersion);

  return {
    module: mod,
    contentVersion,
    journeyId: hub.journey.id,
    myResponse: myResponse
      ? {
          status: myResponse.status,
          answers: myResponse.answers,
          lastSavedAt: myResponse.lastSavedAt,
          submittedAt: myResponse.submittedAt,
        }
      : null,
    partnerProgress,
    comparisonUnlocked: Boolean(unlock),
  };
}

export async function saveAssessmentDraft(
  viewer: PublicMember,
  moduleId: string,
  answers: Record<string, unknown>,
) {
  const assessment = await getAssessmentForViewer(viewer, moduleId);
  if (assessment.myResponse?.status === "submitted") {
    throw new Error("This assessment is submitted. Contact your counselor to revise.");
  }

  const mod = assessment.module;
  validateAnswers(mod.questions, answers, false);

  const now = new Date().toISOString();
  await store().applyAssessmentDraftPatch({
    journeyId: assessment.journeyId,
    moduleId,
    userId: viewer.id,
    contentVersion: assessment.contentVersion,
    patch: answers,
    questions: mod.questions,
    lastSavedAt: now,
  });

  const journey = await store().getJourneyById(assessment.journeyId);
  if (journey && journey.currentModuleId !== moduleId) {
    await store().updateJourney(journey.id, { currentModuleId: moduleId });
  }

  return { lastSavedAt: now };
}

export async function submitAssessment(viewer: PublicMember, moduleId: string) {
  const assessment = await getAssessmentForViewer(viewer, moduleId);
  const existing = await store().getResponse(assessment.journeyId, moduleId, viewer.id);
  if (!existing) throw new Error("Save your answers before submitting.");
  if (existing.status === "submitted") throw new Error("Already submitted.");

  validateAnswers(assessment.module.questions, existing.answers, true);

  const now = new Date().toISOString();
  await store().saveResponse({
    ...existing,
    status: "submitted",
    submittedAt: now,
    lastSavedAt: now,
  });

  const { partnerId } = await assertJourneyParticipant(
    (await store().getJourneyById(assessment.journeyId))!,
    viewer.id,
  );
  notifyMarriagePartnerSubmitted(partnerId);

  const partnerResponse = await store().getResponse(assessment.journeyId, moduleId, partnerId);
  if (partnerResponse?.status === "submitted") {
    await maybeUnlockComparison(
      assessment.journeyId,
      moduleId,
      existing.contentVersion,
      [viewer.id, partnerId],
    );
  }

  return { submittedAt: now };
}

async function maybeUnlockComparison(
  journeyId: string,
  moduleId: string,
  contentVersion: string,
  notifyUserIds: string[],
) {
  const unlock = await store().getUnlock(journeyId, moduleId, contentVersion);
  if (unlock) return unlock;

  const record = {
    journeyId,
    moduleId,
    contentVersion,
    unlockedAt: new Date().toISOString(),
  };
  await store().createUnlock(record);
  const mod = await getModuleForContentVersion(moduleId, contentVersion);
  notifyMarriageComparisonReady(notifyUserIds, mod?.title ?? "Module");
  return record;
}

function validateAnswers(
  questions: MarriageQuestionDefinition[],
  answers: Record<string, unknown>,
  submitting: boolean,
) {
  for (const question of questions) {
    if (!submitting && !question.required) continue;
    const value = answers[question.id];
    const skipped = value === "__skip__" || value === "";
    if (question.allowSkip && skipped) continue;
    if (!submitting) continue;
    if (question.required && (value === undefined || value === null || skipped)) {
      throw new Error(`Please answer: ${question.prompt.slice(0, 80)}…`);
    }
    if (question.type === "budget_worksheet" && question.required && submitting) {
      const check = validateBudgetAnswer(value);
      if (!check.ok) throw new Error(check.error);
    }
    if (question.type === "partner_prediction" && question.required && submitting) {
      const choice =
        typeof value === "object" && value && "choice" in (value as object)
          ? (value as { choice: string }).choice
          : value;
      if (!choice) throw new Error(`Please answer: ${question.prompt.slice(0, 80)}…`);
    }
  }
}

async function loadComparisonBundle(viewer: PublicMember, moduleId: string) {
  const hub = await getMarriageHubSummary(viewer);
  if (!hub.journey) throw new Error("No active journey.");

  const { partnerId } = await assertJourneyParticipant(hub.journey, viewer.id);
  const myResponse = await store().getResponse(hub.journey.id, moduleId, viewer.id);
  const partnerResponse = await store().getResponse(hub.journey.id, moduleId, partnerId);
  const contentVersion = myResponse?.contentVersion ?? partnerResponse?.contentVersion ?? hub.contentVersion;
  const unlock = await store().getUnlock(hub.journey.id, moduleId, contentVersion);
  if (!unlock) throw new Error("Comparison is not available yet.");

  const mod = await getModuleForContentVersion(moduleId, contentVersion);
  if (!mod) throw new Error("Module not found.");
  if (myResponse?.status !== "submitted" || partnerResponse?.status !== "submitted") {
    throw new Error("Both partners must submit before comparing.");
  }

  const { isMarriageStage2Enabled } = await import("@/lib/marriage-stage2-feature");
  let items: MarriageComparisonItem[];
  if (isMarriageStage2Enabled()) {
    const consents = await store().listSharingConsents(hub.journey.id, moduleId);
    const { buildComparisonItemsWithConsent } = await import("@/lib/marriage-stage2-activity-engine");
    items = buildComparisonItemsWithConsent(
      mod.questions,
      myResponse.answers,
      partnerResponse.answers,
      viewer.id,
      partnerId,
      hub.journey.id,
      moduleId,
      consents,
    );
  } else {
    items = buildSharedComparisonItems(mod.questions, myResponse.answers, partnerResponse.answers);
  }

  const marks = await store().getDiscussionMarks(hub.journey.id, moduleId);

  return {
    hub,
    partnerId,
    contentVersion,
    moduleTitle: mod.title,
    items,
    marks,
    journeyId: hub.journey.id,
  };
}

function assertEligibleComparisonQuestion(items: MarriageComparisonItem[], questionId: string) {
  const item = items.find((i) => i.questionId === questionId);
  if (!item) {
    throw new Error("This question is not available for couple discussion.");
  }
  return item;
}

export async function getComparisonForViewer(viewer: PublicMember, moduleId: string) {
  const bundle = await loadComparisonBundle(viewer, moduleId);
  const items = attachDiscussionToComparisonItems(bundle.items, bundle.marks);

  return {
    moduleTitle: bundle.moduleTitle,
    items,
    marks: bundle.marks,
    journeyId: bundle.journeyId,
    contentVersion: bundle.contentVersion,
    viewerId: viewer.id,
    partnerId: bundle.partnerId,
  };
}

export async function markDiscussion(
  viewer: PublicMember,
  moduleId: string,
  questionId: string,
) {
  const bundle = await loadComparisonBundle(viewer, moduleId);
  assertEligibleComparisonQuestion(bundle.items, questionId);

  const existing = bundle.marks.find(
    (m) => m.questionId === questionId && m.markedByUserId === viewer.id,
  );

  const now = new Date().toISOString();
  const payload: MarriageDiscussionMarkRecord = {
    id: existing?.id ?? `md-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    journeyId: bundle.journeyId,
    moduleId,
    questionId,
    markedByUserId: viewer.id,
    markedAt: existing?.sharedNote?.trim() ? existing.markedAt : now,
    discussedAt: now,
  };
  if (existing?.sharedNote?.trim()) {
    payload.sharedNote = existing.sharedNote;
  }
  return store().upsertDiscussionMark(payload);
}

export async function saveDiscussionNote(
  viewer: PublicMember,
  moduleId: string,
  questionId: string,
  sharedNote: string,
) {
  const body = sharedNote.trim();
  if (!body) throw new Error("Note cannot be empty.");

  const bundle = await loadComparisonBundle(viewer, moduleId);
  assertEligibleComparisonQuestion(bundle.items, questionId);

  const forQuestion = bundle.marks.filter((m) => m.questionId === questionId);
  const existing = forQuestion.find((m) => m.markedByUserId === viewer.id);
  if (!forQuestion.length) {
    throw new Error("Mark this topic as discussed before adding a shared note.");
  }

  return store().upsertDiscussionMark({
    id: existing?.id ?? `md-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    journeyId: bundle.journeyId,
    moduleId,
    questionId,
    markedByUserId: viewer.id,
    sharedNote: body,
    markedAt: existing?.markedAt ?? new Date().toISOString(),
    discussedAt: existing?.discussedAt,
  });
}

export async function reopenDiscussion(
  viewer: PublicMember,
  moduleId: string,
  questionId: string,
) {
  const bundle = await loadComparisonBundle(viewer, moduleId);
  assertEligibleComparisonQuestion(bundle.items, questionId);

  await store().reopenDiscussionForQuestion(bundle.journeyId, moduleId, questionId);
  return { ok: true as const };
}

export async function listJournal(viewer: PublicMember) {
  const hub = await getMarriageHubSummary(viewer);
  if (!hub.journey) return [];
  return store().listJournal(hub.journey.id, viewer.id);
}

export async function addJournalEntry(
  viewer: PublicMember,
  input: {
    visibility: "shared" | "private";
    kind: import("@/lib/marriage-counseling-types").MarriageJournalKind;
    body: string;
    moduleId?: string;
  },
) {
  const hub = await getMarriageHubSummary(viewer);
  if (!hub.journey) throw new Error("No active journey.");
  await assertJourneyParticipant(hub.journey, viewer.id);
  const now = new Date().toISOString();
  return store().addJournalEntry({
    id: `mjn-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    journeyId: hub.journey.id,
    authorId: viewer.id,
    authorName: viewer.name,
    visibility: input.visibility,
    kind: input.kind,
    body: input.body.trim(),
    moduleId: input.moduleId,
    createdAt: now,
    updatedAt: now,
  });
}

export async function getCounselorDashboard(viewer: PublicMember) {
  const { getEnhancedCounselorDashboard } = await import("@/lib/marriage-counseling-counselor-server");
  return getEnhancedCounselorDashboard(viewer);
}
