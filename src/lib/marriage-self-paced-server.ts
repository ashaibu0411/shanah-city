import { randomUUID } from "crypto";
import type { PublicMember } from "@/lib/auth-types";
import {
  assertClinicalCounselorForJourney,
  assertJourneyParticipantLoose,
  viewerIsAssignedClinicalCounselor,
} from "@/lib/marriage-counseling-access";
import { MARRIAGE_CONSENT_VERSION } from "@/lib/marriage-counseling-curriculum";
import type { MarriageCounselingDeliveryMode } from "@/lib/marriage-counseling-types";
import {
  journeyRequiresSelfPacedReviewForSessionCompletion,
  journeyUsesSelfPacedCounselingReview,
  parseCounselingDeliveryMode,
} from "@/lib/marriage-counseling-delivery-mode";
import { getPremaritalSessionDefinition } from "@/lib/marriage-premarital-eight-session-program";
import { updatePremaritalSessionStatus } from "@/lib/marriage-premarital-program-server";
import type {
  MarriageCounselorStructuredFeedback,
  MarriageSelfPacedSessionReviewRecord,
  SelfPacedWorkflowStatus,
} from "@/lib/marriage-self-paced-types";
import { marriageStore } from "@/lib/stores/marriage-counseling-store";

const store = () => marriageStore();

async function auditSession(
  journeyId: string,
  sessionKey: string,
  action: string,
  actorUserId: string,
  previousStatus?: string | null,
  newStatus?: string | null,
  meta?: Record<string, unknown>,
) {
  if (typeof store().appendSelfPacedSessionAudit !== "function") return;
  await store().appendSelfPacedSessionAudit({
    journeyId,
    sessionKey,
    action,
    actorUserId,
    previousStatus,
    newStatus,
    metaJson: meta ? JSON.stringify(meta) : null,
  });
}

async function applyCounselingDeliveryModeChange(
  journeyId: string,
  mode: MarriageCounselingDeliveryMode,
  actorUserId: string,
  note?: string | null,
) {
  const journey = await store().getJourneyById(journeyId);
  if (!journey) throw new Error("Journey not found.");
  const previous = journey.counselingDeliveryMode ?? null;
  if (previous === mode) return journey;
  await store().updateJourney(journeyId, { counselingDeliveryMode: mode });
  if (typeof store().appendCounselingDeliveryModeAudit === "function") {
    await store().appendCounselingDeliveryModeAudit({
      journeyId,
      previousMode: previous,
      newMode: mode,
      actorUserId,
      note: note ?? null,
    });
  }
  return (await store().getJourneyById(journeyId))!;
}

export async function setJourneyCounselingDeliveryMode(
  viewer: PublicMember,
  journeyId: string,
  mode: MarriageCounselingDeliveryMode,
  note?: string,
) {
  const journey = await store().getJourneyById(journeyId);
  if (!journey) throw new Error("Journey not found.");
  await assertClinicalCounselorForJourney(viewer, journey);
  return applyCounselingDeliveryModeChange(journeyId, mode, viewer.id, note);
}

/** Participants (with consent) or assigned counselor may set or change counseling mode. */
export async function setCoupleCounselingDeliveryMode(
  viewer: PublicMember,
  journeyId: string,
  mode: MarriageCounselingDeliveryMode,
) {
  const journey = await store().getJourneyById(journeyId);
  if (!journey) throw new Error("Journey not found.");
  if (viewerIsAssignedClinicalCounselor(viewer.id, journey)) {
    return setJourneyCounselingDeliveryMode(viewer, journeyId, mode);
  }
  await assertJourneyParticipantLoose(journey, viewer.id);
  const consents = await store().getConsentsForJourney(journeyId);
  const hasConsent = consents.some(
    (c) => c.userId === viewer.id && c.consentVersion === MARRIAGE_CONSENT_VERSION,
  );
  if (!hasConsent) {
    throw new Error("Record your consent before choosing a counseling mode.");
  }
  return applyCounselingDeliveryModeChange(journeyId, mode, viewer.id, null);
}

