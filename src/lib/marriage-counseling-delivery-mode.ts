import type { MarriageCounselingJourneyRecord } from "@/lib/marriage-counseling-types";

export const MARRIAGE_COUNSELING_DELIVERY_MODES = [
  "IN_PERSON",
  "VIRTUAL",
  "SELF_PACED",
  "HYBRID",
] as const;

export type MarriageCounselingDeliveryMode = (typeof MARRIAGE_COUNSELING_DELIVERY_MODES)[number];

export function parseCounselingDeliveryMode(
  value: unknown,
): MarriageCounselingDeliveryMode | null {
  const raw = String(value ?? "").trim().toUpperCase();
  if (!raw) return null;
  return (MARRIAGE_COUNSELING_DELIVERY_MODES as readonly string[]).includes(raw)
    ? (raw as MarriageCounselingDeliveryMode)
    : null;
}

export function counselingDeliveryModeLabel(mode: MarriageCounselingDeliveryMode | null | undefined) {
  switch (mode) {
    case "IN_PERSON":
      return "In person";
    case "VIRTUAL":
      return "Virtual";
    case "SELF_PACED":
      return "Self-paced";
    case "HYBRID":
      return "Hybrid";
    default:
      return "Standard (meetings)";
  }
}

/** Self-paced review workflow applies when mode is self-paced or hybrid. */
export function journeyUsesSelfPacedCounselingReview(
  journey: Pick<MarriageCounselingJourneyRecord, "counselingDeliveryMode">,
) {
  const mode = journey.counselingDeliveryMode ?? null;
  return mode === "SELF_PACED" || mode === "HYBRID";
}

/** Direct "mark complete" without review is blocked for pure self-paced journeys. */
export function journeyRequiresSelfPacedReviewForSessionCompletion(
  journey: Pick<MarriageCounselingJourneyRecord, "counselingDeliveryMode">,
) {
  return journey.counselingDeliveryMode === "SELF_PACED";
}

export const SELF_PACED_ASYNC_DISCLAIMER =
  "Messages and homework responses in Marriage Prep are reviewed by your counselor during business hours. This is not monitored continuously and is not an emergency support channel. If you are in immediate danger, call local emergency services.";

export type MarriageCounselingModeOption = {
  mode: MarriageCounselingDeliveryMode;
  title: string;
  summary: string;
};

export const MARRIAGE_COUNSELING_MODE_OPTIONS: MarriageCounselingModeOption[] = [
  {
    mode: "IN_PERSON",
    title: "In-person counseling",
    summary:
      "Meet with your counselor at church or another agreed location for each session. You still complete assessments and homework in the app between visits.",
  },
  {
    mode: "VIRTUAL",
    title: "Virtual counseling",
    summary:
      "Join scheduled video sessions with your counselor. Complete your assessments and homework in the app before and after each meeting.",
  },
  {
    mode: "SELF_PACED",
    title: "Self-paced counseling",
    summary:
      "Complete your counseling lessons when it works for your schedule. Your assigned counselor will personally review your answers, provide guidance, assign homework, and approve your progress—all within the app.",
  },
  {
    mode: "HYBRID",
    title: "Hybrid counseling",
    summary:
      "Blend in-person or virtual meetings with self-paced lessons in the app. Your counselor sets the rhythm and reviews your work between meetings.",
  },
];
