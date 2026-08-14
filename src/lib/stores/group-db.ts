import { getUserByEmail, getUserById, getUsers } from "@/lib/auth-server";
import { ADMIN_GROUP_ID, CHURCH_MINISTRY_GROUPS } from "@/lib/church-groups";
import { prisma } from "@/lib/db";
import {
  assertAnotherAdminRemains,
  assertGroupAdmin,
  isGroupAdmin,
  isGroupMember,
} from "@/lib/group-admin-utils";
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
  requiresApproval: boolean;
  isSystem: boolean;
  signupVisible: boolean;
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
    requiresApproval: record.requiresApproval,
    isSystem: record.isSystem,
    signupVisible: record.signupVisible,
    meetingSchedule: record.meetingSchedule ?? undefined,
    meetingLink: record.meetingLink ?? undefined,
  };
}

async function ensureChurchGroups() {
  const users = await getUsers();
  const leaderIds = users.filter((user) => user.role === "leader").map((user) => user.id);
  const bootstrapEmail = process.env.ADMIN_BOOTSTRAP_EMAIL?.trim().toLowerCase();
  const bootstrapUser = bootstrapEmail
    ? users.find((user) => user.email.toLowerCase() === bootstrapEmail)
    : undefined;
  const bootstrapIds = [
    ...leaderIds,
    ...(bootstrapUser ? [bootstrapUser.id] : []),
  ];

  for (const seed of CHURCH_MINISTRY_GROUPS) {
    const existing = await prisma.group.findUnique({ where: { id: seed.id } });
    const now = new Date();

    if (!existing) {
      const adminIds =
        seed.id === ADMIN_GROUP_ID ? [...new Set(bootstrapIds)] : [];
      const memberIds =
        seed.id === ADMIN_GROUP_ID ? [...new Set(bootstrapIds)] : [];

      await prisma.group.create({
        data: {
          id: seed.id,
          name: seed.name,
          description: seed.description,
          category: seed.category,
          campusId: null,
          createdBy: bootstrapIds[0] ?? "system",
          creatorName: "Shanah City",
          visibility: seed.visibility,
          memberIds,
          adminIds,
          requiresApproval: seed.requiresApproval,
          isSystem: seed.isSystem,
          signupVisible: seed.signupVisible,
          createdAt: now,
          updatedAt: now,
        },
      });
      continue;
    }

    if (seed.id === ADMIN_GROUP_ID && bootstrapIds.length > 0) {
      const memberIds = parseStringArray(existing.memberIds);
      const adminIds = parseStringArray(existing.adminIds);
      const nextMembers = [...new Set([...memberIds, ...bootstrapIds])];
      const nextAdmins = [...new Set([...adminIds, ...bootstrapIds])];

      await prisma.group.update({
        where: { id: seed.id },
        data: {
          name: seed.name,
          description: seed.description,
          requiresApproval: seed.requiresApproval,
          isSystem: seed.isSystem,
          signupVisible: seed.signupVisible,
          memberIds: nextMembers,
          adminIds: nextAdmins,
          updatedAt: now,
        },
      });
    }
  }
}

export async function getSignupGroupOptions() {
  await ensureChurchGroups();
  const records = await prisma.group.findMany({
    where: { signupVisible: true },
    orderBy: { name: "asc" },
  });

  return records.map((record) => ({
    id: record.id,
    name: record.name,
    description: record.description,
    category: record.category as GroupCategory,
    requiresApproval: record.requiresApproval,
  }));
}

function canViewGroup(group: Group, userId?: string) {
  if (group.visibility === "public") return true;
  if (!userId) return false;
  return isGroupMember(group, userId) || isGroupAdmin(group, userId);
}

function toSummary(group: Group, userId?: string): GroupSummary {  return {
    ...group,
    memberCount: group.memberIds.length,
    isMember: userId ? isGroupMember(group, userId) : false,
    isAdmin: userId ? isGroupAdmin(group, userId) : false,
  };
}

