import type { PublicMember } from "@/lib/auth-types";
import { getUserById } from "@/lib/auth-server";
import { assertClinicalCounselorForJourney } from "@/lib/marriage-counseling-access";
import type { MarriageCounselingJourneyRecord } from "@/lib/marriage-counseling-types";
import { buildSharedComparisonItems } from "@/lib/marriage-counseling-comparison-utils";
import { counselorComparisonDisclosureEnabled } from "@/lib/marriage-counselor-comparison-disclosure";
import { buildCounselorAuthorizedAnswerViews } from "@/lib/marriage-counselor-clinical-detail";
import { computeFinalCertificateBlockers } from "@/lib/marriage-certificate-eligibility";
import { getPremaritalSessionDefinition } from "@/lib/marriage-premarital-eight-session-program";
import {
  isStage2EnrichmentSessionKey,
  moduleIdFromEnrichmentSessionKey,
  stage2EnrichmentSessionKey,
} from "@/lib/marriage-enrichment-session-keys";
import { normalizeHomeworkReviewStatus } from "@/lib/marriage-homework-review";
import { buildCounselorPremaritalProgramView } from "@/lib/marriage-premarital-program-server";
import { getModuleForContentVersion, getActiveContentVersionLabel } from "@/lib/marriage-curriculum-service";
import { marriageStore } from "@/lib/stores/marriage-counseling-store";

const store = () => marriageStore();

export async function buildCounselorSessionReviewWorkspace(
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
  const audit =
    typeof store().listSelfPacedSessionAudits === "function"
      ? await store().listSelfPacedSessionAudits(journeyId, sessionKey)
      : [];

  const moduleIds = review?.assignedModuleIds ?? [];
  const aId = journey.participantAId;
  const bId = journey.participantBId;

  const moduleBlocks: Array<{
    moduleId: string;
    title: string;
    partnerA: { name: string; submitted: boolean };
    partnerB: { name: string; submitted: boolean };
    comparisons: Array<{
      prompt: string;
      category: string;
      partnerADisplay: string;
      partnerBDisplay: string;
    }>;
  }> = [];

  const nameA = aId ? ((await getUserById(aId))?.name ?? "Partner A") : "Partner A";
  const nameB = bId ? ((await getUserById(bId))?.name ?? "Partner B") : "Partner B";

  if (counselorComparisonDisclosureEnabled()) {
    for (const moduleId of moduleIds) {
      const responses = await store().listResponsesForJourneyModule(journeyId, moduleId);
      const respA = responses.find((r) => r.userId === aId);
      const respB = responses.find((r) => r.userId === bId);
      const version =
        respA?.contentVersion ?? respB?.contentVersion ?? (await getActiveContentVersionLabel());
      const moduleDef = await getModuleForContentVersion(moduleId, version);
      if (!moduleDef) continue;
      let comparisons: typeof moduleBlocks[0]["comparisons"] = [];
      if (respA?.status === "submitted" && respB?.status === "submitted") {
        const unlock = await store().getUnlock(journeyId, moduleId, version);
        if (unlock) {
          comparisons = buildSharedComparisonItems(
            moduleDef.questions,
            respA.answers ?? {},
            respB.answers ?? {},
          ).map((i) => ({
            prompt: i.prompt,
            category: i.category,
            partnerADisplay: i.myAnswerDisplay ?? "",
            partnerBDisplay: i.partnerAnswerDisplay ?? "",
          }));
        }
      }
      moduleBlocks.push({
        moduleId,
        title: moduleDef.title,
        partnerA: { name: nameA, submitted: respA?.status === "submitted" },
        partnerB: { name: nameB, submitted: respB?.status === "submitted" },
        comparisons,
      });
    }
  }

  const authorizedAnswers = (await buildCounselorAuthorizedAnswerViews(viewer, journey)).filter((a) =>
    moduleIds.includes(a.moduleId),
  );

  const homeworkRows = await store().listSessionHomeworkForJourney(journeyId);
  const sessionHomework = homeworkRows.filter((h) => h.sessionId === sessionKey);
  const homeworkDetail = [];
  for (const hw of sessionHomework) {
    const responses = await store().listSessionHomeworkResponses(hw.id);
    homeworkDetail.push({
      id: hw.id,
      title: hw.title,
      status: hw.status,
      partners: [aId, bId].filter(Boolean).map((uid) => {
        const r = responses.find((x) => x.userId === uid);
        return {
          userId: uid,
          name: uid === aId ? nameA : nameB,
          reviewStatus: normalizeHomeworkReviewStatus(r?.reviewStatus),
          submittedAt: r?.submittedAt ?? null,
        };
      }),
    });
  }

  let premaritalProgress: {
    sessionsCompleted: number;
    sessionsTotal: number;
    currentSessionKey: string | null;
  } | null = null;
  let certificateSummary: { eligible: boolean; blockerCount: number; blockers: string[] } | null = null;

  if (journey.programType === "premarital" && !isStage2EnrichmentSessionKey(sessionKey)) {
    const program = await buildCounselorPremaritalProgramView(viewer, journey);
    if (program) {
      premaritalProgress = {
        sessionsCompleted: program.sessionsCompleted,
        sessionsTotal: program.sessionsTotal,
        currentSessionKey: program.currentSessionKey,
      };
    }
    const blockers = await computeFinalCertificateBlockers(journey);
    certificateSummary = {
      eligible: blockers.length === 0,
      blockerCount: blockers.length,
      blockers: blockers.slice(0, 8),
    };
  }

  const sessionTitle = isStage2EnrichmentSessionKey(sessionKey)
    ? (await getModuleForContentVersion(
        moduleIdFromEnrichmentSessionKey(sessionKey) ?? "",
        await getActiveContentVersionLabel(),
      ))?.title ?? "Stage 2 enrichment"
    : (getPremaritalSessionDefinition(sessionKey)?.title ?? sessionKey);

  return {
    journeyId,
    sessionKey,
    sessionTitle,
    enrichment: isStage2EnrichmentSessionKey(sessionKey),
    review,
    feedbackDraft: review?.feedbackDraft ?? null,
    feedbackPublished: review?.feedbackPublished ?? null,
    clarifications,
    audit,
    moduleBlocks,
    authorizedAnswers,
    sessionHomework: homeworkDetail,
    premaritalProgress,
    certificateSummary,
    homeworkAssignPath: `/marriage/counselor/journey/${journeyId}/homework?sessionId=${encodeURIComponent(sessionKey)}`,
  };
}

export async function counselorAssignStage2EnrichmentReview(
  viewer: PublicMember,
  journeyId: string,
  moduleId: string,
) {
  const { counselorAssignSelfPacedSession } = await import("@/lib/marriage-self-paced-server");
  const sessionKey = stage2EnrichmentSessionKey(moduleId);
  return counselorAssignSelfPacedSession(viewer, journeyId, sessionKey, [moduleId]);
}
