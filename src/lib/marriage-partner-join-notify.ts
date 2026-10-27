import type { MarriageCounselingJourneyRecord } from "@/lib/marriage-counseling-types";
import type { CoupleLinkRecord } from "@/lib/couple-link-types";
import { notifyHostPartnerJoined } from "@/lib/marriage-prep-notification-triggers";
import { sendPushToUsersWithPushEnabled } from "@/lib/push-server";
import { marriageStore } from "@/lib/stores/marriage-counseling-store";

const store = () => marriageStore();

/** Push fallback when no journey exists yet for in-app delivery. */
export function notifyMarriagePartnerJoinedPush(hostUserId: string) {
  void sendPushToUsersWithPushEnabled([hostUserId], {
    title: "Marriage journey",
    body: "Your partner joined your counseling journey.",
    url: "/marriage",
  });
}

export async function findJourneyForPartnerJoinedInApp(
  hostUserId: string,
  joinedUserId: string,
): Promise<MarriageCounselingJourneyRecord | null> {
  const actives = await store().listActiveJourneysForUser(hostUserId);
  for (const journey of actives) {
    if (journey.status !== "active") continue;
    const a = journey.participantAId;
    const b = journey.participantBId;
    if (!b || b !== joinedUserId) continue;
    if (a === hostUserId || journey.createdBy === hostUserId) return journey;
  }
  return null;
}

/** In-app (when journey exists) + push. Dedupe in-app via referenceKey on joined user id. */
export async function notifyHostThatPartnerJoined(
  hostUserId: string,
  joinedUserId: string,
) {
  if (!hostUserId.trim() || hostUserId === joinedUserId) return;

  const journey = await findJourneyForPartnerJoinedInApp(hostUserId, joinedUserId);
  if (journey) {
    void notifyHostPartnerJoined(journey, joinedUserId);
    return;
  }
  notifyMarriagePartnerJoinedPush(hostUserId);
}

export async function notifyAfterCoupleLinkAccepted(link: CoupleLinkRecord, accepterUserId: string) {
  const hostUserId = link.requestedBy;
  await notifyHostThatPartnerJoined(hostUserId, accepterUserId);
}
