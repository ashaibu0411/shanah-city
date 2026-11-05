import type { PublicMember } from "@/lib/auth-types";
import { assertJourneyParticipantLoose } from "@/lib/marriage-counseling-access";
import type { MarriageCounselingJourneyRecord } from "@/lib/marriage-counseling-types";
import { getPremaritalSessionDefinition } from "@/lib/marriage-premarital-eight-session-program";
import {
  isStage2EnrichmentSessionKey,
  moduleIdFromEnrichmentSessionKey,
} from "@/lib/marriage-enrichment-session-keys";
import { listReleasedHomeworkForParticipant } from "@/lib/marriage-homework-server";
import { partnerViewPublishedFeedback } from "@/lib/marriage-self-paced-server";
import type { SelfPacedWorkflowStatus } from "@/lib/marriage-self-paced-types";
import { getModuleForContentVersion, getActiveContentVersionLabel } from "@/lib/marriage-curriculum-service";
import { marriageStore } from "@/lib/stores/marriage-counseling-store";

const store = () => marriageStore();

export type MarriageCoupleFeedbackSessionSummary = {
  sessionKey: string;
  title: string;
  kind: "premarital" | "stage2_enrichment";
  workflowStatus: SelfPacedWorkflowStatus | "not_started";
  hasPublishedFeedback: boolean;
  feedbackPublishedAt: string | null;
  approvedAt: string | null;
  clarificationOpen: boolean;
  awaitingCounselorReview: boolean;
  actionRequired: boolean;
  homeworkCount: number;
  homeworkActionCount: number;
};

async function sessionTitle(sessionKey: string) {
  if (isStage2EnrichmentSessionKey(sessionKey)) {
    const moduleId = moduleIdFromEnrichmentSessionKey(sessionKey);
    if (moduleId) {
      const mod = await getModuleForContentVersion(moduleId, await getActiveContentVersionLabel());
      return mod?.title ?? moduleId.replace(/-/g, " ");
    }
  }
  const def = getPremaritalSessionDefinition(sessionKey);
  return def?.title ?? sessionKey.replace(/-/g, " ");
}

export async function buildCoupleFeedbackCenterView(viewer: PublicMember, journey: MarriageCounselingJourneyRecord) {
  await assertJourneyParticipantLoose(journey, viewer.id);
  const reviews =
    typeof store().listSelfPacedSessionReviewsForJourney === "function"
      ? await store().listSelfPacedSessionReviewsForJourney(journey.id)
      : [];
  const homework = await listReleasedHomeworkForParticipant(viewer, journey.id);
  const homeworkRows = await store().listSessionHomeworkForJourney(journey.id);

  const sessions: MarriageCoupleFeedbackSessionSummary[] = [];
  for (const review of reviews) {
    const hasPublishedFeedback = Boolean(review.feedbackPublished);
    const workflowStatus = review.workflowStatus;
    const clarificationOpen = workflowStatus === "clarification_open";
    const hwForSession = homeworkRows.filter(
      (h) => h.status === "released" && h.sessionId === review.sessionKey,
    );
    const hwViews = homework.filter((h) => hwForSession.some((row) => row.id === h.id));
    const homeworkActionCount = hwViews.filter(
      (h) => h.actionRequired || h.counselorReviewStatus === "revision_requested",
    ).length;

    const awaitingCounselorReview =
      workflowStatus === "ready_for_review" ||
      workflowStatus === "feedback_draft" ||
      workflowStatus === "homework_review";

    const actionRequired =
      clarificationOpen ||
      homeworkActionCount > 0 ||
      (hasPublishedFeedback &&
        workflowStatus === "feedback_published" &&
        homeworkActionCount + hwViews.filter((h) => !h.submitted).length > 0);

    const visible =
      hasPublishedFeedback ||
      clarificationOpen ||
      workflowStatus !== "assigned" ||
      hwViews.length > 0;
    if (!visible) continue;

    sessions.push({
      sessionKey: review.sessionKey,
      title: await sessionTitle(review.sessionKey),
      kind: isStage2EnrichmentSessionKey(review.sessionKey) ? "stage2_enrichment" : "premarital",
      workflowStatus,
      hasPublishedFeedback,
      feedbackPublishedAt: review.feedbackPublishedAt,
      approvedAt: review.approvedAt,
      clarificationOpen,
      awaitingCounselorReview,
      actionRequired,
      homeworkCount: hwViews.length,
      homeworkActionCount,
    });
  }

  sessions.sort((a, b) => {
    const ta = a.feedbackPublishedAt ?? a.approvedAt ?? "";
    const tb = b.feedbackPublishedAt ?? b.approvedAt ?? "";
    return tb.localeCompare(ta);
  });

  const linkedHomeworkIds = new Set(
    homeworkRows.filter((h) => h.sessionId).map((h) => h.id),
  );

  return {
    sessions,
    allHomework: homework,
    unlinkedHomework: homework.filter((h) => !linkedHomeworkIds.has(h.id)),
  };
}

export async function getCoupleSessionFeedbackDetail(
  viewer: PublicMember,
  journey: MarriageCounselingJourneyRecord,
  sessionKey: string,
) {
  await assertJourneyParticipantLoose(journey, viewer.id);
  const review = await store().getSelfPacedSessionReview(journey.id, sessionKey);
  const feedback = await partnerViewPublishedFeedback(viewer, journey.id, sessionKey);
  const clarifications =
    typeof store().listClarificationMessages === "function"
      ? await store().listClarificationMessages(journey.id, sessionKey)
      : [];
  const homeworkRows = await store().listSessionHomeworkForJourney(journey.id);
  const released = homeworkRows.filter((h) => h.status === "released" && h.sessionId === sessionKey);
  const homework = await listReleasedHomeworkForParticipant(viewer, journey.id);
  const sessionHomework = homework.filter((h) => released.some((r) => r.id === h.id));

  const status = review?.workflowStatus ?? "not_started";

  return {
    journeyId: journey.id,
    sessionKey,
    title: await sessionTitle(sessionKey),
    kind: isStage2EnrichmentSessionKey(sessionKey) ? "stage2_enrichment" : "premarital",
    workflowStatus: status,
    approvedAt: review?.approvedAt ?? null,
    feedbackPublishedAt: review?.feedbackPublishedAt ?? null,
    feedback,
    clarifications: clarifications.map((m) => ({
      id: m.id,
      authorRole: m.authorRole,
      isMine: m.authorUserId === viewer.id,
      body: m.body,
      createdAt: m.createdAt,
    })),
    sessionHomework,
    statusLabel: statusLabelForCouple(status, Boolean(feedback), sessionHomework),
  };
}

function statusLabelForCouple(
  status: string,
  hasFeedback: boolean,
  homework: Array<{ counselorReviewStatus?: string; actionRequired?: boolean; submitted?: boolean }>,
) {
  if (status === "approved") return "Session acknowledged by your counselor";
  if (status === "clarification_open") return "Clarification conversation open — you can reply below";
  if (homework.some((h) => h.counselorReviewStatus === "revision_requested")) {
    return "Homework revision requested";
  }
  if (homework.some((h) => h.actionRequired || !h.submitted)) return "Homework action needed";
  if (hasFeedback && status === "feedback_published") return "Counselor guidance posted — read below";
  if (status === "ready_for_review" || status === "feedback_draft") {
    return "Your counselor is reviewing your submissions";
  }
  if (status === "homework_review") return "Homework awaiting counselor review";
  return "In progress";
}
