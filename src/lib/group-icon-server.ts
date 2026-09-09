import { canManageAsAdmin } from "@/lib/admin-access-server";
import { getUserById } from "@/lib/auth-server";
import { isGroupAdmin } from "@/lib/group-admin-utils";
import type { Group } from "@/lib/group-types";
import { getGroupIconApiUrl, isGroupIconRef } from "@/lib/group-icon-utils";
import { useDatabase } from "@/lib/use-database";
import * as groupIconDb from "@/lib/stores/group-icon-db";
import * as groupIconJson from "@/lib/stores/group-icon-json";
import * as groupDb from "@/lib/stores/group-db";
import * as groupJson from "@/lib/stores/group-json";

const iconStore = () => (useDatabase() ? groupIconDb : groupIconJson);
const groupStore = () => (useDatabase() ? groupDb : groupJson);

export { getGroupIconApiUrl, isGroupIconRef } from "@/lib/group-icon-utils";

async function assertCanManageGroupIcon(
  group: Group,
  userId: string,
  actorIsSiteAdmin = false,
) {
  if (actorIsSiteAdmin) return;
  if (!isGroupAdmin(group, userId)) {
    throw new Error("Only group leaders can update the group icon.");
  }
}

async function getGroupRecord(groupId: string) {
  const groups = await groupStore().getGroups();
  return groups.find((entry) => entry.id === groupId) ?? null;
}

export async function saveGroupIcon(
  groupId: string,
  userId: string,
  file: File,
  options?: { actorIsSiteAdmin?: boolean },
) {
  const group = await getGroupRecord(groupId);
  if (!group) throw new Error("Group not found.");

  const user = await getUserById(userId);
  const actorIsSiteAdmin = options?.actorIsSiteAdmin ?? Boolean(user && (await canManageAsAdmin(user)));
  await assertCanManageGroupIcon(group, userId, actorIsSiteAdmin);

  const iconUrl = await iconStore().saveGroupIconFile(groupId, file);
  return groupStore().updateGroupIconUrl(groupId, iconUrl);
}

export async function removeGroupIcon(
  groupId: string,
  userId: string,
  options?: { actorIsSiteAdmin?: boolean },
) {
  const group = await getGroupRecord(groupId);
  if (!group) throw new Error("Group not found.");

  const user = await getUserById(userId);
  const actorIsSiteAdmin = options?.actorIsSiteAdmin ?? Boolean(user && (await canManageAsAdmin(user)));
  await assertCanManageGroupIcon(group, userId, actorIsSiteAdmin);

  await iconStore().deleteGroupIconFile(groupId);
  return groupStore().updateGroupIconUrl(groupId, null);
}

export async function readGroupIcon(groupId: string) {
  return iconStore().readGroupIconFile(groupId);
}
