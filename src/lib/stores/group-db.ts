import { getUserById, getUsers } from "@/lib/auth-server";
import { prisma } from "@/lib/db";
import type {
  Group,
  GroupCategory,
  GroupDetail,
  GroupMemberPreview,
  GroupSummary,
  GroupVisibility,
} from "@/lib/group-types";

function parseStringArray(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.filter((item): item is string => typeof item === "string");
  }
  return [];
}

function mapGroup(record: {
  id: string;
  name: string;
  description: string;
  category: string;
  campusId: string | null;
  createdBy: string;
  creatorName: string;
  visibility: string;
  meetingSchedule: string | null;
  meetingLink: string | null;
  memberIds: unknown;
  adminIds: unknown;
  createdAt: Date;
  updatedAt: Date;
}): Group {
  return {
    id: record.id,
    name: record.name,
    description: record.description,
    category: record.category as GroupCategory,
    campusId: record.campusId ?? undefined,
    createdBy: record.createdBy,
    creatorName: record.creatorName,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
    visibility: record.visibility as GroupVisibility,
    memberIds: parseStringArray(record.memberIds),
    adminIds: parseStringArray(record.adminIds),
    meetingSchedule: record.meetingSchedule ?? undefined,
    meetingLink: record.meetingLink ?? undefined,
  };
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

export async function getGroups() {
  const records = await prisma.group.findMany();
  return records.map(mapGroup);
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
  const record = await prisma.group.findUnique({ where: { id: groupId } });
  if (!record) {
    return null;
  }

  const group = mapGroup(record);

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

  const now = new Date();
  const record = await prisma.group.create({
    data: {
      id: `group-${Date.now()}`,
      name,
      description,
      category: input.category,
      campusId: input.campusId || null,
      createdBy: input.creatorId,
      creatorName: input.creatorName,
      createdAt: now,
      updatedAt: now,
      visibility: input.visibility,
      memberIds: [input.creatorId],
      adminIds: [input.creatorId],
      meetingSchedule: input.meetingSchedule?.trim() || null,
      meetingLink: input.meetingLink?.trim() || null,
    },
  });

  return toSummary(mapGroup(record), input.creatorId);
}

export async function joinGroup(groupId: string, userId: string) {
  const record = await prisma.group.findUnique({ where: { id: groupId } });
  if (!record) {
    throw new Error("Group not found.");
  }

  const group = mapGroup(record);
  if (group.visibility === "private" && !userId) {
    throw new Error("Sign in to join this private group.");
  }

  if (isGroupMember(group, userId)) {
    return toSummary(group, userId);
  }

  const memberIds = [...group.memberIds, userId];
  const updated = await prisma.group.update({
    where: { id: groupId },
    data: {
      memberIds,
      updatedAt: new Date(),
    },
  });

  return toSummary(mapGroup(updated), userId);
}

export async function leaveGroup(groupId: string, userId: string) {
  const record = await prisma.group.findUnique({ where: { id: groupId } });
  if (!record) {
    throw new Error("Group not found.");
  }

  const group = mapGroup(record);
  if (!isGroupMember(group, userId)) {
    throw new Error("You are not in this group.");
  }

  if (group.createdBy === userId && group.memberIds.length > 1) {
    throw new Error("Transfer leadership or delete the group before leaving.");
  }

  const memberIds = group.memberIds.filter((id) => id !== userId);
  const adminIds = group.adminIds.filter((id) => id !== userId);

  if (memberIds.length === 0) {
    await prisma.group.delete({ where: { id: groupId } });
    return null;
  }

  const updated = await prisma.group.update({
    where: { id: groupId },
    data: {
      memberIds,
      adminIds,
      updatedAt: new Date(),
    },
  });

  return toSummary(mapGroup(updated), userId);
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
  const record = await prisma.group.findUnique({ where: { id: groupId } });
  if (!record) {
    throw new Error("Group not found.");
  }

  const group = mapGroup(record);
  if (!isGroupAdmin(group, userId)) {
    throw new Error("Only group leaders can update this group.");
  }

  const data: {
    name?: string;
    description?: string;
    category?: string;
    campusId?: string | null;
    visibility?: string;
    meetingSchedule?: string | null;
    meetingLink?: string | null;
    updatedAt: Date;
  } = { updatedAt: new Date() };

  if (updates.name !== undefined) {
    const name = updates.name.trim();
    if (name.length < 2) {
      throw new Error("Group name must be at least 2 characters.");
    }
    data.name = name;
  }

  if (updates.description !== undefined) {
    const description = updates.description.trim();
    if (description.length < 8) {
      throw new Error("Description must be at least 8 characters.");
    }
    data.description = description;
  }

  if (updates.category !== undefined) {
    data.category = updates.category;
  }

  if (updates.campusId !== undefined) {
    data.campusId = updates.campusId || null;
  }

  if (updates.visibility !== undefined) {
    data.visibility = updates.visibility;
  }

  if (updates.meetingSchedule !== undefined) {
    data.meetingSchedule = updates.meetingSchedule.trim() || null;
  }

  if (updates.meetingLink !== undefined) {
    data.meetingLink = updates.meetingLink.trim() || null;
  }

  const updated = await prisma.group.update({
    where: { id: groupId },
    data,
  });

  return toSummary(mapGroup(updated), userId);
}

export async function deleteGroup(groupId: string, userId: string) {
  const record = await prisma.group.findUnique({ where: { id: groupId } });
  if (!record) {
    throw new Error("Group not found.");
  }

  const group = mapGroup(record);
  if (!isGroupAdmin(group, userId)) {
    throw new Error("Only group leaders can delete this group.");
  }

  await prisma.group.delete({ where: { id: groupId } });
  return true;
}

export async function removeGroupMember(groupId: string, adminId: string, memberId: string) {
  const record = await prisma.group.findUnique({ where: { id: groupId } });
  if (!record) {
    throw new Error("Group not found.");
  }

  const group = mapGroup(record);
  if (!isGroupAdmin(group, adminId)) {
    throw new Error("Only group leaders can remove members.");
  }

  if (memberId === group.createdBy) {
    throw new Error("The group creator cannot be removed.");
  }

  if (!isGroupMember(group, memberId)) {
    throw new Error("That member is not in this group.");
  }

  const memberIds = group.memberIds.filter((id) => id !== memberId);
  const adminIds = group.adminIds.filter((id) => id !== memberId);

  const updated = await prisma.group.update({
    where: { id: groupId },
    data: {
      memberIds,
      adminIds,
      updatedAt: new Date(),
    },
  });

  const member = await getUserById(memberId);
  return {
    group: toSummary(mapGroup(updated), adminId),
    removedName: member?.name ?? "Member",
  };
}
