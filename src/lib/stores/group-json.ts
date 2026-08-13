import { promises as fs } from "fs";
import path from "path";
import { getUserById, getUsers } from "@/lib/auth-server";
import type {
  Group,
  GroupCategory,
  GroupDetail,
  GroupMemberPreview,
  GroupSummary,
  GroupVisibility,
} from "@/lib/group-types";

const GROUPS_FILE = path.join(process.cwd(), "data", "groups.json");

async function readJson<T>(file: string, fallback: T): Promise<T> {
  try {
    const raw = await fs.readFile(file, "utf-8");
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

async function writeJson<T>(file: string, data: T) {
  await fs.mkdir(path.dirname(file), { recursive: true });
  await fs.writeFile(file, JSON.stringify(data, null, 2));
}

export async function getGroups() {
  return readJson<Group[]>(GROUPS_FILE, []);
}

async function saveGroups(groups: Group[]) {
  await writeJson(GROUPS_FILE, groups);
}

function isGroupAdmin(group: Group, userId: string) {
  return group.adminIds.includes(userId);
}

function isGroupMember(group: Group, userId: string) {
  return group.memberIds.includes(userId);
}

function canViewGroup(group: Group, userId?: string) {
  if (group.visibility === "public") return true;
  if (!userId) return false;
  return isGroupMember(group, userId) || isGroupAdmin(group, userId);
}

function toSummary(group: Group, userId?: string): GroupSummary {
  return {
    ...group,
    memberCount: group.memberIds.length,
    isMember: userId ? isGroupMember(group, userId) : false,
    isAdmin: userId ? isGroupAdmin(group, userId) : false,
  };
}

async function getMemberPreviews(memberIds: string[]): Promise<GroupMemberPreview[]> {
  const users = await getUsers();
  const byId = new Map(users.map((user) => [user.id, user]));

  return memberIds
    .map((id) => {
      const user = byId.get(id);
      if (!user) return null;
      return {
        id: user.id,
        name: user.name,
        campusId: user.campusId,
      };
    })
    .filter((member): member is GroupMemberPreview => member !== null);
}

export async function listGroupsForUser(userId?: string, options?: { mine?: boolean }) {
  const groups = await getGroups();

  const visible = groups.filter((group) => {
    if (options?.mine && userId) {
      return isGroupMember(group, userId);
    }
    return canViewGroup(group, userId);
  });

  return visible
    .map((group) => toSummary(group, userId))
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export async function getGroupDetail(groupId: string, userId?: string) {
  const groups = await getGroups();
  const group = groups.find((entry) => entry.id === groupId);
  if (!group) {
    return null;
  }

  if (!canViewGroup(group, userId)) {
    if (group.visibility === "private" && userId) {
      const summary = toSummary(group, userId);
      return {
        ...summary,
        members: [],
      } satisfies GroupDetail;
    }
    return null;
  }

  const summary = toSummary(group, userId);
  const members = await getMemberPreviews(group.memberIds);

  return {
    ...summary,
    members,
  } satisfies GroupDetail;
}

export async function createGroup(input: {
  name: string;
  description: string;
  category: GroupCategory;
  campusId?: string;
  visibility: GroupVisibility;
  meetingSchedule?: string;
  meetingLink?: string;
  creatorId: string;
  creatorName: string;
}) {
  const name = input.name.trim();
  const description = input.description.trim();

  if (name.length < 2) {
    throw new Error("Group name must be at least 2 characters.");
  }
  if (description.length < 8) {
    throw new Error("Add a short description so members know what this group is about.");
  }

  const groups = await getGroups();
  const duplicate = groups.some(
    (group) => group.name.trim().toLowerCase() === name.toLowerCase(),
  );
  if (duplicate) {
    throw new Error("A group with this name already exists.");
  }

  const now = new Date().toISOString();
  const group: Group = {
    id: `group-${Date.now()}`,
    name,
    description,
    category: input.category,
    campusId: input.campusId || undefined,
    createdBy: input.creatorId,
    creatorName: input.creatorName,
    createdAt: now,
    updatedAt: now,
    visibility: input.visibility,
    memberIds: [input.creatorId],
    adminIds: [input.creatorId],
    meetingSchedule: input.meetingSchedule?.trim() || undefined,
    meetingLink: input.meetingLink?.trim() || undefined,
  };

  groups.unshift(group);
  await saveGroups(groups);
  return toSummary(group, input.creatorId);
}

export async function joinGroup(groupId: string, userId: string) {
  const groups = await getGroups();
  const index = groups.findIndex((group) => group.id === groupId);
  if (index === -1) {
    throw new Error("Group not found.");
  }

  const group = groups[index];
  if (group.visibility === "private" && !userId) {
    throw new Error("Sign in to join this private group.");
  }

  if (isGroupMember(group, userId)) {
    return toSummary(group, userId);
  }

  group.memberIds = [...group.memberIds, userId];
  group.updatedAt = new Date().toISOString();
  groups[index] = group;
  await saveGroups(groups);
  return toSummary(group, userId);
}

export async function leaveGroup(groupId: string, userId: string) {
  const groups = await getGroups();
  const index = groups.findIndex((group) => group.id === groupId);
  if (index === -1) {
    throw new Error("Group not found.");
  }

  const group = groups[index];
  if (!isGroupMember(group, userId)) {
    throw new Error("You are not in this group.");
  }

  if (group.createdBy === userId && group.memberIds.length > 1) {
    throw new Error("Transfer leadership or delete the group before leaving.");
  }

  group.memberIds = group.memberIds.filter((id) => id !== userId);
  group.adminIds = group.adminIds.filter((id) => id !== userId);
  group.updatedAt = new Date().toISOString();

  if (group.memberIds.length === 0) {
    groups.splice(index, 1);
    await saveGroups(groups);
    return null;
  }

  groups[index] = group;
  await saveGroups(groups);
  return toSummary(group, userId);
}

export async function updateGroup(
  groupId: string,
  userId: string,
  updates: Partial<
    Pick<
      Group,
      | "name"
      | "description"
      | "category"
      | "campusId"
      | "visibility"
      | "meetingSchedule"
      | "meetingLink"
    >
  >,
) {
  const groups = await getGroups();
  const index = groups.findIndex((group) => group.id === groupId);
  if (index === -1) {
    throw new Error("Group not found.");
  }

  const group = groups[index];
  if (!isGroupAdmin(group, userId)) {
    throw new Error("Only group leaders can update this group.");
  }

  if (updates.name !== undefined) {
    const name = updates.name.trim();
    if (name.length < 2) {
      throw new Error("Group name must be at least 2 characters.");
    }
    group.name = name;
  }

  if (updates.description !== undefined) {
    const description = updates.description.trim();
    if (description.length < 8) {
      throw new Error("Description must be at least 8 characters.");
    }
    group.description = description;
  }

  if (updates.category !== undefined) {
    group.category = updates.category;
  }

  if (updates.campusId !== undefined) {
    group.campusId = updates.campusId || undefined;
  }

  if (updates.visibility !== undefined) {
    group.visibility = updates.visibility;
  }

  if (updates.meetingSchedule !== undefined) {
    group.meetingSchedule = updates.meetingSchedule.trim() || undefined;
  }

  if (updates.meetingLink !== undefined) {
    group.meetingLink = updates.meetingLink.trim() || undefined;
  }

  group.updatedAt = new Date().toISOString();
  groups[index] = group;
  await saveGroups(groups);
  return toSummary(group, userId);
}

export async function deleteGroup(groupId: string, userId: string) {
  const groups = await getGroups();
  const index = groups.findIndex((group) => group.id === groupId);
  if (index === -1) {
    throw new Error("Group not found.");
  }

  const group = groups[index];
  if (!isGroupAdmin(group, userId)) {
    throw new Error("Only group leaders can delete this group.");
  }

  groups.splice(index, 1);
  await saveGroups(groups);
  return true;
}

export async function removeGroupMember(groupId: string, adminId: string, memberId: string) {
  const groups = await getGroups();
  const index = groups.findIndex((group) => group.id === groupId);
  if (index === -1) {
    throw new Error("Group not found.");
  }

  const group = groups[index];
  if (!isGroupAdmin(group, adminId)) {
    throw new Error("Only group leaders can remove members.");
  }

  if (memberId === group.createdBy) {
    throw new Error("The group creator cannot be removed.");
  }

  if (!isGroupMember(group, memberId)) {
    throw new Error("That member is not in this group.");
  }

  group.memberIds = group.memberIds.filter((id) => id !== memberId);
  group.adminIds = group.adminIds.filter((id) => id !== memberId);
  group.updatedAt = new Date().toISOString();
  groups[index] = group;
  await saveGroups(groups);

  const member = await getUserById(memberId);
  return {
    group: toSummary(group, adminId),
    removedName: member?.name ?? "Member",
  };
}
