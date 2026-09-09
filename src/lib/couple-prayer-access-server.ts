import type { PublicMember } from "@/lib/auth-types";
import { canManageAsAdmin } from "@/lib/admin-access-server";
import { getMemberGroupIds } from "@/lib/admin-people-server";
import { SHANAH_POWER_COUPLES_GROUP_ID } from "@/lib/church-groups";
import { getActiveCoupleLinkForUserId } from "@/lib/couple-link-server";
import { partnerIdFromLink } from "@/lib/couple-link-utils";
import { isGroupLeaderOrAssistant, isGroupMember } from "@/lib/group-admin-utils";
import { getGroups } from "@/lib/group-server";

export async function isPowerCouplesMember(userId: string) {
  const groupIds = await getMemberGroupIds(userId);
  return groupIds.includes(SHANAH_POWER_COUPLES_GROUP_ID);
}

export async function canViewCouplePrayerAsLeader(user: PublicMember | null) {
  if (!user) return false;
  if (await canManageAsAdmin(user)) return true;
  const groups = await getGroups();
  const group = groups.find((entry) => entry.id === SHANAH_POWER_COUPLES_GROUP_ID);
  return group ? isGroupLeaderOrAssistant(group, user.id) : false;
}

export async function canViewCouplePrayerLink(
  user: PublicMember | null,
  link: { userAId: string; userBId: string },
) {
  if (!user) return false;
  if (link.userAId === user.id || link.userBId === user.id) return true;
  return canViewCouplePrayerAsLeader(user);
}

export async function canPostCouplePrayer(user: PublicMember) {
  const link = await getActiveCoupleLinkForUserId(user.id);
  if (!link) return false;
  return isPowerCouplesMember(user.id);
}

export async function getVisibleCoupleLinkIdsForViewer(user: PublicMember | null) {
  if (!user) return [];

  const asLeader = await canViewCouplePrayerAsLeader(user);
  if (asLeader) {
    const groups = await getGroups();
    const group = groups.find((entry) => entry.id === SHANAH_POWER_COUPLES_GROUP_ID);
    if (!group) return [];
    const memberIds = group.memberIds;
    const linkIds = new Set<string>();
    for (const memberId of memberIds) {
      const link = await getActiveCoupleLinkForUserId(memberId);
      if (link) linkIds.add(link.id);
    }
    return [...linkIds];
  }

  const own = await getActiveCoupleLinkForUserId(user.id);
  return own ? [own.id] : [];
}

export async function userInCoupleLink(
  userId: string,
  link: { userAId: string; userBId: string },
) {
  return link.userAId === userId || link.userBId === userId;
}

export async function assertGroupResourceAccess(
  user: PublicMember | null,
  groupId: string,
  mode: "read" | "write",
) {
  if (!user) {
    throw new Error("Sign in required.");
  }
  const groups = await getGroups();
  const group = groups.find((entry) => entry.id === groupId);
  if (!group) {
    throw new Error("Group not found.");
  }
  if (mode === "read") {
    if (!isGroupMember(group, user.id) && !(await canManageAsAdmin(user))) {
      throw new Error("You must be a group member to view resources.");
    }
    return group;
  }
  if (!(await canManageAsAdmin(user)) && !isGroupLeaderOrAssistant(group, user.id)) {
    throw new Error("Only group leaders can manage resources.");
  }
  return group;
}

export function couplePartnerName(link: { userAId: string; userBId: string }, userId: string) {
  return partnerIdFromLink(link, userId);
}
