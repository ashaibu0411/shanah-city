import { prisma } from "@/lib/db";
import type {
  MarriagePrepNotificationKind,
  MarriagePrepUserNotificationRecord,
} from "@/lib/marriage-prep-notification-types";

function mapRow(row: {
  id: string;
  userId: string;
  journeyId: string;
  kind: string;
  referenceKey: string;
  title: string;
  body: string;
  actionPath: string;
  readAt: Date | null;
  createdAt: Date;
}): MarriagePrepUserNotificationRecord {
  return {
    id: row.id,
    userId: row.userId,
    journeyId: row.journeyId,
    kind: row.kind as MarriagePrepNotificationKind,
    referenceKey: row.referenceKey,
    title: row.title,
    body: row.body,
    actionPath: row.actionPath,
    readAt: row.readAt?.toISOString() ?? null,
    createdAt: row.createdAt.toISOString(),
  };
}

export async function tryCreateMarriagePrepUserNotification(
  record: MarriagePrepUserNotificationRecord,
) {
  try {
    await prisma.marriagePrepUserNotification.create({
      data: {
        id: record.id,
        userId: record.userId,
        journeyId: record.journeyId,
        kind: record.kind,
        referenceKey: record.referenceKey,
        title: record.title,
        body: record.body,
        actionPath: record.actionPath,
        readAt: record.readAt ? new Date(record.readAt) : null,
        createdAt: new Date(record.createdAt),
      },
    });
    return true;
  } catch {
    return false;
  }
}

export async function listMarriagePrepNotificationsForUser(userId: string, limit = 40) {
  const rows = await prisma.marriagePrepUserNotification.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
  return rows.map(mapRow);
}

export async function countUnreadMarriagePrepNotifications(userId: string) {
  return prisma.marriagePrepUserNotification.count({
    where: { userId, readAt: null },
  });
}

export async function markMarriagePrepNotificationRead(userId: string, notificationId: string) {
  const existing = await prisma.marriagePrepUserNotification.findFirst({
    where: { id: notificationId, userId },
  });
  if (!existing) return null;
  const row = await prisma.marriagePrepUserNotification.update({
    where: { id: notificationId },
    data: { readAt: new Date() },
  });
  return mapRow(row);
}

export async function markAllMarriagePrepNotificationsRead(userId: string) {
  await prisma.marriagePrepUserNotification.updateMany({
    where: { userId, readAt: null },
    data: { readAt: new Date() },
  });
}
