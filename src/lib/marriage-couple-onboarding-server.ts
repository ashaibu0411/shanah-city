import type { MarriageHubCounselorSummary } from "@/lib/marriage-counseling-types";
import type {
  MarriageCoupleOnboardingStep,
  MarriageCoupleOnboardingStepId,
  MarriageCoupleOnboardingView,
} from "@/lib/marriage-couple-onboarding-types";

function actionForStep(
  stepId: MarriageCoupleOnboardingStepId,
  input: {
    coupleLinkActive: boolean;
    hasJourney: boolean;
    partnerJoined: boolean;
    myConsent: boolean;
    pendingInviteCode: boolean;
    firstOpenModuleId: string | null;
  },
): { actionHref?: string; actionLabel?: string } {
  switch (stepId) {
    case "journey":
      if (!input.hasJourney) {
        return { actionHref: "/marriage", actionLabel: "Open Marriage Prep hub" };
      }
      return {};
    case "link_partner":
      if (input.hasJourney && !input.partnerJoined && !input.pendingInviteCode) {
        return { actionHref: "/marriage/join", actionLabel: "Enter invitation code" };
      }
      if (!input.coupleLinkActive && !input.hasJourney) {
        return { actionHref: "/couples", actionLabel: "Link spouse account" };
      }
      return {};
    case "consent":
      if (!input.myConsent) {
        return { actionHref: "/marriage/consent", actionLabel: "Record your consent" };
      }
      return {};
    case "begin_prep":
      if (input.firstOpenModuleId) {
        return {
          actionHref: `/marriage/module/${input.firstOpenModuleId}`,
          actionLabel: "Continue assessment",
        };
      }
      return { actionHref: "/marriage/homework", actionLabel: "View homework" };
    case "counselor":
      return { actionHref: "/marriage#counselor-assignment", actionLabel: "Counselor status" };
    default:
      return {};
  }
}

export function buildCoupleOnboardingView(input: {
  signedIn: boolean;
  coupleLinkActive: boolean;
  hasJourney: boolean;
  partnerJoined: boolean;
  myConsent: boolean;
  partnerConsent: boolean;
  counselorSummary: MarriageHubCounselorSummary | null;
  pendingInviteCode?: boolean;
  firstOpenModuleId?: string | null;
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
      title: "Your consent",
      description: "Accept privacy and sharing rules on this device before assessments.",
      complete: input.myConsent,
      current: false,
    },
    ...(input.partnerJoined
      ? [
          {
            id: "partner_consent" as const,
            title: "Partner consent",
            description: "Your partner accepts the same rules on their own login.",
            complete: input.partnerConsent,
            current: false,
          },
        ]
      : []),
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
      complete:
        counselorReady &&
        input.myConsent &&
        (!input.partnerJoined || input.partnerConsent),
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

  const navInput = {
    coupleLinkActive: input.coupleLinkActive,
    hasJourney: input.hasJourney,
    partnerJoined: input.partnerJoined,
    myConsent: input.myConsent,
    pendingInviteCode: Boolean(input.pendingInviteCode),
    firstOpenModuleId: input.firstOpenModuleId ?? null,
  };

  const withCurrent = steps.map((s) => {
    const current = s.id === currentStepId;
    const action = current ? actionForStep(s.id, navInput) : {};
    return {
      ...s,
      current,
      ...action,
    };
  });

  const completedCount = withCurrent.filter((s) => s.complete).length;
  const progressPercent = Math.round((completedCount / withCurrent.length) * 100);

  const currentStep = withCurrent.find((s) => s.current);
  let nextStepTitle = "You're ready to prepare together";
  let nextStepDetail = "Keep up with homework and counseling appointments as your counselor guides you.";

  if (currentStep) {
    nextStepTitle = currentStep.title;
    nextStepDetail = currentStep.description;
    if (currentStep.id === "consent" && !input.myConsent) {
      nextStepDetail = "Open consent on this device — inviting or joining does not record consent for you.";
    }
    if (currentStep.id === "partner_consent" && input.myConsent && !input.partnerConsent) {
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
