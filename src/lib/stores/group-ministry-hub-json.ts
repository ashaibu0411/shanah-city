import { promises as fs } from "fs";
import path from "path";
import type {
  GroupMinistryPrayerPost,
  GroupPinnedAnnouncement,
} from "@/lib/group-ministry-hub-types";

const DATA_DIR = path.join(process.cwd(), "data");
const FILE = path.join(DATA_DIR, "group-ministry-hub.json");

type HubFile = {
  announcements: Record<string, GroupPinnedAnnouncement>;
  prayerPosts: GroupMinistryPrayerPost[];
};

async function readHub(): Promise<HubFile> {
  try {
    const raw = await fs.readFile(FILE, "utf-8");
    const data = JSON.parse(raw) as HubFile;
    return {
      announcements: data.announcements ?? {},
      prayerPosts: Array.isArray(data.prayerPosts) ? data.prayerPosts : [],
    };
  } catch {
    return { announcements: {}, prayerPosts: [] };
  }
}

async function writeHub(data: HubFile) {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(FILE, JSON.stringify(data, null, 2));
}

export async function getGroupPinnedAnnouncement(groupId: string) {
  const hub = await readHub();
  return hub.announcements[groupId] ?? null;
}

export async function saveGroupPinnedAnnouncement(input: {
  groupId: string;
  title: string;
  body: string;
  actor: { id: string; name: string };
}) {
  const hub = await readHub();
  const now = new Date().toISOString();
  const record: GroupPinnedAnnouncement = {
    groupId: input.groupId,
    title: input.title.trim(),
    body: input.body.trim(),
    updatedAt: now,
    updatedBy: input.actor.id,
    updatedByName: input.actor.name,
  };
  hub.announcements[input.groupId] = record;
  await writeHub(hub);
  return record;
}

export async function listGroupMinistryPrayerPosts(groupId: string, limit = 40) {
  const hub = await readHub();
  return hub.prayerPosts
    .filter((post) => post.groupId === groupId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, limit);
}

export async function createGroupMinistryPrayerPost(input: {
  groupId: string;
  authorId: string;
  authorName: string;
  content: string;
  type: GroupMinistryPrayerPost["type"];
}) {
  const hub = await readHub();
  const record: GroupMinistryPrayerPost = {
    id: `gmprayer-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    groupId: input.groupId,
    authorId: input.authorId,
    authorName: input.authorName,
    content: input.content.trim(),
    type: input.type,
    createdAt: new Date().toISOString(),
  };
  hub.prayerPosts.push(record);
  if (hub.prayerPosts.length > 500) {
    hub.prayerPosts = hub.prayerPosts
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .slice(0, 500);
  }
  await writeHub(hub);
  return record;
}
