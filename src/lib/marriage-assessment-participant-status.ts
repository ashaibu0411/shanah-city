import type { MarriageHubModuleProgress } from "@/lib/marriage-counseling-types";

/** True when the participant has a finalized assessment (status or legacy submittedAt). */
export function isAssessmentSubmitted(
  response: { status?: string; submittedAt?: string | null } | null | undefined,
): boolean {
  if (!response) return false;
  if (response.status === "submitted") return true;
  return Boolean(response.submittedAt?.trim());
}

export function hubModuleStatusFromResponse(
  response: { status?: string; submittedAt?: string | null } | null | undefined,
): MarriageHubModuleProgress["myStatus"] {
  if (!response) return "not_started";
  if (isAssessmentSubmitted(response)) return "submitted";
  return "draft";
}

export function hubPartnerModuleStatusFromResponse(
  response: { status?: string; submittedAt?: string | null } | null | undefined,
): MarriageHubModuleProgress["partnerStatus"] {
  if (!response) return "not_started";
  if (isAssessmentSubmitted(response)) return "submitted";
  return "draft";
}
