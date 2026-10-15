import { getCoupleLinkById } from "@/lib/couple-link-server";
import { partnerIdFromLink } from "@/lib/couple-link-utils";
import type { MarriageCounselingJourneyRecord } from "@/lib/marriage-counseling-types";

export function journeyParticipantIds(journey: MarriageCounselingJourneyRecord): string[] {
  const ids: string[] = [];
  if (journey.participantAId) ids.push(journey.participantAId);
  if (journey.participantBId) ids.push(journey.participantBId);
  return ids;
}

export async function resolveJourneyPartnerId(
  journey: MarriageCounselingJourneyRecord,
  viewerId: string,
): Promise<string | null> {
  if (journey.participantAId && journey.participantBId) {
    if (journey.participantAId === viewerId) return journey.participantBId;
    if (journey.participantBId === viewerId) return journey.participantAId;
  }
  if (journey.coupleLinkId) {
    const link = await getCoupleLinkById(journey.coupleLinkId);
    if (link?.status === "active") {
      return partnerIdFromLink(link, viewerId);
    }
  }
  if (journey.participantAId === viewerId && !journey.participantBId) return null;
  return null;
}

export async function viewerIsJourneyParticipant(
  journey: MarriageCounselingJourneyRecord,
  viewerId: string,
): Promise<boolean> {
  const direct = journeyParticipantIds(journey);
  if (direct.includes(viewerId)) return true;
  if (!journey.coupleLinkId) return false;
  const link = await getCoupleLinkById(journey.coupleLinkId);
  if (!link || link.status !== "active") return false;
  return link.userAId === viewerId || link.userBId === viewerId;
}
