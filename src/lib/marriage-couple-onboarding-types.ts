export type MarriageCoupleOnboardingStepId =
  | "account"
  | "journey"
  | "link_partner"
  | "consent"
  | "partner_consent"
  | "counselor"
  | "begin_prep";

export type MarriageCoupleOnboardingStep = {
  id: MarriageCoupleOnboardingStepId;
  title: string;
  description: string;
  complete: boolean;
  current: boolean;
};

export type MarriageCoupleOnboardingView = {
  steps: MarriageCoupleOnboardingStep[];
  currentStepId: MarriageCoupleOnboardingStepId | null;
  nextStepTitle: string;
  nextStepDetail: string;
  progressPercent: number;
};

export type MarriageCoupleAppointmentNotice = {
  sessionTitle: string;
  scheduledAt: string;
  schedulingTimeZone?: string;
  message: string;
};
