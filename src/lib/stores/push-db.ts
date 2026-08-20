import webpush from "web-push";
import { prisma } from "@/lib/db";
import type {
  StoredNativePushToken,
  StoredPushSubscription,
} from "@/lib/stores/push-json";

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

function mapNativePushToken(record: {
  id: string;
  userId: string;
  token: string;
  platform: string;
  createdAt: Date;
}): StoredNativePushToken {
  return {
    id: record.id,
    userId: record.userId,
    token: record.token,
    platform: record.platform === "ios" ? "ios" : "android",
    createdAt: record.createdAt.toISOString(),
  };
}

export async function getNativePushTokens() {
  const records = await prisma.nativePushToken.findMany();
  return records.map(mapNativePushToken);
}

export async function saveNativePushToken(
  userId: string,
  token: string,
  platform: "ios" | "android",
) {
  const now = new Date();
  const record = await prisma.nativePushToken.upsert({
    where: { token },
    create: {
      id: `native-push-${Date.now()}`,
      userId,
      token,
      platform,
      createdAt: now,
      updatedAt: now,
    },
    update: {
      userId,
      platform,
      updatedAt: now,
    },
  });
  return mapNativePushToken(record);
}

export async function removeNativePushToken(userId: string, token?: string) {
  if (token) {
    await prisma.nativePushToken.deleteMany({
      where: { userId, token },
    });
    return;
  }

  await prisma.nativePushToken.deleteMany({
    where: { userId },
  });
}
