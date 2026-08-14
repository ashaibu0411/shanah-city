import { promises as fs } from "fs";
import path from "path";
import { deleteUserAvatar } from "@/lib/avatar-server";
import type { MemberProfile } from "@/lib/auth-types";
import type { UserBlock, MessageReport } from "@/lib/block-types";
import type { Group, GroupJoinRequest } from "@/lib/group-types";
import type { DirectMessage, MessageThread } from "@/lib/member-types";
import type { StoredPushSubscription } from "@/lib/stores/push-json";

const DATA_DIR = path.join(process.cwd(), "data");
const USERS_FILE = path.join(DATA_DIR, "users.json");
const SESSIONS_FILE = path.join(DATA_DIR, "sessions.json");
const ACTIVITY_FILE = path.join(DATA_DIR, "activity.json");
const PUSH_FILE = path.join(DATA_DIR, "push-subscriptions.json");
const JOIN_REQUESTS_FILE = path.join(DATA_DIR, "group-join-requests.json");
const BLOCKS_FILE = path.join(DATA_DIR, "message-blocks.json");
const REPORTS_FILE = path.join(DATA_DIR, "message-reports.json");
const THREADS_FILE = path.join(DATA_DIR, "message-threads.json");
const MESSAGES_FILE = path.join(DATA_DIR, "messages.json");
const GROUPS_FILE = path.join(DATA_DIR, "groups.json");
const DOWNLOADS_FILE = path.join(DATA_DIR, "gallery-downloads.json");
const GALLERY_FILE = path.join(DATA_DIR, "gallery.json");
const MEETING_CLICKS_FILE = path.join(DATA_DIR, "meeting-clicks.json");
const DEVOTIONS_FILE = path.join(DATA_DIR, "devotions.json");

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

export async function deleteUserAccountData(userId: string) {
  await deleteUserAvatar(userId);

  const users = (await readJson<MemberProfile[]>(USERS_FILE, [])).filter(
    (user) => user.id !== userId,
  );
  await writeJson(USERS_FILE, users);

  const sessions = (
    await readJson<{ token: string; userId: string; expiresAt: string }[]>(SESSIONS_FILE, [])
  ).filter((session) => session.userId !== userId);
  await writeJson(SESSIONS_FILE, sessions);

  const activity = (await readJson<{ userId: string }[]>(ACTIVITY_FILE, [])).filter(
    (item) => item.userId !== userId,
  );
  await writeJson(ACTIVITY_FILE, activity);

  const pushSubs = (await readJson<StoredPushSubscription[]>(PUSH_FILE, [])).filter(
    (item) => item.userId !== userId,
  );
  await writeJson(PUSH_FILE, pushSubs);

  const joinRequests = (await readJson<GroupJoinRequest[]>(JOIN_REQUESTS_FILE, [])).filter(
    (item) => item.userId !== userId,
  );
  await writeJson(JOIN_REQUESTS_FILE, joinRequests);

  const blocks = (await readJson<UserBlock[]>(BLOCKS_FILE, [])).filter(
    (item) => item.blockerId !== userId && item.blockedUserId !== userId,
  );
  await writeJson(BLOCKS_FILE, blocks);

  const reports = (await readJson<MessageReport[]>(REPORTS_FILE, [])).filter(
    (item) => item.reporterId !== userId && item.reportedUserId !== userId,
  );
  await writeJson(REPORTS_FILE, reports);

  const threads = (await readJson<MessageThread[]>(THREADS_FILE, [])).filter(
    (thread) => !thread.participantIds.includes(userId),
  );
  await writeJson(THREADS_FILE, threads);

  const threadIds = new Set(threads.map((thread) => thread.id));
  const messages = (await readJson<DirectMessage[]>(MESSAGES_FILE, [])).filter((message) =>
    threadIds.has(message.threadId),
  );
  await writeJson(MESSAGES_FILE, messages);

  const groups = await readJson<Group[]>(GROUPS_FILE, []);
  await writeJson(
    GROUPS_FILE,
    groups.map((group) => ({
      ...group,
      memberIds: group.memberIds.filter((id) => id !== userId),
      adminIds: group.adminIds.filter((id) => id !== userId),
      updatedAt: new Date().toISOString(),
    })),
  );

  const galleryDownloads = (await readJson<{ userId: string }[]>(DOWNLOADS_FILE, [])).filter(
    (item) => item.userId !== userId,
  );
  await writeJson(DOWNLOADS_FILE, galleryDownloads);

  const galleryPhotos = (await readJson<{ uploadedBy?: string }[]>(GALLERY_FILE, [])).filter(
    (photo) => photo.uploadedBy !== userId,
  );
  await writeJson(GALLERY_FILE, galleryPhotos);

  const meetingClicks = (await readJson<{ userId: string }[]>(MEETING_CLICKS_FILE, [])).filter(
    (item) => item.userId !== userId,
  );
  await writeJson(MEETING_CLICKS_FILE, meetingClicks);

  const devotions = (await readJson<{ authorId?: string | null }[]>(DEVOTIONS_FILE, [])).map(
    (devotion) =>
      devotion.authorId === userId ? { ...devotion, authorId: null } : devotion,
  );
  await writeJson(DEVOTIONS_FILE, devotions);
}
