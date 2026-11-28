import { prisma } from "@/lib/db";
import type { NotificationDismissalInput } from "@/lib/stores/notification-dismissal-json";

export async function getDismissedNotificationWatermarks(userId: string) {
  const records = await prisma.notificationDismissal.findMany({
    where: { userId },
    select: { itemId: true, dismissedThroughAt: true },
  });
  return new Map(records.map((record) => [record.itemId, record.dismissedThroughAt] as const));
}

export async function dismissNotificationItems(userId: string, inputs: NotificationDismissalInput[]) {
  for (const input of inputs) {
    const through = new Date(input.throughAt);
    if (Number.isNaN(through.getTime())) continue;
    await prisma.notificationDismissal.createMany({
      data: [{ userId, itemId: input.itemId, dismissedThroughAt: through }],
      skipDuplicates: true,
    });
    await prisma.notificationDismissal.updateMany({
      where: { userId, itemId: input.itemId, dismissedThroughAt: { lt: through } },
      data: { dismissedThroughAt: through },
    });
  }
}
