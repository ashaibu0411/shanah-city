import { randomUUID } from "crypto";
import type { PublicMember } from "@/lib/auth-types";
import { assertJourneyParticipantLoose } from "@/lib/marriage-counseling-access";
import type { MarriageCounselingJourneyRecord } from "@/lib/marriage-counseling-types";
import type {
  MarriagePrepNotificationKind,
  MarriagePrepNotificationListView,
} from "@/lib/marriage-prep-notification-types";
import { sendPushToUsersWithPushEnabled } from "@/lib/push-server";
import { marriageStore } from "@/lib/stores/marriage-counseling-store";
import * as prepNotifyDb from "@/lib/stores/marriage-prep-notifications-db";
import * as prepNotifyJson from "@/lib/stores/marriage-prep-notifications-json";
import { useDatabase } from "@/lib/use-database";

const store = () => marriageStore();
const notifyStore = () => (useDatabase() ? prepNotifyDb : prepNotifyJson);

export function journeyPartnerUserIds(journey: MarriageCounselingJourneyRecord) {
  return [journey.participantAId, journey.participantBId].filter(Boolean) as string[];
}

function assertRecipientsAreJourneyPartners(
  journey: MarriageCounselingJourneyRecord,
  userIds: string[],
) {
  const allowed = new Set(journeyPartnerUserIds(journey));
  for (const id of userIds) {
    if (!allowed.has(id)) throw new Error("Invalid notification recipient.");
  }
}

/** Privacy-safe in-app + optional push delivery with per-user deduplication. */
export async function deliverMarriagePrepNotifications(input: {
  journey: MarriageCounselingJourneyRecord;
  userIds: string[];
  kind: MarriagePrepNotificationKind;
  referenceKey: string;
  title: string;
  body: string;
  actionPath: string;
  sendPush?: boolean;
  pushTitle?: string;
  pushBody?: string;
}) {
  assertRecipientsAreJourneyPartners(input.journey, input.userIds);
  const now = new Date().toISOString();
  let created = 0;

  for (const userId of input.userIds) {
    const inserted = await notifyStore().tryCreateMarriagePrepUserNotification({
      id: randomUUID(),
      userId,
      journeyId: input.journey.id,
      kind: input.kind,
      referenceKey: input.referenceKey,
      title: input.title,
      body: input.body,
      actionPath: input.actionPath,
      readAt: null,
      createdAt: now,
    });
    if (!inserted) continue;
    created += 1;

    if (input.sendPush !== false) {
      const pushRecorded = await store().tryRecordPremaritalReminderDelivery({
        id: randomUUID(),
        kind: `push_${input.kind}`,
        referenceKey: `${userId}:${input.referenceKey}`,
        journeyId: input.journey.id,
        sentAt: now,
      });
      if (pushRecorded) {
        void sendPushToUsersWithPushEnabled([userId], {
          title: input.pushTitle ?? input.title,
          body: input.pushBody ?? input.body,
          url: input.actionPath,
        });
      }
    }
  }

  return { created };
}

export async function listMarriagePrepNotificationsForViewer(
  viewer: PublicMember,
  limit = 40,
): Promise<MarriagePrepNotificationListView> {
  const items = await notifyStore().listMarriagePrepNotificationsForUser(viewer.id, limit);
  const filtered: typeof items = [];
  for (const item of items) {
    const journey = await store().getJourneyById(item.journeyId);
    if (!journey) continue;
    try {
      await assertJourneyParticipantLoose(journey, viewer.id);
      filtered.push(item);
    } catch {
      /* skip stale or unauthorized */
    }
  }
  const unreadCount = filtered.filter((n) => !n.readAt).length;
  return { unreadCount, items: filtered };
}

export async function markMarriagePrepNotificationReadForViewer(
  viewer: PublicMember,
  notificationId: string,
) {
  const row = await notifyStore().markMarriagePrepNotificationRead(viewer.id, notificationId);
  if (!row) throw new Error("Notification not found.");
  const journey = await store().getJourneyById(row.journeyId);
  if (!journey) throw new Error("Notification not found.");
  await assertJourneyParticipantLoose(journey, viewer.id);
  return row;
}

export async function markAllMarriagePrepNotificationsReadForViewer(viewer: PublicMember) {
  await notifyStore().markAllMarriagePrepNotificationsRead(viewer.id);
}

export async function countUnreadMarriagePrepNotificationsForViewer(viewer: PublicMember) {
  const list = await listMarriagePrepNotificationsForViewer(viewer, 100);
  return list.unreadCount;
}
