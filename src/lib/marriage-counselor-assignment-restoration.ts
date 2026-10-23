import type { MarriageCounselingJourneyRecord } from "@/lib/marriage-counseling-types";
import { journeyParticipantIds } from "@/lib/marriage-counseling-participants";
import type { MarriageCounselorParticipantRevocationRecord } from "@/lib/marriage-counseling-types";

/** After any participant revoke, restoration requires explicit per-participant acknowledgment. */
export function restorationAcknowledgmentRequired(
  revocations: MarriageCounselorParticipantRevocationRecord[],
  _journey: MarriageCounselingJourneyRecord,
): boolean {
  return revocations.length > 0;
}

export function requiredRestorationAcknowledgmentUserIds(
  revocations: MarriageCounselorParticipantRevocationRecord[],
): string[] {
  return revocations.map((r) => r.userId);
}

export function allRequiredRestorationAcknowledgmentsPresent(
  requiredUserIds: string[],
  acknowledgedUserIds: string[],
): boolean {
  if (requiredUserIds.length === 0) return true;
  const ackSet = new Set(acknowledgedUserIds);
  return requiredUserIds.every((id) => ackSet.has(id));
}

/** Joined participants who may acknowledge (A + B when both present). */
export function acknowledgmentEligibleParticipantIds(
  journey: MarriageCounselingJourneyRecord,
): string[] {
  const ids = journeyParticipantIds(journey);
  return ids.filter(Boolean);
}