async function getMemberPreviews(group: Group): Promise<GroupMemberPreview[]> {
  const users = await getUsers();
  const byId = new Map(users.map((user) => [user.id, user]));

  return group.memberIds
    .map((id) => {
      const user = byId.get(id);
      if (!user) return null;
      return {
        id: user.id,
        name: user.name,
        campusId: user.campusId,
        isAdmin: group.adminIds.includes(user.id),
        isCreator: user.id === group.createdBy,
      };
    })
    .filter((member): member is GroupMemberPreview => member !== null);
}
export async function getGroups() {
  await ensureChurchGroups();
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
  const members = await getMemberPreviews(group);
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

  if (group.requiresApproval) {
    throw new Error(
      `Joining "${group.name}" requires approval. Request access from your profile or sign-up.`,
    );
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

export async function leaveGroup(_groupId: string, _userId: string) {
  throw new Error("Members cannot leave a group on their own. Ask your group leader to remove you.");
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
  if (group.isSystem) {
    throw new Error("System ministry groups cannot be deleted.");
  }

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
  assertGroupAdmin(group, adminId);

  if (!isGroupMember(group, memberId)) {
    throw new Error("That member is not in this group.");
  }

  if (isGroupAdmin(group, memberId)) {
    assertAnotherAdminRemains(group, memberId);
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

export async function addGroupMember(groupId: string, adminId: string, email: string) {
  const record = await prisma.group.findUnique({ where: { id: groupId } });
  if (!record) {
    throw new Error("Group not found.");
  }

  const group = mapGroup(record);
  assertGroupAdmin(group, adminId);

  const normalizedEmail = email.trim().toLowerCase();
  if (!normalizedEmail) {
    throw new Error("Enter the member email to add.");
  }

  const member = await getUserByEmail(normalizedEmail);
  if (!member) {
    throw new Error("No member account found for that email.");
  }

  if (isGroupMember(group, member.id)) {
    throw new Error(`${member.name} is already in this group.`);
  }

  const updated = await prisma.group.update({
    where: { id: groupId },
    data: {
      memberIds: [...group.memberIds, member.id],
      updatedAt: new Date(),
    },
  });

  return {
    group: toSummary(mapGroup(updated), adminId),
    addedName: member.name,
  };
}

export async function promoteGroupAdmin(groupId: string, adminId: string, memberId: string) {
  const record = await prisma.group.findUnique({ where: { id: groupId } });
  if (!record) {
    throw new Error("Group not found.");
  }

  const group = mapGroup(record);
  assertGroupAdmin(group, adminId);

  if (!isGroupMember(group, memberId)) {
    throw new Error("That person must be a group member before becoming a leader.");
  }

  if (isGroupAdmin(group, memberId)) {
    const member = await getUserById(memberId);
    return {
      group: toSummary(group, adminId),
      promotedName: member?.name ?? "Member",
    };
  }

  const updated = await prisma.group.update({
    where: { id: groupId },
    data: {
      adminIds: [...group.adminIds, memberId],
      updatedAt: new Date(),
    },
  });

  const member = await getUserById(memberId);
  return {
    group: toSummary(mapGroup(updated), adminId),
    promotedName: member?.name ?? "Member",
  };
}

export async function demoteGroupAdmin(groupId: string, adminId: string, memberId: string) {
  const record = await prisma.group.findUnique({ where: { id: groupId } });
  if (!record) {
    throw new Error("Group not found.");
  }

  const group = mapGroup(record);
  assertGroupAdmin(group, adminId);

  if (!isGroupAdmin(group, memberId)) {
    throw new Error("That member is not a group leader.");
  }

  assertAnotherAdminRemains(group, memberId);

  const updated = await prisma.group.update({
    where: { id: groupId },
    data: {
      adminIds: group.adminIds.filter((id) => id !== memberId),
      updatedAt: new Date(),
    },
  });

  const member = await getUserById(memberId);
  return {
    group: toSummary(mapGroup(updated), adminId),
    demotedName: member?.name ?? "Member",
  };
}