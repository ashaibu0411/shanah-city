/**
 * Counselor comparison disclosure — Phase 2B default deny.
 *
 * Spouse comparison unlock and shared_after_both_submit visibility do NOT authorize
 * counselor disclosure. Until a future phase adds explicit counselor comparison consent
 * (schema + grant API), counselors must not receive comparison items or attention summaries.
 */
export const MARRIAGE_COUNSELOR_COMPARISON_DISCLOSURE_PHASE = "withheld_until_explicit_consent";

export function counselorComparisonDisclosureEnabled(): boolean {
  return false;
}