export async function buildCoupleCounselingExperienceView(
  viewer: PublicMember,
  journey: import("@/lib/marriage-counseling-types").MarriageCounselingJourneyRecord,
  options: { myConsent: boolean },
) {
  const mode = journey.counselingDeliveryMode ?? null;
  const { counselingDeliveryModeLabel, journeyUsesSelfPacedCounselingReview, SELF_PACED_ASYNC_DISCLAIMER } =
    await import("@/lib/marriage-counseling-delivery-mode");
  let canChangeDeliveryMode = false;
  if (options.myConsent) {
    if (viewerIsAssignedClinicalCounselor(viewer.id, journey)) {
      canChangeDeliveryMode = true;
    } else {
      try {
        await assertJourneyParticipantLoose(journey, viewer.id);
        canChangeDeliveryMode = true;
      } catch {
        canChangeDeliveryMode = false;
      }
    }
  }
  const selfPacedSessions: Array<{
    sessionKey: string;
    workflowStatus: string;
    readyForReviewAt?: string | null;
    feedbackPublishedAt?: string | null;
    approvedAt?: string | null;
  }> = [];
  if (journeyUsesSelfPacedCounselingReview(journey) && typeof store().listSelfPacedSessionReviewsForJourney === "function") {
    const reviews = await store().listSelfPacedSessionReviewsForJourney(journey.id);
    for (const r of reviews) {
      selfPacedSessions.push({
        sessionKey: r.sessionKey,
        workflowStatus: r.workflowStatus,
        readyForReviewAt: r.readyForReviewAt,
        feedbackPublishedAt: r.feedbackPublishedAt,
        approvedAt: r.approvedAt,
      });
    }
  }
  return {
    deliveryMode: mode,
    deliveryModeLabel: counselingDeliveryModeLabel(mode),
    canChangeDeliveryMode,
    selfPacedDisclaimer: mode === "SELF_PACED" || mode === "HYBRID" ? SELF_PACED_ASYNC_DISCLAIMER : undefined,
    selfPacedSessions,
  };
}

function requiredModuleIdsForSession(sessionKey: string, override?: string[]) {
  if (override?.length) return override;
  const def = getPremaritalSessionDefinition(sessionKey);
  if (!def) throw new Error("Unknown session.");
  return def.linkedModules.filter((m) => m.recommendedForSession).map((m) => m.moduleId);
}

async function bothPartnersSubmitted(journeyId: string, moduleIds: string[]) {
  const journey = await store().getJourneyById(journeyId);
  if (!journey?.participantAId || !journey.participantBId) return false;
  for (const moduleId of moduleIds) {
    const responses = await store().listResponsesForJourneyModule(journeyId, moduleId);
    const a = responses.find((r) => r.userId === journey.participantAId);
    const b = responses.find((r) => r.userId === journey.participantBId);
    if (a?.status !== "submitted" || b?.status !== "submitted") return false;
  }
  return moduleIds.length > 0;
}

export async function counselorAssignSelfPacedSession(
  viewer: PublicMember,
  journeyId: string,
  sessionKey: string,
  moduleIds?: string[],
) {
  const journey = await store().getJourneyById(journeyId);
  if (!journey) throw new Error("Journey not found.");
  await assertClinicalCounselorForJourney(viewer, journey);
  if (!journeyUsesSelfPacedCounselingReview(journey)) {
    throw new Error("Self-paced review is not enabled for this journey's counseling mode.");
  }
  const assignedModuleIds = requiredModuleIdsForSession(sessionKey, moduleIds);
  const now = new Date().toISOString();
  const existing = await store().getSelfPacedSessionReview(journeyId, sessionKey);
  if (existing?.workflowStatus === "approved") {
    throw new Error("Session is already approved.");
  }
  const bothDone = await bothPartnersSubmitted(journeyId, assignedModuleIds);
  const workflowStatus: SelfPacedWorkflowStatus = bothDone ? "ready_for_review" : "awaiting_partners";
  const record: MarriageSelfPacedSessionReviewRecord = {
    id: existing?.id ?? randomUUID(),
    journeyId,
    sessionKey,
    assignedModuleIds,
    workflowStatus,
    assignedByUserId: viewer.id,
    assignedAt: existing?.assignedAt ?? now,
    readyForReviewAt: bothDone ? now : (existing?.readyForReviewAt ?? null),
    feedbackDraft: existing?.feedbackDraft ?? null,
    feedbackPublished: existing?.feedbackPublished ?? null,
    feedbackPublishedAt: existing?.feedbackPublishedAt ?? null,
    approvedAt: null,
    approvedByUserId: null,
    pastoralFollowUpAt: existing?.pastoralFollowUpAt ?? null,
    updatedAt: now,
  };
  await store().saveSelfPacedSessionReview(record);
  await auditSession(
    journeyId,
    sessionKey,
    "assign_session",
    viewer.id,
    existing?.workflowStatus ?? null,
    workflowStatus,
    { moduleIds: assignedModuleIds },
  );
  if (workflowStatus === "ready_for_review") {
    const { notifyCounselorSelfPacedReadyForReview } = await import(
      "@/lib/marriage-prep-notification-triggers"
    );
    void notifyCounselorSelfPacedReadyForReview(journey, sessionKey);
  }
  return record;
}

