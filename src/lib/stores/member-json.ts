import { promises as fs } from "fs";
import path from "path";
import type {
  Comment,
  CommunityPost,
  KidCheckIn,
  UnavailabilityRequest,
  VolunteerCheckIn,
} from "@/lib/member-types";

const DATA_DIR = path.join(process.cwd(), "data");

async function readJson<T>(file: string, fallback: T): Promise<T> {
  try {
    const raw = await fs.readFile(path.join(DATA_DIR, file), "utf-8");
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

async function writeJson<T>(file: string, data: T) {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(path.join(DATA_DIR, file), JSON.stringify(data, null, 2));
}

export async function getCommunityPosts() {
  return readJson<CommunityPost[]>("community.json", []);
}

export async function saveCommunityPosts(posts: CommunityPost[]) {
  await writeJson("community.json", posts);
}

export async function addCommunityPost(post: CommunityPost) {
  const posts = await getCommunityPosts();
  posts.unshift(post);
  await saveCommunityPosts(posts);
  return post;
}

export async function addCommentToPost(postId: string, comment: Comment) {
  const posts = await getCommunityPosts();
  const index = posts.findIndex((post) => post.id === postId);
  if (index === -1) return null;
  posts[index].comments = [...(posts[index].comments ?? []), comment];
  await saveCommunityPosts(posts);
  return posts[index];
}

export async function reactToPost(postId: string) {
  const posts = await getCommunityPosts();
  const index = posts.findIndex((post) => post.id === postId);
  if (index === -1) return null;
  posts[index].reactions += 1;
  await saveCommunityPosts(posts);
  return posts[index];
}

export async function getCommunityPostById(postId: string) {
  const posts = await getCommunityPosts();
  return posts.find((post) => post.id === postId) ?? null;
}

export async function updateCommunityPost(
  postId: string,
  update: Partial<
    Pick<CommunityPost, "content" | "type" | "targetGroupId" | "targetGroupName" | "authorId" | "author">
  >,
) {
  const posts = await getCommunityPosts();
  const index = posts.findIndex((post) => post.id === postId);
  if (index === -1) return null;

  posts[index] = {
    ...posts[index],
    ...update,
    targetGroupId: update.targetGroupId === null ? undefined : update.targetGroupId ?? posts[index].targetGroupId,
    targetGroupName:
      update.targetGroupName === null ? undefined : update.targetGroupName ?? posts[index].targetGroupName,
  };
  await saveCommunityPosts(posts);
  return posts[index];
}

export async function deleteCommunityPost(postId: string) {
  const posts = await getCommunityPosts();
  const next = posts.filter((post) => post.id !== postId);
  if (next.length === posts.length) return false;
  await saveCommunityPosts(next);
  return true;
}

export async function getVolunteerCheckIns() {
  return readJson<VolunteerCheckIn[]>("volunteer-checkins.json", []);
}

export async function addVolunteerCheckIn(entry: VolunteerCheckIn) {
  const entries = await getVolunteerCheckIns();
  entries.unshift(entry);
  await writeJson("volunteer-checkins.json", entries);
  return entry;
}

export async function getKidCheckIns() {
  return readJson<KidCheckIn[]>("kids-checkins.json", []);
}

export async function addKidCheckIn(entry: KidCheckIn) {
  const entries = await getKidCheckIns();
  entries.unshift(entry);
  await writeJson("kids-checkins.json", entries);
  return entry;
}

export async function checkoutKid(id: string, checkedOutBy?: string) {
  const entries = await getKidCheckIns();
  const index = entries.findIndex((entry) => entry.id === id);
  if (index === -1) return null;
  entries[index].checkedOutAt = new Date().toISOString();
  if (checkedOutBy) {
    entries[index].checkedOutBy = checkedOutBy;
  }
  await writeJson("kids-checkins.json", entries);
  return entries[index];
}

export async function verifyCheckoutKid(
  id: string,
  input: { securityCode: string; checkedOutBy: string },
) {
  const entries = await getKidCheckIns();
  const index = entries.findIndex((entry) => entry.id === id);
  if (index === -1 || entries[index].checkedOutAt) return null;
  if (entries[index].securityCode !== input.securityCode.trim()) {
    return { error: "invalid_code" as const };
  }

  entries[index] = {
    ...entries[index],
    checkedOutAt: new Date().toISOString(),
    checkedOutBy: input.checkedOutBy,
    pickupVerified: true,
    pickupVerifiedAt: new Date().toISOString(),
  };
  await writeJson("kids-checkins.json", entries);
  return { checkin: entries[index] };
}

export async function getUnavailabilityRequests() {
  return readJson<UnavailabilityRequest[]>("unavailability.json", []);
}

export async function addUnavailabilityRequest(request: UnavailabilityRequest) {
  const requests = await getUnavailabilityRequests();
  requests.unshift(request);
  await writeJson("unavailability.json", requests);
  return request;
}

export async function updateUnavailabilityRequest(
  id: string,
  update: Partial<UnavailabilityRequest>,
) {
  const requests = await getUnavailabilityRequests();
  const index = requests.findIndex((request) => request.id === id);
  if (index === -1) return null;
  requests[index] = { ...requests[index], ...update };
  await writeJson("unavailability.json", requests);
  return requests[index];
}
