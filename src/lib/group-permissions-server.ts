import type { PublicMember } from "@/lib/auth-types";
import { canManageAsAdmin } from "@/lib/admin-access-server";
import { CALENDAR_GROUP_TABS } from "@/lib/church-groups";
import { getGalleryUploadPermissions } from "@/lib/gallery-access-server";
import { isGroupAdmin, isGroupMember } from "@/lib/group-admin-utils";
import { getGroups } from "@/lib/group-server";

export type UnavailabilityCalendarGroup = "choir" | "pastors";

export function unavailabilityGroupToGroupId(group: UnavailabilityCalendarGroup) {
  return CALENDAR_GROUP_TABS[group];
}

export async function getCalendarGroup(group: UnavailabilityCalendarGroup) {
  const groupId = unavailabilityGroupToGroupId(group);
  const groups = await getGroups();
  return groups.find((entry) => entry.id === groupId) ?? null;
}

export async function canViewUnavailabilityForGroup(
  user: PublicMember | null,
  group: UnavailabilityCalendarGroup,
) {
  if (!user) return false;
  if (await canManageAsAdmin(user)) return true;
  const calendarGroup = await getCalendarGroup(group);
  return calendarGroup ? isGroupMember(calendarGroup, user.id) : false;
}

export async function canReviewUnavailabilityForGroup(
  user: PublicMember | null,
  group: UnavailabilityCalendarGroup,
) {
  if (!user) return false;
  if (await canManageAsAdmin(user)) return true;
  const calendarGroup = await getCalendarGroup(group);
  return calendarGroup ? isGroupAdmin(calendarGroup, user.id) : false;
}

export async function canManageGroupEvents(user: PublicMember | null, groupId: string) {
  if (!user) return false;
  if (await canManageAsAdmin(user)) return true;
  const groups = await getGroups();
  const group = groups.find((entry) => entry.id === groupId);
  return group ? isGroupAdmin(group, user.id) : false;
}

export async function canManageChurchEvents(user: PublicMember | null) {
  return canManageAsAdmin(user);
}

export async function canViewStaffReports(user: PublicMember | null) {
  return canManageAsAdmin(user);
}

export async function canPublishMediaClips(user: PublicMember | null) {
  if (!user) return false;
  if (await canManageAsAdmin(user)) return true;
  const { canUploadGallery } = await getGalleryUploadPermissions(user);
  return canUploadGallery;
}
