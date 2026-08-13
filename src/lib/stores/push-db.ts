import webpush from "web-push";
import { prisma } from "@/lib/db";
import type { StoredPushSubscription } from "@/lib/stores/push-json";

function mapPushSubscription(record: {
  id: string;
  userId: string;
  endpoint: string;
  subscription: unknown;
  createdAt: Date;
}): StoredPushSubscription {
  return {
    id: record.id,
    userId: record.userId,
    endpoint: record.endpoint,
    subscription: record.subscription as webpush.PushSubscription,
    createdAt: record.createdAt.toISOString(),
  };
}

export async function getPushSubscriptions() {
  const records = await prisma.pushSubscription.findMany();
  return records.map(mapPushSubscription);
}

export async function savePushSubscription(
  userId: string,
  subscription: webpush.PushSubscription,
) {
  const endpoint = subscription.endpoint;
  const now = new Date();

  const record = await prisma.pushSubscription.upsert({
    where: { endpoint },
    create: {
      id: `push-${Date.now()}`,
      userId,
      endpoint,
      subscription: subscription as object,
      createdAt: now,
      updatedAt: now,
    },
    update: {
      userId,
      subscription: subscription as object,
      updatedAt: now,
    },
  });

  return mapPushSubscription(record);
}

export async function removePushSubscription(userId: string, endpoint?: string) {
  if (endpoint) {
    await prisma.pushSubscription.deleteMany({
      where: { userId, endpoint },
    });
    return;
  }

  await prisma.pushSubscription.deleteMany({
    where: { userId },
  });
}
