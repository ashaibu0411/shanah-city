import type { PublicMember } from "@/lib/auth-types";
import {
  canPostCouplePrayer,
  canViewCouplePrayerLink,
  getVisibleCoupleLinkIdsForViewer,
} from "@/lib/couple-prayer-access-server";
import { getActiveCoupleLinkForUserId, getCoupleLinkById } from "@/lib/couple-link-server";
import { useDatabase } from "@/lib/use-database";
import * as couplePrayerDb from "@/lib/stores/couple-prayer-db";
import * as couplePrayerJson from "@/lib/stores/couple-prayer-json";

const prayerStore = () => (useDatabase() ? couplePrayerDb : couplePrayerJson);

export async function getCouplePrayerFeed(viewer: PublicMember | null) {
  if (!viewer) {
    return { posts: [], canPost: false, activeLinkId: null };
  }

  const linkIds = await getVisibleCoupleLinkIdsForViewer(viewer);
  if (linkIds.length === 0) {
    return { posts: [], canPost: false, activeLinkId: null };
  }

  const posts = (
    await Promise.all(linkIds.map((linkId) => prayerStore().getCouplePrayerPosts(linkId)))
  ).flat();

  posts.sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  const active = await getActiveCoupleLinkForUserId(viewer.id);
  return {
    posts,
    canPost: await canPostCouplePrayer(viewer),
    activeLinkId: active?.id ?? null,
  };
}

export async function createCouplePrayerPostForUser(
  viewer: PublicMember,
  input: { content: string; type?: "prayer" | "praise" },
) {
  if (!(await canPostCouplePrayer(viewer))) {
    throw new Error("Link your spouse account and join Shanah Power Couples to post here.");
  }
  const content = input.content.trim();
  if (!content) {
    throw new Error("Write a prayer or praise before posting.");
  }

  const link = await getActiveCoupleLinkForUserId(viewer.id);
  if (!link) {
    throw new Error("No active spouse link found.");
  }

  return prayerStore().createCouplePrayerPost({
    coupleLinkId: link.id,
    authorId: viewer.id,
    authorName: viewer.name,
    content,
    type: input.type ?? "prayer",
  });
}

export async function getCouplePrayerPostsForLink(viewer: PublicMember, linkId: string) {
  const link = await getCoupleLinkById(linkId);
  if (!link) {
    throw new Error("Couple link not found.");
  }
  if (!(await canViewCouplePrayerLink(viewer, link))) {
    throw new Error("You cannot view this prayer wall.");
  }
  return prayerStore().getCouplePrayerPosts(linkId);
}