/** Called after partner assessment submit — advances assigned self-paced sessions. */
export async function syncSelfPacedReviewsAfterModuleSubmit(
  journeyId: string,
  moduleId: string,
) {
  const journey = await store().getJourneyById(journeyId);
  if (!journey || !journeyUsesSelfPacedCounselingReview(journey)) return;
  const reviews = await store().listSelfPacedSessionReviewsForJourney(journeyId);
  for (const review of reviews) {
    if (review.workflowStatus === "approved") continue;
    if (!review.assignedModuleIds.includes(moduleId)) continue;
    const ready = await bothPartnersSubmitted(journeyId, review.assignedModuleIds);
    if (!ready) {
      if (review.workflowStatus !== "awaiting_partners") {
        await store().saveSelfPacedSessionReview({
          ...review,
          workflowStatus: "awaiting_partners",
          updatedAt: new Date().toISOString(),
        });
      }
      continue;
    }
    if (
      review.workflowStatus === "awaiting_partners" ||
      review.workflowStatus === "assigned"
    ) {
      const now = new Date().toISOString();
      await store().saveSelfPacedSessionReview({
        ...review,
        workflowStatus: "ready_for_review",
        readyForReviewAt: review.readyForReviewAt ?? now,
        updatedAt: now,
      });
      const { notifyCounselorSelfPacedReadyForReview } = await import(
        "@/lib/marriage-prep-notification-triggers"
      );
      void notifyCounselorSelfPacedReadyForReview(journey, review.sessionKey);
    }
  }
}

export async function buildCounselorSelfPacedReviewCenter(viewer: PublicMember) {
  await import("@/lib/marriage-counseling-access").then((m) =>
    m.assertMarriageCounselorRole(viewer),
  );
  const assigned = await store().listSelfPacedReviewsForCounselor(viewer.id);
  const awaitingReview = assigned.filter((r) => r.workflowStatus === "ready_for_review");
  const homeworkReview = assigned.filter((r) => r.workflowStatus === "homework_review");
  const clarification = assigned.filter((r) => r.workflowStatus === "clarification_open");
  return {
    awaitingReview,
    homeworkReview,
    clarification,
    allOpen: assigned,
  };
}

export async function getCounselorSessionReviewDetail(
  viewer: PublicMember,
  journeyId: string,
  sessionKey: string,
) {
  const journey = await store().getJourneyById(journeyId);
  if (!journey) throw new Error("Journey not found.");
  await assertClinicalCounselorForJourney(viewer, journey);
  const review = await store().getSelfPacedSessionReview(journeyId, sessionKey);
  const clarifications =
    typeof store().listClarificationMessages === "function"
      ? await store().listClarificationMessages(journeyId, sessionKey)
      : [];
  return { journey, review, clarifications };
}

export async function saveCounselorFeedbackDraft(
  viewer: PublicMember,
  journeyId: string,
  sessionKey: string,
  feedback: MarriageCounselorStructuredFeedback,
) {
  const journey = await store().getJourneyById(journeyId);
  if (!journey) throw new Error("Journey not found.");
  await assertClinicalCounselorForJourney(viewer, journey);
  const review = await store().getSelfPacedSessionReview(journeyId, sessionKey);
  if (!review) throw new Error("Assign this session before writing feedback.");
  const now = new Date().toISOString();
  const next: MarriageSelfPacedSessionReviewRecord = {
    ...review,
    feedbackDraft: feedback,
    workflowStatus: "feedback_draft",
    updatedAt: now,
  };
  await store().saveSelfPacedSessionReview(next);
  await auditSession(journeyId, sessionKey, "feedback_draft", viewer.id, review.workflowStatus, next.workflowStatus);
  return next;
}

export async function publishCounselorSessionFeedback(
  viewer: PublicMember,
  journeyId: string,
  sessionKey: string,
) {
  const journey = await store().getJourneyById(journeyId);
  if (!journey) throw new Error("Journey not found.");
  await assertClinicalCounselorForJourney(viewer, journey);
  const review = await store().getSelfPacedSessionReview(journeyId, sessionKey);
  if (!review?.feedbackDraft) throw new Error("Save a feedback draft before publishing.");
  const now = new Date().toISOString();
  const published = { ...review.feedbackDraft };
  delete published.counselorInternalNotes;
  const next: MarriageSelfPacedSessionReviewRecord = {
    ...review,
    feedbackPublished: published,
    feedbackPublishedAt: now,
    workflowStatus: "feedback_published",
    updatedAt: now,
  };
  await store().saveSelfPacedSessionReview(next);
  await auditSession(
    journeyId,
    sessionKey,
    "feedback_published",
    viewer.id,
    review.workflowStatus,
    next.workflowStatus,
  );
  const { notifyCoupleSelfPacedFeedbackPublished } = await import(
    "@/lib/marriage-prep-notification-triggers"
  );
  void notifyCoupleSelfPacedFeedbackPublished(journey, sessionKey);
  return next;
}

