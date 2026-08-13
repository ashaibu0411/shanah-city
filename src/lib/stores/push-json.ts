import { promises as fs } from "fs";
import path from "path";
import webpush from "web-push";

const DATA_DIR = path.join(process.cwd(), "data");
const SUBSCRIPTIONS_FILE = path.join(DATA_DIR, "push-subscriptions.json");

export type StoredPushSubscription = {
  id: string;
  userId: string;
  endpoint: string;
  subscription: webpush.PushSubscription;
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
