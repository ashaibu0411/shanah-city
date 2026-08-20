import { getUserById } from "@/lib/auth-server";
import { getDevotions } from "@/lib/devotion-server";
import { getFeedLastReads } from "@/lib/feed-read-server";
import { userIsInKidsMinistryGroup } from "@/lib/kids-access-server";
import { listKidsIncidents, listKidsLessons } from "@/lib/kids-server";
import { getMeetings } from "@/lib/meeting-server";
import { listMediaClips } from "@/lib/media-clips-server";
import { getCommunityPostsForViewer } from "@/lib/member-server";
import type { AppNotificationItem, FeedReadKey } from "@/lib/notification-types";
import { listWorshipPlans } from "@/lib/worship-server";
import { isDevotionPubliclyVisible } from "@/lib/devotion-utils";

const MAX_ITEMS_PER_FEED = 8;

function sinceDate(
  feedKey: FeedReadKey,
  lastReads: Partial<Record<FeedReadKey, string>>,
  userCreatedAt?: string,
) {
  const lastRead = lastReads[feedKey];
  if (lastRead) return new Date(lastRead);
  if (userCreatedAt) return new Date(userCreatedAt);
  return new Date(0);
}

function isAfter(iso: string | undefined, since: Date) {
  if (!iso) return false;
  const time = new Date(iso).getTime();
  return Number.isFinite(time) && time > since.getTime();
}

function communityTitle(type: string, groupName?: string) {
  if (type === "prayer") return "New prayer request";
  if (type === "praise") return "New praise shared";
  return groupName ? `${groupName} announcement` : "Church announcement";
}

export async function getFeedNotificationItems(
  userId: string,
): Promise<AppNotificationItem[]> {
  const [lastReads, user] = await Promise.all([
    getFeedLastReads(userId),
    getUserById(userId),
  ]);
  const userCreatedAt = user?.createdAt;

  const [
    communityItems,
    devotionItems,
    mediaItems,
    worshipItems,
    meetingItems,
    kidsItems,
  ] = await Promise.all([
    getCommunityItems(userId, sinceDate("community", lastReads, userCreatedAt)),
    getDevotionItems(userId, sinceDate("devotions", lastReads, userCreatedAt)),
    getMediaItems(sinceDate("media", lastReads, userCreatedAt)),
    getWorshipItems(userId, sinceDate("worship", lastReads, userCreatedAt)),
    getMeetingItems(sinceDate("meetings", lastReads, userCreatedAt)),
    getKidsItems(userId, sinceDate("kids", lastReads, userCreatedAt)),
  ]);

  return [
    ...communityItems,
    ...devotionItems,
    ...mediaItems,
    ...worshipItems,
    ...meetingItems,
    ...kidsItems,
  ]
    .sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime())
    .slice(0, 40);
}

async function getCommunityItems(userId: string, since: Date) {
  const posts = await getCommunityPostsForViewer(userId);
  const items: AppNotificationItem[] = [];

  for (const post of posts) {
    const at = post.createdAt;
    if (!isAfter(at, since)) continue;

    items.push({
      id: `community-${post.id}`,
      type: "community",
      title: communityTitle(post.type, post.targetGroupName),
      body: `${post.author}: ${post.content.slice(0, 120)}`,
      href: "/community",
      count: 1,
      at: at!,
    });
    if (items.length >= MAX_ITEMS_PER_FEED) break;
  }

  return items;
}

async function getDevotionItems(userId: string, since: Date) {
  const devotions = await getDevotions();
  const items: AppNotificationItem[] = [];

  for (const devotion of devotions) {
    if (devotion.authorId === userId) continue;
    if (!isDevotionPubliclyVisible(devotion)) continue;
    const at = devotion.publishAt ?? devotion.createdAt;
    if (!isAfter(at, since)) continue;

    items.push({
      id: `devotion-${devotion.id}`,
      type: "devotion",
      title: "New devotion ready",
      body: devotion.title,
      href: "/devotions",
      count: 1,
      at: at!,
    });
    if (items.length >= MAX_ITEMS_PER_FEED) break;
  }

  return items;
}

async function getMediaItems(since: Date) {
  const clips = await listMediaClips();
  const items: AppNotificationItem[] = [];

  for (const clip of clips) {
    if (!isAfter(clip.publishedAt, since)) continue;
    items.push({
      id: `media-${clip.id}`,
      type: "media",
      title: "New short video",
      body: clip.title,
      href: "/live",
      count: 1,
      at: clip.publishedAt!,
    });
    if (items.length >= MAX_ITEMS_PER_FEED) break;
  }

  return items;
}

async function getWorshipItems(userId: string, since: Date) {
  const plans = await listWorshipPlans({ status: "published" });
  const items: AppNotificationItem[] = [];

  for (const plan of plans) {
    const onTeam = plan.team.some((member) => member.userId === userId);
    if (!onTeam) continue;
    const at = plan.publishedAt ?? plan.updatedAt;
    if (!isAfter(at, since)) continue;

    items.push({
      id: `worship-${plan.id}`,
      type: "worship",
      title: "Worship plan published",
      body: plan.title?.trim() || `${plan.serviceDate} service`,
      href: `/worship?date=${encodeURIComponent(plan.serviceDate)}&time=${encodeURIComponent(String(plan.serviceTime))}`,
      count: 1,
      at: at!,
    });
    if (items.length >= MAX_ITEMS_PER_FEED) break;
  }

  return items;
}

async function getMeetingItems(since: Date) {
  const meetings = await getMeetings();
  const items: AppNotificationItem[] = [];

  for (const meeting of meetings) {
    const at = meeting.lastNotifiedOn;
    if (!at || !isAfter(at, since)) continue;

    items.push({
      id: `meeting-${meeting.id}`,
      type: "meeting",
      title: meeting.title,
      body: meeting.schedule,
      href: "/meetings",
      count: 1,
      at,
    });
    if (items.length >= MAX_ITEMS_PER_FEED) break;
  }

  return items;
}

async function getKidsItems(userId: string, since: Date) {
  const items: AppNotificationItem[] = [];
  const incidents = await listKidsIncidents({ limit: 20 });

  for (const incident of incidents) {
    if (incident.parentUserId !== userId) continue;
    if (!isAfter(incident.createdAt, since)) continue;
    items.push({
      id: `kids-incident-${incident.id}`,
      type: "kids",
      title: "Kids ministry update",
      body: `${incident.childName}: ${incident.summary}`,
      href: "/profile",
      count: 1,
      at: incident.createdAt,
    });
    if (items.length >= MAX_ITEMS_PER_FEED) break;
  }

  if (items.length < MAX_ITEMS_PER_FEED && (await userIsInKidsMinistryGroup(userId))) {
    const lessons = await listKidsLessons({ status: "published" });
    for (const lesson of lessons) {
      if (lesson.createdBy === userId || lesson.status !== "published") continue;
      const at = lesson.publishedAt ?? lesson.createdAt;
      if (!isAfter(at, since)) continue;
      items.push({
        id: `kids-lesson-${lesson.id}`,
        type: "kids",
        title: "Kids lesson published",
        body: `${lesson.ageGroup}: ${lesson.title}`,
        href: `/kids-ministry?week=${encodeURIComponent(lesson.weekStarting)}`,
        count: 1,
        at: at!,
      });
      if (items.length >= MAX_ITEMS_PER_FEED) break;
    }
  }

  return items;
}
