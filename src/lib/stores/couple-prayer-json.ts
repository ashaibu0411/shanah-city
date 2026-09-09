import { promises as fs } from "fs";
import path from "path";
import type { CouplePrayerPostRecord } from "@/lib/couple-prayer-types";

const DATA_DIR = path.join(process.cwd(), "data");
const FILE = path.join(DATA_DIR, "couple-prayer-posts.json");

async function readPosts() {
  try {
    const raw = await fs.readFile(FILE, "utf-8");
    return JSON.parse(raw) as CouplePrayerPostRecord[];
  } catch {
    return [];
  }
}

async function writePosts(posts: CouplePrayerPostRecord[]) {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(FILE, JSON.stringify(posts, null, 2));
}

export async function getCouplePrayerPosts(coupleLinkId: string) {
  const posts = await readPosts();
  return posts
    .filter((post) => post.coupleLinkId === coupleLinkId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function createCouplePrayerPost(input: {
  coupleLinkId: string;
  authorId: string;
  authorName: string;
  content: string;
  type?: CouplePrayerPostRecord["type"];
}) {
  const posts = await readPosts();
  const record: CouplePrayerPostRecord = {
    id: `cprayer-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    coupleLinkId: input.coupleLinkId,
    authorId: input.authorId,
    authorName: input.authorName,
    content: input.content.trim(),
    type: input.type ?? "prayer",
    createdAt: new Date().toISOString(),
  };
  posts.push(record);
  await writePosts(posts);
  return record;
}
