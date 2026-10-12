import type { PublicMember } from "@/lib/auth-types";
import { canManageAsAdmin } from "@/lib/admin-access-server";
import { getGroupDetail } from "@/lib/group-server";
import { isMemberTrainingRequired } from "@/lib/ministry-readiness-server";
import { canManageGroupEvents } from "@/lib/group-permissions-server";
import { SHANAH_WORSHIP_GROUP_ID } from "@/lib/choir-group-constants";
import type {
  ChoirAnnouncementFeedItem,
  ChoirAnnouncementsPagePayload,
  ChoirMinistryAnnouncement,
} from "@/lib/choir-announcements-types";
import {
  createChoirAnnouncementJson,
  deleteChoirAnnouncementJson,
  listChoirAnnouncementsJson,
} from "@/lib/stores/choir-announcements-json";

function excerpt(text: string, max = 160) {
  const trimmed = text.trim();
  if (trimmed.length <= max) return trimmed;
  return `${trimmed.slice(0, max - 1)}…`;
}

function announcementsPageHref(groupId: string, announcementId?: string) {
  const base = `/groups/${encodeURIComponent(groupId)}/announcements`;
  if (!announcementId) return base;
  return `${base}#announcement-${encodeURIComponent(announcementId)}`;
}

function sampleAnnouncements(groupId: string): ChoirMinistryAnnouncement[] {
  const createdAt = new Date(Date.now() - 2 * 86_400_000).toISOString();
  return [
    {
      id: "sample-choir-rehearsal",
      groupId,
      title: "Choir rehearsal this Saturday",
      body:
        "Please join us Saturday at 10:00 AM in the sanctuary for choir rehearsal. Review this week's setlist and come warmed up — we'll focus on vocals for Sunday service.",
      authorId: "sample",
      authorName: "Worship Team",
      createdAt,
    },
  ];
}

function toFeedItem(groupId: string, row: ChoirMinistryAnnouncement, isSample = false): ChoirAnnouncementFeedItem {
  const body = row.body.trim();
  const title = row.title.trim() || "Team update";
  return {
    id: row.id,
    title,
    authorName: row.authorName,
    excerpt: excerpt(body || title),
    body: body || title,
    createdAt: row.createdAt,
    detailHref: announcementsPageHref(groupId, row.id),
    isSample,
  };
}

export async function assertChoirAnnouncementsAccess(user: PublicMember, groupId: string) {
  if (groupId !== SHANAH_WORSHIP_GROUP_ID) {
    return null;
  }
  const group = await getGroupDetail(groupId, user.id);
  const isSiteAdmin = await canManageAsAdmin(user);
  if (!group?.isMember && !isSiteAdmin) {
    return null;
  }
  if (group?.isMember && (await isMemberTrainingRequired(user.id, group))) {
    return null;
  }
  return group;
}

export async function canManageChoirAnnouncements(user: PublicMember, groupId: string) {
  if (await canManageAsAdmin(user)) return true;
  return canManageGroupEvents(user, groupId);
}

export async function listChoirAnnouncementFeed(
  groupId: string,
  limit?: number,
): Promise<ChoirAnnouncementFeedItem[]> {
  const stored = await listChoirAnnouncementsJson(groupId);
  const source = stored.length > 0 ? stored : sampleAnnouncements(groupId);
  const isSample = stored.length === 0;
  const items = source.map((row, index) => toFeedItem(groupId, row, isSample && index === 0));
  return limit ? items.slice(0, limit) : items;
}

export async function buildChoirAnnouncementsPagePayload(
  user: PublicMember,
  groupId: string,
): Promise<ChoirAnnouncementsPagePayload | null> {
  const group = await assertChoirAnnouncementsAccess(user, groupId);
  if (!group) return null;

  const canManage = await canManageChoirAnnouncements(user, groupId);
  const announcements = await listChoirAnnouncementFeed(groupId);

  return {
    announcements,
    canManage,
    groupName: group.name?.trim() || "Shanah Worship",
  };
}

export async function createChoirAnnouncement(
  user: PublicMember,
  groupId: string,
  input: { title: string; body: string },
) {
  if (!(await canManageChoirAnnouncements(user, groupId))) {
    return { error: "Leader access required." as const };
  }

  const title = input.title.trim();
  const body = input.body.trim();
  if (!title || !body) {
    return { error: "Title and message are required." as const };
  }

  const record = await createChoirAnnouncementJson({
    groupId,
    title,
    body,
    authorId: user.id,
    authorName: user.name,
  });

  return { announcement: toFeedItem(groupId, record) };
}

export async function deleteChoirAnnouncement(user: PublicMember, groupId: string, id: string) {
  if (!(await canManageChoirAnnouncements(user, groupId))) {
    return { error: "Leader access required." as const };
  }
  if (id.startsWith("sample-")) {
    return { error: "Cannot delete sample content." as const };
  }
  const removed = await deleteChoirAnnouncementJson(groupId, id);
  if (!removed) {
    return { error: "Announcement not found." as const };
  }
  return { ok: true as const };
}
