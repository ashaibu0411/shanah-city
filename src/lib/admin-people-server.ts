import { getUsers } from "@/lib/auth-server";
import { getGroups } from "@/lib/group-server";
import { isGroupMember } from "@/lib/group-admin-utils";
import { listPendingJoinRequests } from "@/lib/group-join-server";
import type { AdminPeopleEntry } from "@/lib/member-types";

export async function getAdminPeopleDirectory(adminId: string): Promise<AdminPeopleEntry[]> {
  const [users, groups, pendingRequests] = await Promise.all([
    getUsers(),
    getGroups(),
    listPendingJoinRequests(adminId),
  ]);

  const pendingByUser = new Map<string, { id: string; name: string }[]>();
  for (const request of pendingRequests) {
    const current = pendingByUser.get(request.userId) ?? [];
    current.push({ id: request.groupId, name: request.groupName });
    pendingByUser.set(request.userId, current);
  }

  return users
    .map((user) => {
      const memberGroups = groups
        .filter((group) => isGroupMember(group, user.id))
        .map((group) => ({
          id: group.id,
          name: group.name,
          status: "member" as const,
        }));

      const pendingGroups = (pendingByUser.get(user.id) ?? [])
        .filter((pending) => !memberGroups.some((group) => group.id === pending.id))
        .map((pending) => ({
          id: pending.id,
          name: pending.name,
          status: "pending" as const,
        }));

      return {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        campusId: user.campusId,
        role: user.role,
        createdAt: user.createdAt,
        familyCount: user.family.length,
        groups: [...memberGroups, ...pendingGroups],
      };
    })
    .sort((left, right) => left.name.localeCompare(right.name));
}

export async function getMemberGroupIds(userId: string) {
  const groups = await getGroups();
  return groups.filter((group) => isGroupMember(group, userId)).map((group) => group.id);
}
