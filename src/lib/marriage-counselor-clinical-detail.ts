import type { PublicMember } from "@/lib/auth-types";
import { getUserById } from "@/lib/auth-server";
import { assertClinicalCounselorForJourney } from "@/lib/marriage-counseling-access";
import type { MarriageCounselingJourneyRecord } from "@/lib/marriage-counseling-types";
import { verifyCounselorAnswerDisclosure } from "@/lib/marriage-counselor-consent";
import { counselorComparisonDisclosureEnabled } from "@/lib/marriage-counselor-comparison-disclosure";
import { buildSharedComparisonItems } from "@/lib/marriage-counseling-comparison-utils";
import {
  resolveCoupleDisplayNames,
} from "@/lib/marriage-counselor-journey-names";
import {
  getActiveContentVersionLabel,
  getModuleForContentVersion,
  listModulesForJourney,
} from "@/lib/marriage-curriculum-service";
import { isMarriageStage2Enabled } from "@/lib/marriage-stage2-feature";
import { counselorLessonRowsForModule, computeModuleSubmissionProgress } from "@/lib/marriage-module-progress";
import { marriageStore } from "@/lib/stores/marriage-counseling-store";
import type { MarriageCounselorModuleProgressOverview } from "@/lib/marriage-counselor-admin-overview";
import { buildModuleProgressOverview } from "@/lib/marriage-counselor-admin-overview";

const store = () => marriageStore();

export type MarriageCounselorAuthorizedAnswerView = {
  moduleId: string;
  moduleTitle: string;
  questionId: string;
  prompt: string;
  userId: string;
  userName: string;
  withheld: boolean;
  answer?: string;
};

export type MarriageCounselorClinicalJourneyDetail = {
  access: "clinical";
  journeyId: string;
  coupleNames: string;
  journeyStatus: string;
  programType: string;
  moduleProgress: MarriageCounselorModuleProgressOverview[];
  stage2LessonProgress: Array<{
    moduleId: string;
    title: string;
    partnerAStatus: string;
    partnerBStatus: string;
    comparisonReady: boolean;
    partnerARequiredComplete: boolean;
    partnerBRequiredComplete: boolean;
    optionalRemainingA: number;
    optionalRemainingB: number;
    lessons: ReturnType<typeof counselorLessonRowsForModule>;
  }>;
  comparisonSummaries: Array<{
    moduleId: string;
    moduleTitle: string;
    needsAttention: number;
    aligned: number;
    items: Array<{ prompt: string; category: string; discussionPrompt?: string }>;
  }>;
  attentionAreas: Array<{ prompt: string; category: string; discussionPrompt?: string }>;
  authorizedAnswers: MarriageCounselorAuthorizedAnswerView[];
  sessions: Array<{
    id: string;
    scheduledAt: string;
    topic?: string;
    zoomUrl?: string;
    status?: string;
  }>;
  assignments: Array<{
    id: string;
    title: string;
    dueAt?: string;
    completedByUserIds: string[];
  }>;
  notes: Array<{ id: string; body: string; updatedAt: string }>;
  revisions: Array<{ id: string; status: string; moduleId: string }>;
  comparisonDisclosurePhase: string;
};

function formatAnswerForCounselorDisplay(value: unknown): string {
  if (value === undefined || value === null) return "";
  if (typeof value === "string") return value;
  return JSON.stringify(value);
}

export async function buildCounselorAuthorizedAnswerViews(
  viewer: PublicMember,
  journey: MarriageCounselingJourneyRecord,
): Promise<MarriageCounselorAuthorizedAnswerView[]> {
  const modules = await listModulesForJourney(journey);
  const assignedCounselorUserId = journey.counselorUserId;
  const views: MarriageCounselorAuthorizedAnswerView[] = [];

  for (const mod of modules) {
    const responses = await store().listResponsesForJourneyModule(journey.id, mod.id);
    const consents = await store().listSharingConsents(journey.id, mod.id);

    for (const response of responses) {
      if (response.status !== "submitted") continue;
      const moduleDef = await getModuleForContentVersion(mod.id, response.contentVersion);
      if (!moduleDef) continue;
      const user = await getUserById(response.userId);
      const userName = user?.name ?? "Member";

      for (const question of moduleDef.questions) {
        if (question.visibility !== "counselor_with_consent") continue;
        const consent =
          consents.find(
            (c) => c.questionId === question.id && c.userId === response.userId,
          ) ?? null;
        const currentGeneration =
          (await store().getAnswerChangeGeneration(
            journey.id,
            mod.id,
            question.id,
            response.userId,
          )) ?? 0;
        const currentAnswer = response.answers[question.id];

        if (!consent) {
          views.push({
            moduleId: mod.id,
            moduleTitle: mod.title,
            questionId: question.id,
            prompt: question.prompt,
            userId: response.userId,
            userName,
            withheld: true,
          });
          continue;
        }

        const check = verifyCounselorAnswerDisclosure({
          consent,
          currentGeneration,
          assignedCounselorUserId,
          viewerCounselorUserId: viewer.id,
          currentAnswer,
        });

        if (!check.allowed) {
          views.push({
            moduleId: mod.id,
            moduleTitle: mod.title,
            questionId: question.id,
            prompt: question.prompt,
            userId: response.userId,
            userName,
            withheld: true,
          });
          continue;
        }

        views.push({
          moduleId: mod.id,
          moduleTitle: mod.title,
          questionId: question.id,
          prompt: question.prompt,
          userId: response.userId,
          userName,
          withheld: false,
          answer: formatAnswerForCounselorDisplay(currentAnswer),
        });
      }
    }
  }

  return views;
}

