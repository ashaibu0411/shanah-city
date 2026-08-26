import { promises as fs } from "fs";
import path from "path";
import { getUserByEmail, getUserById, getUsers } from "@/lib/auth-server";
import { isAdminGroupMember } from "@/lib/admin-access-server";
import { ADMIN_GROUP_ID, CHURCH_MINISTRY_GROUPS } from "@/lib/church-groups";
import {
  assertAnotherAdminRemains,
  assertGroupAdmin,
  getAssistantAdminIds,
  isGroupAdmin,
  isGroupAssistantLeader,
  isGroupMember,
} from "@/lib/group-admin-utils";
import {
  assertCanManageGroupLeadership,
  assertCanManageGroupMembers,
  assertCanRemoveGroupMember,
} from "@/lib/group-leadership-access";
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
  await ensureChurchGroups();
  return readJson<Group[]>(GROUPS_FILE, []);
}

async function ensureChurchGroups() {
  const groups = await readJson<Group[]>(GROUPS_FILE, []);
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
  const now = new Date().toISOString();
  let changed = false;

  for (const seed of CHURCH_MINISTRY_GROUPS) {
    const index = groups.findIndex((group) => group.id === seed.id);
    if (index === -1) {
      const adminIds = seed.id === ADMIN_GROUP_ID ? [...new Set(bootstrapIds)] : [];
      groups.push({
        id: seed.id,
        name: seed.name,
        description: seed.description,
        category: seed.category,
        createdBy: bootstrapIds[0] ?? "system",
        creatorName: "Shanah City",
        createdAt: now,
        updatedAt: now,
        visibility: seed.visibility,
        memberIds: seed.id === ADMIN_GROUP_ID ? [...new Set(bootstrapIds)] : [],
        adminIds,
        assistantAdminIds: [],
        requiresApproval: seed.requiresApproval,
        isSystem: seed.isSystem,
        signupVisible: seed.signupVisible,
      });
      changed = true;
      continue;
    }

    groups[index] = {
      ...groups[index],
      name: seed.name,
      description: seed.description,
      requiresApproval: seed.requiresApproval,
      isSystem: seed.isSystem,
      signupVisible: seed.signupVisible,
    };

    if (seed.id === ADMIN_GROUP_ID && bootstrapIds.length > 0) {
      groups[index].memberIds = [...new Set([...groups[index].memberIds, ...bootstrapIds])];
      groups[index].adminIds = [...new Set([...groups[index].adminIds, ...bootstrapIds])];
    }
    changed = true;
  }

  if (changed) {
    await saveGroups(groups);
  }
}

export async function getSignupGroupOptions() {
  const groups = await getGroups();
  return groups
    .filter((group) => group.signupVisible !== false)
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((group) => ({
      id: group.id,
      name: group.name,
      description: group.description,
      category: group.category,
      requiresApproval: group.requiresApproval ?? false,
    }));
}

async function saveGroups(groups: Group[]) {
  await writeJson(GROUPS_FILE, groups);
}

function canViewGroup(group: Group, userId?: string) {
  if (group.visibility === "public") return true;
  if (!userId) return false;
  return isGroupMember(group, userId) || isGroupAdmin(group, userId);
}

