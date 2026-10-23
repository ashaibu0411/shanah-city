import { getUserById } from "@/lib/auth-server";
import { getCoupleLinkById } from "@/lib/couple-link-server";
import type { MarriageCounselingJourneyRecord } from "@/lib/marriage-counseling-types";
import { getPublicDisplayName } from "@/lib/member-display-name";

function partnerPublicLabel(user: { name: string; displayName?: string | null } | null | undefined) {
  if (!user) return null;
  const label = getPublicDisplayName(user).trim();
  return label || null;
}

export async function resolveCoupleDisplayNames(
  journey: MarriageCounselingJourneyRecord,
): Promise<string> {
  const partnerA = journey.participantAId ? await getUserById(journey.participantAId) : null;
  const partnerB = journey.participantBId ? await getUserById(journey.participantBId) : null;
  const labels = [partnerPublicLabel(partnerA), partnerPublicLabel(partnerB)].filter(Boolean);
  if (labels.length > 0) {
    return labels.join(" & ");
  }
  if (journey.coupleLinkId) {
    const link = await getCoupleLinkById(journey.coupleLinkId);
    if (link) {
      const a = await getUserById(link.userAId);
      const b = await getUserById(link.userBId);
      const linkLabels = [partnerPublicLabel(a), partnerPublicLabel(b)].filter(Boolean);
      if (linkLabels.length > 0) return linkLabels.join(" & ");
    }
  }
  return "Couple";
}

export async function resolveAssignedCounselorDisplayName(
  counselorUserId: string | null,
): Promise<string | null> {
  if (!counselorUserId?.trim()) return null;
  const user = await getUserById(counselorUserId);
  if (!user) return null;
  const label = getPublicDisplayName(user).trim();
  return label || null;
}
