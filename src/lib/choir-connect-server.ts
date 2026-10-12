import type { PublicMember } from "@/lib/auth-types";
import { canManageAsAdmin } from "@/lib/admin-access-server";
import { SHANAH_WORSHIP_GROUP_ID, CHOIR_HERO_IMAGE_PATH } from "@/lib/choir-group-constants";
import {
  assertChoirAnnouncementsAccess,
  canManageChoirAnnouncements,
  listStoredChoirAnnouncementFeed,
} from "@/lib/choir-announcements-server";
import type { ChoirConnectHomePayload, ChoirConnectPinnedItem } from "@/lib/choir-connect-types";
import { choirConnectHref } from "@/lib/choir-connect-links";
import { getGroupDetail } from "@/lib/group-server";
import { canManageGroupEvents } from "@/lib/group-permissions-server";
import { getGroupChatInboxForUser, listGroupChatMessages } from "@/lib/group-chat-server";
import { isMemberTrainingRequired } from "@/lib/ministry-readiness-server";
import { getPollsForViewer } from "@/lib/poll-server";
import type { GroupChatMessage } from "@/lib/group-types";

function previewChatMessage(message: GroupChatMessage) {
  if (message.deletedAt) return "Message unsent";
  if (message.attachmentUrl && !message.content.trim()) return "Photo";
  return message.content.slice(0, 120);
}

function announcementsDetailHref(groupId: string, id: string) {
  return `${choirConnectHref(groupId, "announcements")}#announcement-${encodeURIComponent(id)}`;
}

function buildPinnedItems(groupId: string, announcements: { id: string; title: string; authorName: string; createdAt: string; pinned: boolean; imagePath?: string }[]): ChoirConnectPinnedItem[] {
  const pinnedAnnouncements = announcements
    .filter((row) => row.pinned)
    .slice(0, 6)
    .map((row) => ({
      id: `announcement-${row.id}`,
      title: row.title,
      subtitle: `Pinned by ${row.authorName} · ${new Date(row.createdAt).toLocaleDateString()}`,
      href: announcementsDetailHref(groupId, row.id),
      imagePath: row.imagePath ?? CHOIR_HERO_IMAGE_PATH,
    }));

  const setlistPin: ChoirConnectPinnedItem = {
    id: "setlists",
    title: "Sunday setlists & prep",
    subtitle: "Open the worship setlist library",
    href: `/groups/${encodeURIComponent(groupId)}/setlists`,
    imagePath: CHOIR_HERO_IMAGE_PATH,
  };

  return [...pinnedAnnouncements, setlistPin].slice(0, 8);
}

async function buildChatPreview(user: PublicMember, groupId: string, openChatHref: string) {
  const group = await getGroupDetail(groupId, user.id);
  if (!group?.isMember) return null;

  const inbox = await getGroupChatInboxForUser(user.id);
  const entry = inbox.find((row) => row.groupId === groupId);
  if (entry) {
    const colon = entry.lastMessage.indexOf(": ");
    const senderName = colon > 0 ? entry.lastMessage.slice(0, colon) : "Team";
    const body = colon > 0 ? entry.lastMessage.slice(colon + 2) : entry.lastMessage;
    return {
      senderName,
      body,
      createdAt: entry.lastMessageAt,
      unreadCount: entry.unreadCount,
      openChatHref,
    };
  }

  const memberIds = group.members.map((member) => member.id);
  const messages = await listGroupChatMessages(groupId, {
    viewerId: user.id,
    memberIds,
  });
  const latest = messages[messages.length - 1] as GroupChatMessage | undefined;
  if (!latest) return null;

  return {
    senderName: latest.senderId === user.id ? "You" : latest.senderName,
    body: previewChatMessage(latest),
    createdAt: latest.createdAt,
    unreadCount: 0,
    openChatHref,
  };
}

export async function assertChoirConnectAccess(user: PublicMember, groupId: string) {
  if (groupId !== SHANAH_WORSHIP_GROUP_ID) return null;
  const group = await assertChoirAnnouncementsAccess(user, groupId);
  return group;
}

export async function canManageChoirConnect(user: PublicMember, groupId: string) {
  if (await canManageChoirAnnouncements(user, groupId)) return true;
  if (await canManageAsAdmin(user)) return true;
  return canManageGroupEvents(user, groupId);
}

export async function buildChoirConnectHomePayload(
  user: PublicMember,
  groupId: string,
): Promise<ChoirConnectHomePayload | null> {
  const group = await assertChoirConnectAccess(user, groupId);
  if (!group) return null;

  const openChatHref = choirConnectHref(groupId, "chat");
  const announcements = await listStoredChoirAnnouncementFeed(groupId, 3);
  const allStored = await listStoredChoirAnnouncementFeed(groupId);
  const pinned = buildPinnedItems(groupId, allStored);

  const pollsAll = await getPollsForViewer(user, groupId);
  const polls = pollsAll.filter((poll) => !poll.isClosed).slice(0, 2);

  const chatPreview = await buildChatPreview(user, groupId, openChatHref);
  const canManage = await canManageChoirConnect(user, groupId);

  const detail = await getGroupDetail(groupId, user.id);
  if (!detail) return null;

  return {
    groupId,
    groupName: detail.name?.trim() || "Shanah Worship",
    groupChatHref: `/groups/${encodeURIComponent(groupId)}?chat=1`,
    connectHref: choirConnectHref(groupId, "home"),
    announcementsHref: choirConnectHref(groupId, "announcements"),
    pollsHref: choirConnectHref(groupId, "polls"),
    pinnedHref: choirConnectHref(groupId, "announcements"),
    chatPreview,
    announcements,
    pinned,
    polls,
    canManageCommunication: canManage,
    manageAnnouncementsHref: `/groups/${encodeURIComponent(groupId)}/announcements`,
    chatContext: {
      groupId: detail.id,
      groupName: detail.name,
      groupCategory: detail.category,
      groupIconUrl: detail.iconUrl,
      groupUpdatedAt: detail.updatedAt,
      userId: user.id,
      memberCount: detail.members.length,
      participants: detail.members.map((member) => ({
        id: member.id,
        name: member.name,
        isLeader: member.isAdmin || member.isAssistantLeader,
        subtitle: member.isAdmin
          ? "Leader"
          : member.isAssistantLeader
            ? "Assistant leader"
            : undefined,
      })),
    },
  };
}

export async function assertChoirConnectPageAccess(user: PublicMember, groupId: string) {
  if (groupId !== SHANAH_WORSHIP_GROUP_ID) return null;
  const group = await getGroupDetail(groupId, user.id);
  if (!group?.isMember) return null;
  if (await isMemberTrainingRequired(user.id, group)) return null;
  return group;
}
