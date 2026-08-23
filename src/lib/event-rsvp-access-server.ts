import type { PublicMember } from "@/lib/auth-types";
import { canManageAsAdmin } from "@/lib/admin-access-server";
import { getMemberGroupIds } from "@/lib/admin-people-server";
import {
  canManageChurchEvents,
  canManageGroupEvents,
} from "@/lib/group-permissions-server";
import { getGroups } from "@/lib/group-server";
import { isGroupMember } from "@/lib/group-admin-utils";
import type { ChurchEvent } from "@/lib/types";
import type { EventRsvpAudience } from "@/lib/event-rsvp-types";

export async function canManageEventRsvpSettings(
  user: PublicMember | null,
  event: Pick<ChurchEvent, "groupId">,
) {
  if (!user) return false;
  if (event.groupId) {
    return canManageGroupEvents(user, event.groupId);
  }
  return canManageChurchEvents(user);
}

export async function userInEventRsvpAudience(
  user: PublicMember | null,
  event: Pick<
    ChurchEvent,
    "rsvpEnabled" | "rsvpAudience" | "rsvpGroupId" | "groupId"
  >,
) {
  if (!user || !event.rsvpEnabled) return false;
  if (await canManageAsAdmin(user)) return true;

  const audience: EventRsvpAudience =
    event.rsvpAudience ?? (event.groupId ? "group" : "church");

  if (audience === "church") {
    return true;
  }

  const groupId = event.rsvpGroupId ?? event.groupId;
  if (!groupId) return false;

  const groupIds = await getMemberGroupIds(user.id);
  return groupIds.includes(groupId);
}

export async function canViewEventRsvpRoster(
  user: PublicMember | null,
  event: Pick<ChurchEvent, "groupId">,
) {
  return canManageEventRsvpSettings(user, event);
}

export function isEventRsvpClosed(event: Pick<ChurchEvent, "rsvpDeadline">) {
  if (!event.rsvpDeadline) return false;
  return new Date(event.rsvpDeadline).getTime() <= Date.now();
}

export async function resolveRsvpGroupName(groupId: string | null | undefined) {
  if (!groupId) return null;
  const groups = await getGroups();
  return groups.find((group) => group.id === groupId)?.name ?? null;
}

export async function assertRsvpGroupMembership(groupId: string, userId: string) {
  const groups = await getGroups();
  const group = groups.find((entry) => entry.id === groupId);
  return group ? isGroupMember(group, userId) : false;
}
