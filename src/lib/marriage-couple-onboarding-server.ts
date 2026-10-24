import type { MarriageHubCounselorSummary } from "@/lib/marriage-counseling-types";
import type {
  MarriageCoupleOnboardingStep,
  MarriageCoupleOnboardingStepId,
  MarriageCoupleOnboardingView,
} from "@/lib/marriage-couple-onboarding-types";

export function buildCoupleOnboardingView(input: {
  signedIn: boolean;
  coupleLinkActive: boolean;
  hasJourney: boolean;
  partnerJoined: boolean;
  myConsent: boolean;
  partnerConsent: boolean;
  counselorSummary: MarriageHubCounselorSummary | null;
}): MarriageCoupleOnboardingView {
  const counselorReady = input.counselorSummary?.status === "assigned";
  const counselorPending =
    input.counselorSummary?.status === "pending_approval" ||
    input.counselorSummary?.status === "awaiting_restoration";

  const steps: MarriageCoupleOnboardingStep[] = [
    {
      id: "account",
      title: "Your own account",
      description: "Each partner signs in separately so your answers and consent stay individual.",
      complete: input.signedIn,
      current: false,
    },
    {
      id: "journey",
      title: "Start or join the journey",
      description: "Begin premarital prep together or join your partner with an invitation code.",
      complete: input.hasJourney,
      current: false,
    },
    {
      id: "link_partner",
      title: "Both partners connected",
      description: "Link accounts or confirm your partner has joined this journey.",
      complete: input.hasJourney && input.partnerJoined,
      current: false,
    },
    {
      id: "consent",
      title: "Individual consent",
      description: "Each partner accepts privacy and sharing rules on their own device.",
      complete: input.myConsent && input.partnerConsent && input.partnerJoined,
      current: false,
    },
    {
      id: "counselor",
      title: "Counselor assignment",
      description: counselorPending
        ? "Your church is completing counselor approval — you can begin assessments while you wait."
        : "An approved premarital counselor is assigned before private pastoral sessions.",
      complete: counselorReady,
      current: false,
    },
    {
      id: "begin_prep",
      title: "Assessments & homework",
      description: "Work through modules and counselor-released homework at your pace.",
      complete: counselorReady && input.myConsent && input.partnerConsent,
      current: false,
    },
  ];

  let currentStepId: MarriageCoupleOnboardingStepId | null = null;
  for (const step of steps) {
    if (!step.complete) {
      currentStepId = step.id;
      break;
    }
  }

  const withCurrent = steps.map((s) => ({
    ...s,
    current: s.id === currentStepId,
  }));

  const completedCount = withCurrent.filter((s) => s.complete).length;
  const progressPercent = Math.round((completedCount / withCurrent.length) * 100);

  const currentStep = withCurrent.find((s) => s.current);
  let nextStepTitle = "You're ready to prepare together";
  let nextStepDetail = "Keep up with homework and counseling appointments as your counselor guides you.";

  if (currentStep) {
    nextStepTitle = currentStep.title;
    nextStepDetail = currentStep.description;
    if (currentStep.id === "consent" && input.myConsent && !input.partnerConsent) {
      nextStepDetail = "Waiting for your partner to accept consent on their device.";
    }
    if (currentStep.id === "counselor" && counselorPending) {
      nextStepDetail =
        "You may start assessments while approval finishes. Session scheduling will follow counselor assignment.";
    }
  }

  return {
    steps: withCurrent,
    currentStepId,
    nextStepTitle,
    nextStepDetail,
    progressPercent,
  };
}