export async function buildMarriageCounselorClinicalDetail(
  viewer: PublicMember,
  journey: MarriageCounselingJourneyRecord,
): Promise<MarriageCounselorClinicalJourneyDetail> {
  await assertClinicalCounselorForJourney(viewer, journey);

  const modules = await listModulesForJourney(journey);
  const moduleProgress = await buildModuleProgressOverview(journey);
  const stage2LessonProgress: MarriageCounselorClinicalJourneyDetail["stage2LessonProgress"] = [];

  const participantAId = journey.participantAId ?? "";
  const participantBId = journey.participantBId ?? null;
  const stage2On = isMarriageStage2Enabled();

  if (stage2On) {
    for (const mod of modules) {
      const responses = await store().listResponsesForJourneyModule(journey.id, mod.id);
      const submitted = responses.filter((r) => r.status === "submitted");
      const contentVersion =
        journey.curriculumVersion ?? responses[0]?.contentVersion ?? (await getActiveContentVersionLabel());
      const moduleDef = await getModuleForContentVersion(mod.id, contentVersion);
      if (!moduleDef?.lessons?.length || !participantAId) continue;

      const answersByUser = new Map<string, Record<string, unknown>>();
      for (const r of responses) {
        answersByUser.set(r.userId, r.answers ?? {});
      }
      const progA = computeModuleSubmissionProgress(moduleDef, answersByUser.get(participantAId) ?? {});
      const progB = participantBId
        ? computeModuleSubmissionProgress(moduleDef, answersByUser.get(participantBId) ?? {})
        : null;
      const version = submitted[0]?.contentVersion;
      let comparisonReady = false;
      if (submitted.length >= 2 && version) {
        comparisonReady = Boolean(await store().getUnlock(journey.id, mod.id, version));
      }
      const statusFor = (uid: string) => responses.find((r) => r.userId === uid)?.status ?? "not_started";

      stage2LessonProgress.push({
        moduleId: mod.id,
        title: mod.title,
        partnerAStatus: statusFor(participantAId),
        partnerBStatus: participantBId ? statusFor(participantBId) : "not_started",
        comparisonReady,
        partnerARequiredComplete: progA.canSubmit,
        partnerBRequiredComplete: progB?.canSubmit ?? false,
        optionalRemainingA: progA.optionalTotal - progA.optionalDone,
        optionalRemainingB: progB ? progB.optionalTotal - progB.optionalDone : 0,
        lessons: counselorLessonRowsForModule(moduleDef, answersByUser, participantAId, participantBId),
      });
    }
  }

  const comparisonSummaries: MarriageCounselorClinicalJourneyDetail["comparisonSummaries"] = [];
  if (counselorComparisonDisclosureEnabled()) {
    for (const mod of modules) {
      const responses = await store().listResponsesForJourneyModule(journey.id, mod.id);
      const submitted = responses.filter((r) => r.status === "submitted");
      if (submitted.length >= 2) {
        const version = submitted[0].contentVersion;
        const unlock = await store().getUnlock(journey.id, mod.id, version);
        if (unlock) {
          const moduleDef = await getModuleForContentVersion(mod.id, version);
          if (moduleDef) {
            const items = buildSharedComparisonItems(
              moduleDef.questions,
              submitted[0].answers,
              submitted[1].answers,
            );
            comparisonSummaries.push({
              moduleId: mod.id,
              moduleTitle: mod.title,
              needsAttention: items.filter((i) => i.category !== "aligned").length,
              aligned: items.filter((i) => i.category === "aligned").length,
              items: items.map((i) => ({
                prompt: i.prompt,
                category: i.category,
                discussionPrompt: i.discussionPrompt,
              })),
            });
          }
        }
      }
    }
  }

  const attentionAreas = comparisonSummaries
    .flatMap((s) => s.items.filter((i) => i.category !== "aligned"))
    .slice(0, 12);

  const authorizedAnswers = await buildCounselorAuthorizedAnswerViews(viewer, journey);

  const sessions = (await store().listSessions(journey.id))
    .filter((s) => s.createdBy === viewer.id)
    .map((s) => ({
      id: s.id,
      scheduledAt: s.scheduledAt,
      topic: s.topic,
      zoomUrl: s.zoomUrl,
      status: s.status,
    }));

  const assignments = (await store().listAssignments(journey.id))
    .filter((a) => a.counselorUserId === viewer.id)
    .map((a) => ({
      id: a.id,
      title: a.title,
      dueAt: a.dueAt,
      completedByUserIds: a.completedByUserIds,
    }));

  const notes = (await store().listCounselorNotes(journey.id))
    .filter((n) => n.counselorUserId === viewer.id)
    .map((n) => ({ id: n.id, body: n.body, updatedAt: n.updatedAt }));

  const revisions = (await store().listRevisionRequests(journey.id)).map((r) => ({
    id: r.id,
    status: r.status,
    moduleId: r.moduleId,
  }));

  return {
    access: "clinical",
    journeyId: journey.id,
    coupleNames: await resolveCoupleDisplayNames(journey),
    journeyStatus: journey.status,
    programType: journey.programType,
    moduleProgress,
    stage2LessonProgress,
    comparisonSummaries,
    attentionAreas,
    authorizedAnswers,
    sessions,
    assignments,
    notes,
    revisions,
    comparisonDisclosurePhase: counselorComparisonDisclosureEnabled()
      ? "enabled"
      : "withheld_until_explicit_consent",
  };
}
