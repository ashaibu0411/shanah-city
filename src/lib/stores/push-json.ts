import { promises as fs } from "fs";
import path from "path";
import webpush from "web-push";

const DATA_DIR = path.join(process.cwd(), "data");
const SUBSCRIPTIONS_FILE = path.join(DATA_DIR, "push-subscriptions.json");
const NATIVE_TOKENS_FILE = path.join(DATA_DIR, "native-push-tokens.json");

export type StoredPushSubscription = {
  id: string;
  userId: string;
  endpoint: string;
  subscription: webpush.PushSubscription;
  createdAt: string;
};

export type StoredNativePushToken = {
  id: string;
  userId: string;
  token: string;
  platform: "ios" | "android";
  createdAt: string;
};

async function readJson<T>(file: string, fallback: T): Promise<T> {
  try {
    const raw = await fs.readFile(file, "utf-8");
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

async function writeJson<T>(file: string, data: T) {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(file, JSON.stringify(data, null, 2));
}

export async function getPushSubscriptions() {
  return readJson<StoredPushSubscription[]>(SUBSCRIPTIONS_FILE, []);
}

export async function savePushSubscription(
  userId: string,
  subscription: webpush.PushSubscription,
) {
  const subscriptions = await getPushSubscriptions();
  const endpoint = subscription.endpoint;
  const existingIndex = subscriptions.findIndex(
    (item) => item.userId === userId && item.endpoint === endpoint,
  );

  const record: StoredPushSubscription = {
    id: existingIndex >= 0 ? subscriptions[existingIndex].id : `push-${Date.now()}`,
    userId,
    endpoint,
    subscription,
    createdAt:
      existingIndex >= 0
        ? subscriptions[existingIndex].createdAt
        : new Date().toISOString(),
  };

  if (existingIndex >= 0) {
    subscriptions[existingIndex] = record;
  } else {
    subscriptions.push(record);
  }

  await writeJson(SUBSCRIPTIONS_FILE, subscriptions);
  return record;
}

export async function removePushSubscription(userId: string, endpoint?: string) {
  const subscriptions = await getPushSubscriptions();
  const next = subscriptions.filter((item) => {
    if (item.userId !== userId) return true;
    if (!endpoint) return false;
    return item.endpoint !== endpoint;
  });
  await writeJson(SUBSCRIPTIONS_FILE, next);
}

export async function getNativePushTokens() {
  return readJson<StoredNativePushToken[]>(NATIVE_TOKENS_FILE, []);
}

export async function saveNativePushToken(
  userId: string,
  token: string,
  platform: "ios" | "android",
) {
  const tokens = await getNativePushTokens();
  const existingIndex = tokens.findIndex((item) => item.token === token);
  const now = new Date().toISOString();
  const record: StoredNativePushToken = {
    id: existingIndex >= 0 ? tokens[existingIndex].id : `native-push-${Date.now()}`,
    userId,
    token,
    platform,
    createdAt: existingIndex >= 0 ? tokens[existingIndex].createdAt : now,
  };

  if (existingIndex >= 0) {
    tokens[existingIndex] = record;
  } else {
    tokens.push(record);
  }

  await writeJson(NATIVE_TOKENS_FILE, tokens);
  return record;
}

export async function removeNativePushToken(userId: string, token?: string) {
  const tokens = await getNativePushTokens();
  const next = tokens.filter((item) => {
    if (item.userId !== userId) return true;
    if (!token) return false;
    return item.token !== token;
  });
  await writeJson(NATIVE_TOKENS_FILE, next);
}
