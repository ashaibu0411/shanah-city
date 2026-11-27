import { prisma } from "@/lib/db";

export async function getDismissedNotificationItemIds(userId: string) {
  const records = await prisma.notificationDismissal.findMany({
    where: { userId },
    select: { itemId: true },
  });
  return new Set(records.map((record) => record.itemId));
}

export async function dismissNotificationItemIds(userId: string, itemIds: string[]) {
  if (itemIds.length === 0) return;

  const now = new Date();
  await prisma.notificationDismissal.createMany({
    data: itemIds.map((itemId) => ({ userId, itemId, dismissedAt: now })),
    skipDuplicates: true,
  });
}