function toSummary(group: Group, userId?: string): GroupSummary {
  return {
    ...group,
    assistantAdminIds: getAssistantAdminIds(group),
    memberCount: group.memberIds.length,
    isMember: userId ? isGroupMember(group, userId) : false,
    isAdmin: userId ? isGroupAdmin(group, userId) : false,
    isAssistantLeader: userId ? isGroupAssistantLeader(group, userId) : false,
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
        isAssistantLeader: isGroupAssistantLeader(group, user.id),
        isCreator: user.id === group.createdBy,
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

  const actorIsSiteAdmin = userId ? await isAdminGroupMember(userId) : false;

  if (!canViewGroup(group, userId) && !actorIsSiteAdmin) {
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
    assistantAdminIds: [],
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

  if (group.requiresApproval) {
    throw new Error(
      `Joining "${group.name}" requires approval. Request access from your profile or sign-up.`,
    );
  }

  group.memberIds = [...group.memberIds, userId];
  group.updatedAt = new Date().toISOString();
  groups[index] = group;
  await saveGroups(groups);
  return toSummary(group, userId);
}

/** Adds a member after an approval flow; bypasses requiresApproval checks. */
export async function grantGroupMembership(groupId: string, userId: string) {
  const groups = await getGroups();
  const index = groups.findIndex((group) => group.id === groupId);
  if (index === -1) {
    throw new Error("Group not found.");
  }

  const group = groups[index];
  if (isGroupMember(group, userId)) {
    return toSummary(group, userId);
  }

  group.memberIds = [...group.memberIds, userId];
  group.updatedAt = new Date().toISOString();
  groups[index] = group;
  await saveGroups(groups);
  return toSummary(group, userId);
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
  if (group.isSystem) {
    throw new Error("System ministry groups cannot be deleted.");
  }

  if (!isGroupAdmin(group, userId)) {
    throw new Error("Only group leaders can delete this group.");
  }

  groups.splice(index, 1);
  await saveGroups(groups);
  return true;
}

export async function removeGroupMember(
  groupId: string,
  adminId: string,
  memberId: string,
  options?: { actorIsSiteAdmin?: boolean },
) {
  const groups = await getGroups();
  const index = groups.findIndex((group) => group.id === groupId);
  if (index === -1) {
    throw new Error("Group not found.");
  }

  const group = groups[index];
  assertCanRemoveGroupMember(group, adminId, memberId, Boolean(options?.actorIsSiteAdmin));

  group.memberIds = group.memberIds.filter((id) => id !== memberId);
  group.adminIds = group.adminIds.filter((id) => id !== memberId);
  group.assistantAdminIds = getAssistantAdminIds(group).filter((id) => id !== memberId);
  group.updatedAt = new Date().toISOString();
  groups[index] = group;
  await saveGroups(groups);

  const member = await getUserById(memberId);
  return {
    group: toSummary(group, adminId),
    removedName: member?.name ?? "Member",
  };
}

export async function addGroupMember(
  groupId: string,
  adminId: string,
  email: string,
  options?: { actorIsSiteAdmin?: boolean },
) {
  const groups = await getGroups();
  const index = groups.findIndex((group) => group.id === groupId);
  if (index === -1) {
    throw new Error("Group not found.");
  }

  const group = groups[index];
  assertCanManageGroupMembers(group, adminId, Boolean(options?.actorIsSiteAdmin));

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

  group.memberIds = [...group.memberIds, member.id];
  group.updatedAt = new Date().toISOString();
  groups[index] = group;
  await saveGroups(groups);

  return {
    group: toSummary(group, adminId),
    addedName: member.name,
  };
}

export async function promoteGroupAdmin(
  groupId: string,
  adminId: string,
  memberId: string,
  options?: { actorIsSiteAdmin?: boolean },
) {
  const groups = await getGroups();
  const index = groups.findIndex((group) => group.id === groupId);
  if (index === -1) {
    throw new Error("Group not found.");
  }

  const group = groups[index];
  assertCanManageGroupLeadership(group, adminId, Boolean(options?.actorIsSiteAdmin));

  if (!isGroupMember(group, memberId)) {
    throw new Error("That person must be a group member before becoming a leader.");
  }

  if (isGroupAdmin(group, memberId)) {
    return {
      group: toSummary(group, adminId),
      promotedName: (await getUserById(memberId))?.name ?? "Member",
    };
  }

  group.adminIds = [...group.adminIds, memberId];
  group.assistantAdminIds = getAssistantAdminIds(group).filter((id) => id !== memberId);
  group.updatedAt = new Date().toISOString();
  groups[index] = group;
  await saveGroups(groups);

  const member = await getUserById(memberId);
  return {
    group: toSummary(group, adminId),
    promotedName: member?.name ?? "Member",
  };
}

export async function demoteGroupAdmin(
  groupId: string,
  adminId: string,
  memberId: string,
  options?: { actorIsSiteAdmin?: boolean },
) {
  const groups = await getGroups();
  const index = groups.findIndex((group) => group.id === groupId);
  if (index === -1) {
    throw new Error("Group not found.");
  }

  const group = groups[index];
  assertCanManageGroupLeadership(group, adminId, Boolean(options?.actorIsSiteAdmin));

  if (!isGroupAdmin(group, memberId)) {
    throw new Error("That member is not a group leader.");
  }

  assertAnotherAdminRemains(group, memberId);

  group.adminIds = group.adminIds.filter((id) => id !== memberId);
  group.updatedAt = new Date().toISOString();
  groups[index] = group;
  await saveGroups(groups);

  const member = await getUserById(memberId);
  return {
    group: toSummary(group, adminId),
    demotedName: member?.name ?? "Member",
  };
}

export async function promoteGroupAssistant(
  groupId: string,
  adminId: string,
  memberId: string,
  options?: { actorIsSiteAdmin?: boolean },
) {
  const groups = await getGroups();
  const index = groups.findIndex((group) => group.id === groupId);
  if (index === -1) {
    throw new Error("Group not found.");
  }

  const group = groups[index];
  assertCanManageGroupLeadership(group, adminId, Boolean(options?.actorIsSiteAdmin));

  if (!isGroupMember(group, memberId)) {
    throw new Error("That person must be a group member before becoming an assistant leader.");
  }

  if (isGroupAdmin(group, memberId)) {
    throw new Error("That member is already a group leader.");
  }

  const assistantAdminIds = getAssistantAdminIds(group);
  if (assistantAdminIds.includes(memberId)) {
    return {
      group: toSummary(group, adminId),
      promotedName: (await getUserById(memberId))?.name ?? "Member",
    };
  }

  group.assistantAdminIds = [...assistantAdminIds, memberId];
  group.updatedAt = new Date().toISOString();
  groups[index] = group;
  await saveGroups(groups);

  const member = await getUserById(memberId);
  return {
    group: toSummary(group, adminId),
    promotedName: member?.name ?? "Member",
  };
}

export async function demoteGroupAssistant(
  groupId: string,
  adminId: string,
  memberId: string,
  options?: { actorIsSiteAdmin?: boolean },
) {
  const groups = await getGroups();
  const index = groups.findIndex((group) => group.id === groupId);
  if (index === -1) {
    throw new Error("Group not found.");
  }

  const group = groups[index];
  assertCanManageGroupLeadership(group, adminId, Boolean(options?.actorIsSiteAdmin));

  if (!isGroupAssistantLeader(group, memberId)) {
    throw new Error("That member is not an assistant leader.");
  }

  group.assistantAdminIds = getAssistantAdminIds(group).filter((id) => id !== memberId);
  group.updatedAt = new Date().toISOString();
  groups[index] = group;
  await saveGroups(groups);

  const member = await getUserById(memberId);
  return {
    group: toSummary(group, adminId),
    demotedName: member?.name ?? "Member",
  };
}
