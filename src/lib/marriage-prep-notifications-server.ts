import { randomUUID } from "crypto";
import type { PublicMember } from "@/lib/auth-types";
import {
  assertJourneyParticipantLoose,
  isJourneyCounselorAccessRevoked,
  viewerIsAssignedClinicalCounselor,
} from "@/lib/marriage-counseling-access";
import type { MarriageCounselingJourneyRecord } from "@/lib/marriage-counseling-types";
import { isSeniorPastor } from "@/lib/marriage-counselor-assignment-authority";
import { assertAssignmentAdminOnJourney } from "@/lib/marriage-journey-administrative-coordinator-server";
import {
  audienceForMarriagePrepNotificationKind,
  type MarriagePrepNotificationAudience,
} from "@/lib/marriage-prep-notification-kinds";
import type {
  MarriagePrepNotificationKind,
  MarriagePrepNotificationListView,
  MarriagePrepUserNotificationRecord,
} from "@/lib/marriage-prep-notification-types";
import { getPastoralRoleAssignments } from "@/lib/pastoral-roles-server";
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

export async function getSeniorPastorUserId(): Promise<string | null> {
  const assignments = await getPastoralRoleAssignments();
  const id = assignments.seniorPastorUserId?.trim();
  return id || null;
}

async function assertRecipientsForAudience(
  journey: MarriageCounselingJourneyRecord,
  userIds: string[],
  audience: MarriagePrepNotificationAudience,
) {
  const unique = [...new Set(userIds)];
  if (unique.length === 0) throw new Error("Invalid notification recipient.");

  if (audience === "couple") {
    const allowed = new Set(journeyPartnerUserIds(journey));
    for (const id of unique) {
      if (!allowed.has(id)) throw new Error("Invalid notification recipient.");
    }
    return;
  }

  if (audience === "counselor") {
    const counselorId = journey.counselorUserId?.trim();
    if (!counselorId || isJourneyCounselorAccessRevoked(journey)) {
      throw new Error("No active assigned counselor for this journey.");
    }
    for (const id of unique) {
      if (id !== counselorId) throw new Error("Invalid notification recipient.");
    }
    return;
  }

  if (audience === "senior_pastor") {
    const spId = await getSeniorPastorUserId();
    if (!spId) throw new Error("Senior Pastor is not configured.");
    for (const id of unique) {
      if (id !== spId) throw new Error("Invalid notification recipient.");
    }
    return;
  }

  if (audience === "assignment_admin") {
    for (const id of unique) {
      try {
        await assertAssignmentAdminOnJourney({ id }, journey.id);
      } catch {
        throw new Error("Invalid notification recipient.");
      }
    }
  }
}

/** Privacy-safe in-app + optional push delivery with per-user deduplication. */
export async function deliverMarriagePrepNotifications(input: {
  journey: MarriageCounselingJourneyRecord;
  userIds: string[];
  audience?: MarriagePrepNotificationAudience;
  kind: MarriagePrepNotificationKind;
  referenceKey: string;
  title: string;
  body: string;
  actionPath: string;
  sendPush?: boolean;
  pushTitle?: string;
  pushBody?: string;
}) {
  const audience =
    input.audience ?? audienceForMarriagePrepNotificationKind(input.kind);
  await assertRecipientsForAudience(input.journey, input.userIds, audience);

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

export async function assertViewerCanAccessPrepNotification(
  viewer: PublicMember,
  item: MarriagePrepUserNotificationRecord,
  journey: MarriageCounselingJourneyRecord,
) {
  if (item.userId !== viewer.id) {
    throw new Error("Notification not found.");
  }

  const audience = audienceForMarriagePrepNotificationKind(item.kind);
  switch (audience) {
    case "couple":
      await assertJourneyParticipantLoose(journey, viewer.id);
      return;
    case "counselor":
      if (!viewerIsAssignedClinicalCounselor(viewer.id, journey)) {
        throw new Error("Notification not found.");
      }
      return;
    case "senior_pastor":
      if (!(await isSeniorPastor(viewer))) {
        throw new Error("Notification not found.");
      }
      return;
    case "assignment_admin":
      await assertAssignmentAdminOnJourney(viewer, journey.id);
      return;
    default:
      await assertJourneyParticipantLoose(journey, viewer.id);
  }
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
      await assertViewerCanAccessPrepNotification(viewer, item, journey);
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
  await assertViewerCanAccessPrepNotification(viewer, row, journey);
  return row;
}

export async function markAllMarriagePrepNotificationsReadForViewer(viewer: PublicMember) {
  const list = await listMarriagePrepNotificationsForViewer(viewer, 200);
  for (const item of list.items) {
    if (!item.readAt) {
      await notifyStore().markMarriagePrepNotificationRead(viewer.id, item.id);
    }
  }
}

export async function countUnreadMarriagePrepNotificationsForViewer(viewer: PublicMember) {
  const list = await listMarriagePrepNotificationsForViewer(viewer, 100);
  return list.unreadCount;
}