export async function approveSelfPacedSession(
  viewer: PublicMember,
  journeyId: string,
  sessionKey: string,
) {
  const journey = await store().getJourneyById(journeyId);
  if (!journey) throw new Error("Journey not found.");
  await assertClinicalCounselorForJourney(viewer, journey);
  const review = await store().getSelfPacedSessionReview(journeyId, sessionKey);
  if (!review) throw new Error("No self-paced review record for this session.");
  if (!review.feedbackPublished) {
    throw new Error("Publish counselor feedback before approving session completion.");
  }
  const ready = await bothPartnersSubmitted(journeyId, review.assignedModuleIds);
  if (!ready) throw new Error("Both partners must submit required assessments.");
  const { assertSelfPacedSessionHomeworkApproved } = await import("@/lib/marriage-homework-server");
  await assertSelfPacedSessionHomeworkApproved(journeyId, sessionKey);
  const now = new Date().toISOString();
  const next: MarriageSelfPacedSessionReviewRecord = {
    ...review,
    workflowStatus: "approved",
    approvedAt: now,
    approvedByUserId: viewer.id,
    updatedAt: now,
  };
  await store().saveSelfPacedSessionReview(next);
  await auditSession(
    journeyId,
    sessionKey,
    "session_approved",
    viewer.id,
    review.workflowStatus,
    "approved",
  );
  await updatePremaritalSessionStatus(viewer, journeyId, sessionKey, "completed");
  return next;
}

export async function assertPremaritalCompletionAllowed(
  viewer: PublicMember,
  journeyId: string,
  sessionKey: string,
  targetStatus: "completed",
) {
  if (targetStatus !== "completed") return;
  const journey = await store().getJourneyById(journeyId);
  if (!journey) return;
  if (!journeyRequiresSelfPacedReviewForSessionCompletion(journey)) return;
  const review = await store().getSelfPacedSessionReview(journeyId, sessionKey);
  if (review?.workflowStatus === "approved") return;
  throw new Error(
    "Self-paced and hybrid journeys require counselor approval via the review workflow before marking this session complete.",
  );
}

export async function partnerViewPublishedFeedback(
  viewer: PublicMember,
  journeyId: string,
  sessionKey: string,
) {
  const journey = await store().getJourneyById(journeyId);
  if (!journey) throw new Error("Journey not found.");
  const { assertJourneyParticipantLoose } = await import("@/lib/marriage-counseling-access");
  await assertJourneyParticipantLoose(journey, viewer.id);
  const review = await store().getSelfPacedSessionReview(journeyId, sessionKey);
  if (!review?.feedbackPublished) return null;
  const fb = { ...review.feedbackPublished };
  const partnerSpecific = fb.partnerSpecific?.[viewer.id];
  return {
    sharedFeedback: fb.sharedFeedback ?? fb.finalComments ?? "",
    strengths: fb.strengths,
    concerns: fb.concerns,
    discussionTopics: fb.discussionTopics,
    biblicalGuidance: fb.biblicalGuidance,
    practicalExercises: fb.practicalExercises,
    jointRecommendations: fb.jointRecommendations,
    partnerSpecific: partnerSpecific ?? null,
    publishedAt: review.feedbackPublishedAt,
    asyncDisclaimer: (await import("@/lib/marriage-counseling-delivery-mode"))
      .SELF_PACED_ASYNC_DISCLAIMER,
  };
}

export async function postClarificationMessage(
  viewer: PublicMember,
  journeyId: string,
  sessionKey: string,
  body: string,
) {
  const journey = await store().getJourneyById(journeyId);
  if (!journey) throw new Error("Journey not found.");
  const trimmed = body.trim();
  if (!trimmed) throw new Error("Message required.");
  let role: "counselor" | "partner" = "partner";
  try {
    await assertClinicalCounselorForJourney(viewer, journey);
    role = "counselor";
  } catch {
    const { assertJourneyParticipantLoose } = await import("@/lib/marriage-counseling-access");
    await assertJourneyParticipantLoose(journey, viewer.id);
  }
  const record = {
    id: randomUUID(),
    journeyId,
    sessionKey,
    authorUserId: viewer.id,
    authorRole: role,
    body: trimmed,
    createdAt: new Date().toISOString(),
  };
  await store().saveClarificationMessage(record);
  const review = await store().getSelfPacedSessionReview(journeyId, sessionKey);
  if (review && review.workflowStatus !== "approved") {
    await store().saveSelfPacedSessionReview({
      ...review,
      workflowStatus: "clarification_open",
      updatedAt: new Date().toISOString(),
    });
  }
  return record;
}

export { parseCounselingDeliveryMode };
