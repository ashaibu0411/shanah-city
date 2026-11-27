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
  if (inputs.length === 0) return;

  await Promise.all(
    inputs.map(async (input) => {
      const through = new Date(input.throughAt);
      if (Number.isNaN(through.getTime())) return;

      const existing = await prisma.notificationDismissal.findUnique({
        where: { userId_itemId: { userId, itemId: input.itemId } },
      });

      if (!existing) {
        await prisma.notificationDismissal.create({
          data: { userId, itemId: input.itemId, dismissedThroughAt: through },
        });
        return;
      }

      if (through > existing.dismissedThroughAt) {
        await prisma.notificationDismissal.update({
          where: { userId_itemId: { userId, itemId: input.itemId } },
          data: { dismissedThroughAt: through },
        });
      }
    }),
  );
}