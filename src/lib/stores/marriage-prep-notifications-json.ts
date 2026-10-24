import { promises as fs } from "fs";
import path from "path";
import type { MarriagePrepUserNotificationRecord } from "@/lib/marriage-prep-notification-types";

const FILE =
  process.env.MARRIAGE_PREP_NOTIFICATIONS_FILE?.trim() ||
  path.join(process.cwd(), "data", "marriage-prep-notifications.json");

type StoreFile = { notifications: MarriagePrepUserNotificationRecord[] };

async function readStore(): Promise<StoreFile> {
  try {
    const raw = await fs.readFile(FILE, "utf-8");
    return JSON.parse(raw) as StoreFile;
  } catch {
    return { notifications: [] };
  }
}

async function writeStore(store: StoreFile) {
  await fs.mkdir(path.dirname(FILE), { recursive: true });
  await fs.writeFile(FILE, JSON.stringify(store, null, 2), "utf-8");
}

export async function tryCreateMarriagePrepUserNotification(
  record: MarriagePrepUserNotificationRecord,
) {
  const store = await readStore();
  const exists = store.notifications.some(
    (n) =>
      n.userId === record.userId && n.kind === record.kind && n.referenceKey === record.referenceKey,
  );
  if (exists) return false;
  store.notifications.push(record);
  await writeStore(store);
  return true;
}

export async function listMarriagePrepNotificationsForUser(userId: string, limit = 40) {
  const store = await readStore();
  return store.notifications
    .filter((n) => n.userId === userId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, limit);
}

export async function countUnreadMarriagePrepNotifications(userId: string) {
  const store = await readStore();
  return store.notifications.filter((n) => n.userId === userId && !n.readAt).length;
}

export async function markMarriagePrepNotificationRead(userId: string, notificationId: string) {
  const store = await readStore();
  const row = store.notifications.find((n) => n.id === notificationId && n.userId === userId);
  if (!row) return null;
  row.readAt = new Date().toISOString();
  await writeStore(store);
  return row;
}

export async function markAllMarriagePrepNotificationsRead(userId: string) {
  const store = await readStore();
  const now = new Date().toISOString();
  for (const n of store.notifications) {
    if (n.userId === userId && !n.readAt) n.readAt = now;
  }
  await writeStore(store);
}
