import { getUserById } from "@/lib/auth-server";
import { getCoupleLinkById } from "@/lib/couple-link-server";
import type { MarriageCounselingJourneyRecord } from "@/lib/marriage-counseling-types";

export async function resolveCoupleDisplayNames(
  journey: MarriageCounselingJourneyRecord,
): Promise<string> {
  const partnerA = journey.participantAId ? await getUserById(journey.participantAId) : null;
  let partnerBName = journey.participantBId ? (await getUserById(journey.participantBId))?.name : null;
  if (partnerA || partnerBName) {
    return [partnerA?.name, partnerBName].filter(Boolean).join(" & ");
  }
  if (journey.coupleLinkId) {
    const link = await getCoupleLinkById(journey.coupleLinkId);
    if (link) {
      const a = await getUserById(link.userAId);
      const b = await getUserById(link.userBId);
      return [a?.name, b?.name].filter(Boolean).join(" & ");
    }
  }
  return "Couple";
}

export async function resolveAssignedCounselorDisplayName(
  counselorUserId: string | null,
): Promise<string | null> {
  if (!counselorUserId?.trim()) return null;
  const user = await getUserById(counselorUserId);
  return user?.name ?? null;
}
