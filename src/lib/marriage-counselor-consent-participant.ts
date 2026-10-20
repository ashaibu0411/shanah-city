import type { PublicMember } from "@/lib/auth-types";
import {
  assertJourneyParticipantLoose,
  isJourneyCounselorAccessRevoked,
} from "@/lib/marriage-counseling-access";
import type {
  MarriageCounselingJourneyRecord,
  MarriageQuestionDefinition,
  MarriageSharingConsentRecord,
} from "@/lib/marriage-counseling-types";
import {
  computeAnswerFingerprint,
  isAnswerDisclosableToCounselor,
  verifyCounselorAnswerDisclosure,
} from "@/lib/marriage-counselor-consent";
import { isCounselorDisclosureGranted } from "@/lib/marriage-sharing-consent-counselor-state";
import { resolveAssignedCounselorDisplayName } from "@/lib/marriage-counselor-journey-names";
import { getModuleDefinition } from "@/lib/marriage-curriculum-service";
import { marriageStore } from "@/lib/stores/marriage-counseling-store";

const store = () => marriageStore();

export type MarriageCounselorConsentUiState =
  | "not_shared"
  | "shared_with_counselor"
  | "withdrawn";

export type MarriageCounselorConsentStatusItem = {
  questionId: string;
  state: MarriageCounselorConsentUiState;
  canGrant: boolean;
  canRevoke: boolean;
};

export type MarriageCounselorConsentModuleStatus = {
  journeyId: string;
  moduleId: string;
  counselorAssigned: boolean;
  counselorAccessRevoked: boolean;
  assignedCounselorUserId: string | null;
  assignedCounselorName: string | null;
  items: MarriageCounselorConsentStatusItem[];
};

function assertCounselorConsentQuestion(
  questions: MarriageQuestionDefinition[],
  questionId: string,
): MarriageQuestionDefinition {
  const question = questions.find((q) => q.id === questionId);
  if (!question || question.visibility !== "counselor_with_consent") {
    throw new Error("This question is not eligible for counselor consent.");
  }
  return question;
}

export function resolveCounselorConsentUiState(params: {
  journey: MarriageCounselingJourneyRecord;
  consent: MarriageSharingConsentRecord | null;
  currentGeneration: number;
  currentAnswer: unknown;
}): MarriageCounselorConsentUiState {
  const { journey, consent, currentGeneration, currentAnswer } = params;
  if (!journey.counselorUserId?.trim() || isJourneyCounselorAccessRevoked(journey)) {
    if (
      consent &&
      (isCounselorDisclosureGranted(consent) || Boolean(consent.consentedCounselorUserId?.trim()))
    ) {
      return "withdrawn";
    }
    return "not_shared";
  }
  if (!consent || !isCounselorDisclosureGranted(consent)) {
    return consent?.consentedCounselorUserId ? "withdrawn" : "not_shared";
  }
  const check = verifyCounselorAnswerDisclosure({
    consent,
    currentGeneration,
    assignedCounselorUserId: journey.counselorUserId,
    viewerCounselorUserId: journey.counselorUserId,
    currentAnswer,
  });
  return check.allowed ? "shared_with_counselor" : "withdrawn";
}

async function loadParticipantCounselorConsentContext(
  viewer: PublicMember,
  journeyId: string,
  moduleId: string,
) {
  const journey = await store().getJourneyById(journeyId);
  if (!journey) throw new Error("Journey not found.");
  await assertJourneyParticipantLoose(journey, viewer.id);
  const mod = await getModuleDefinition(moduleId);
  if (!mod) throw new Error("Module not found.");
  const response = await store().getResponse(journey.id, moduleId, viewer.id);
  return { journey, mod, response };
}

export async function listCounselorConsentStatusForModule(
  viewer: PublicMember,
  journeyId: string,
  moduleId: string,
): Promise<MarriageCounselorConsentModuleStatus> {
  const { journey, mod, response } = await loadParticipantCounselorConsentContext(
    viewer,
    journeyId,
    moduleId,
  );
  const consents = await store().listSharingConsents(journey.id, moduleId);
  const submitted = response?.status === "submitted";
  const answers = response?.answers ?? {};

  const items: MarriageCounselorConsentStatusItem[] = [];
  for (const question of mod.questions) {
    if (question.visibility !== "counselor_with_consent") continue;
    const consent =
      consents.find((c) => c.questionId === question.id && c.userId === viewer.id) ?? null;
    const currentGeneration =
      (await store().getAnswerChangeGeneration(
        journey.id,
        moduleId,
        question.id,
        viewer.id,
      )) ?? 0;
    const currentAnswer = answers[question.id];
    const state = resolveCounselorConsentUiState({
      journey,
      consent,
      currentGeneration,
      currentAnswer,
    });
    const answerReady = submitted && isAnswerDisclosableToCounselor(currentAnswer);
    const counselorOk =
      Boolean(journey.counselorUserId?.trim()) && !isJourneyCounselorAccessRevoked(journey);
    items.push({
      questionId: question.id,
      state,
      canGrant: answerReady && counselorOk && state !== "shared_with_counselor",
      canRevoke: state === "shared_with_counselor",
    });
  }

  return {
    journeyId: journey.id,
    moduleId,
    counselorAssigned: Boolean(journey.counselorUserId?.trim()),
    counselorAccessRevoked: isJourneyCounselorAccessRevoked(journey),
    assignedCounselorUserId: journey.counselorUserId,
    assignedCounselorName: await resolveAssignedCounselorDisplayName(journey.counselorUserId),
    items,
  };
}

export async function grantCounselorAnswerConsent(
  viewer: PublicMember,
  journeyId: string,
  moduleId: string,
  questionId: string,
) {
  const { journey, mod, response } = await loadParticipantCounselorConsentContext(
    viewer,
    journeyId,
    moduleId,
  );
  assertCounselorConsentQuestion(mod.questions, questionId);
  if (!journey.counselorUserId?.trim()) {
    throw new Error("No counselor is assigned to your journey yet.");
  }
  if (isJourneyCounselorAccessRevoked(journey)) {
    throw new Error("Counselor access has been revoked for this journey.");
  }
  if (response?.status !== "submitted") {
    throw new Error("Submit this assessment before sharing answers with your counselor.");
  }
  const answer = response.answers[questionId];
  if (!isAnswerDisclosableToCounselor(answer)) {
    throw new Error("This answer cannot be shared until you provide a response.");
  }

  const fingerprint = computeAnswerFingerprint(answer);
  const result = await store().applyCounselorConsentGrant({
    journeyId: journey.id,
    moduleId,
    questionId,
    userId: viewer.id,
    expectedCounselorUserId: journey.counselorUserId,
    answerFingerprint: fingerprint,
  });

  return {
    ok: true as const,
    idempotent: result.idempotent,
    fingerprint,
  };
}

export async function revokeCounselorAnswerConsent(
  viewer: PublicMember,
  journeyId: string,
  moduleId: string,
  questionId: string,
) {
  const { journey, mod } = await loadParticipantCounselorConsentContext(viewer, journeyId, moduleId);
  assertCounselorConsentQuestion(mod.questions, questionId);

  const result = await store().applyCounselorConsentRevoke({
    journeyId: journey.id,
    moduleId,
    questionId,
    userId: viewer.id,
  });

  return { ok: true as const, idempotent: result.idempotent };
}
