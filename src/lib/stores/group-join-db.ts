import { prisma } from "@/lib/db";
import { getUserById } from "@/lib/auth-server";
import { isAdminGroupMember } from "@/lib/admin-access-server";
import { isGroupAdmin, isGroupMember } from "@/lib/group-admin-utils";
import { getGroups, grantGroupMembership, joinGroup } from "@/lib/stores/group-db";
import type { GroupJoinRequest } from "@/lib/group-types";

function mapRequest(record: {
  id: string;
  groupId: string;
  groupName: string;
  userId: string;
  userName: string;
  userEmail: string;
  status: string;
  requestedAt: Date;
  reviewedAt: Date | null;
  reviewedBy: string | null;
  reviewedByName: string | null;
}): GroupJoinRequest {
  return {
    id: record.id,
    groupId: record.groupId,
    groupName: record.groupName,
    userId: record.userId,
    userName: record.userName,
    userEmail: record.userEmail,
    status: record.status as GroupJoinRequest["status"],
    requestedAt: record.requestedAt.toISOString(),
    reviewedAt: record.reviewedAt?.toISOString(),
    reviewedBy: record.reviewedBy ?? undefined,
    reviewedByName: record.reviewedByName ?? undefined,
  };
}

async function canReviewJoinRequest(reviewerId: string, groupId: string) {
  if (await isAdminGroupMember(reviewerId)) {
    return true;
  }
  const groups = await getGroups();
  const group = groups.find((entry) => entry.id === groupId);
  if (!group) return false;
  return isGroupAdmin(group, reviewerId);
}

export async function getPendingJoinRequest(userId: string, groupId: string) {
  const record = await prisma.groupJoinRequest.findFirst({
    where: { userId, groupId, status: "pending" },
  });
  return record ? mapRequest(record) : null;
}

export async function createJoinRequest(input: {
  groupId: string;
  groupName: string;
  userId: string;
  userName: string;
  userEmail: string;
}) {
  const existing = await getPendingJoinRequest(input.userId, input.groupId);
  if (existing) {
    return existing;
  }

  const record = await prisma.groupJoinRequest.create({
    data: {
      id: `join-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      groupId: input.groupId,
      groupName: input.groupName,
      userId: input.userId,
      userName: input.userName,
      userEmail: input.userEmail,
      status: "pending",
      requestedAt: new Date(),
    },
  });

  return mapRequest(record);
}

export async function requestGroupJoin(
  groupId: string,
  user: { id: string; name: string; email: string },
) {
  const groups = await getGroups();
  const group = groups.find((entry) => entry.id === groupId);
  if (!group) {
    throw new Error("Group not found.");
  }

  if (isGroupMember(group, user.id)) {
    return { status: "member" as const, groupName: group.name };
  }

  if (group.requiresApproval) {
    await createJoinRequest({
      groupId: group.id,
      groupName: group.name,
      userId: user.id,
      userName: user.name,
      userEmail: user.email,
    });
    return { status: "pending" as const, groupName: group.name };
  }

  await joinGroup(groupId, user.id);
  return { status: "joined" as const, groupName: group.name };
}

export async function processSignupGroupSelections(
  user: { id: string; name: string; email: string },
  groupIds: string[],
) {
  const uniqueIds = [...new Set(groupIds.filter(Boolean))];
  const results: Array<{ groupId: string; groupName: string; status: string }> = [];

  for (const groupId of uniqueIds) {
    const result = await requestGroupJoin(groupId, user);
    results.push({ groupId, groupName: result.groupName, status: result.status });
  }

  return results;
}

export async function listPendingJoinRequests(reviewerId: string) {
  const groups = await getGroups();
  const isAdmin = await isAdminGroupMember(reviewerId);

  const records = await prisma.groupJoinRequest.findMany({
    where: { status: "pending" },
    orderBy: { requestedAt: "asc" },
  });

  const filtered = records.filter((record) => {
    if (isAdmin) return true;
    const group = groups.find((entry) => entry.id === record.groupId);
    return group ? isGroupAdmin(group, reviewerId) : false;
  });

  return filtered.map(mapRequest);
}

export async function approveJoinRequest(requestId: string, reviewerId: string) {
  const record = await prisma.groupJoinRequest.findUnique({ where: { id: requestId } });
  if (!record || record.status !== "pending") {
    throw new Error("Join request not found.");
  }

  if (!(await canReviewJoinRequest(reviewerId, record.groupId))) {
    throw new Error("You cannot approve this request.");
  }

  const reviewer = await getUserById(reviewerId);
  await grantGroupMembership(record.groupId, record.userId);

  const updated = await prisma.groupJoinRequest.update({
    where: { id: requestId },
    data: {
      status: "approved",
      reviewedAt: new Date(),
      reviewedBy: reviewerId,
      reviewedByName: reviewer?.name ?? "Admin",
    },
  });

  return mapRequest(updated);
}

export async function rejectJoinRequest(requestId: string, reviewerId: string) {
  const record = await prisma.groupJoinRequest.findUnique({ where: { id: requestId } });
  if (!record || record.status !== "pending") {
    throw new Error("Join request not found.");
  }

  if (!(await canReviewJoinRequest(reviewerId, record.groupId))) {
    throw new Error("You cannot reject this request.");
  }

  const reviewer = await getUserById(reviewerId);
  const updated = await prisma.groupJoinRequest.update({
    where: { id: requestId },
    data: {
      status: "rejected",
      reviewedAt: new Date(),
      reviewedBy: reviewerId,
      reviewedByName: reviewer?.name ?? "Admin",
    },
  });

  return mapRequest(updated);
}

export async function listUserJoinRequests(userId: string) {
  const records = await prisma.groupJoinRequest.findMany({
    where: { userId },
    orderBy: { requestedAt: "desc" },
  });
  return records.map(mapRequest);
}
