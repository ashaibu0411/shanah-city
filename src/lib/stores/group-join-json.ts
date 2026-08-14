import { promises as fs } from "fs";
import path from "path";
import { getUserById } from "@/lib/auth-server";
import { isAdminGroupMember } from "@/lib/admin-access-server";
import { isGroupAdmin, isGroupMember } from "@/lib/group-admin-utils";
import type { GroupJoinRequest } from "@/lib/group-types";
import { getGroups, joinGroup } from "@/lib/stores/group-json";

const REQUESTS_FILE = path.join(process.cwd(), "data", "group-join-requests.json");

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

async function readRequests() {
  return readJson<GroupJoinRequest[]>(REQUESTS_FILE, []);
}

async function saveRequests(requests: GroupJoinRequest[]) {
  await writeJson(REQUESTS_FILE, requests);
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
  const requests = await readRequests();
  return (
    requests.find(
      (request) =>
        request.userId === userId &&
        request.groupId === groupId &&
        request.status === "pending",
    ) ?? null
  );
}

export async function createJoinRequest(input: {
  groupId: string;
  groupName: string;
  userId: string;
  userName: string;
  userEmail: string;
}) {
  const existing = await getPendingJoinRequest(input.userId, input.groupId);
  if (existing) return existing;

  const request: GroupJoinRequest = {
    id: `join-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    groupId: input.groupId,
    groupName: input.groupName,
    userId: input.userId,
    userName: input.userName,
    userEmail: input.userEmail,
    status: "pending",
    requestedAt: new Date().toISOString(),
  };

  const requests = await readRequests();
  requests.push(request);
  await saveRequests(requests);
  return request;
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
  const isAdmin = await isAdminGroupMember(reviewerId);
  const groups = await getGroups();
  const requests = await readRequests();

  return requests.filter((request) => {
    if (request.status !== "pending") return false;
    if (isAdmin) return true;
    const group = groups.find((entry) => entry.id === request.groupId);
    return group ? isGroupAdmin(group, reviewerId) : false;
  });
}

export async function approveJoinRequest(requestId: string, reviewerId: string) {
  const requests = await readRequests();
  const index = requests.findIndex((request) => request.id === requestId);
  if (index === -1 || requests[index].status !== "pending") {
    throw new Error("Join request not found.");
  }

  const record = requests[index];
  if (!(await canReviewJoinRequest(reviewerId, record.groupId))) {
    throw new Error("You cannot approve this request.");
  }

  const reviewer = await getUserById(reviewerId);
  await joinGroup(record.groupId, record.userId);

  requests[index] = {
    ...record,
    status: "approved",
    reviewedAt: new Date().toISOString(),
    reviewedBy: reviewerId,
    reviewedByName: reviewer?.name ?? "Admin",
  };
  await saveRequests(requests);
  return requests[index];
}

export async function rejectJoinRequest(requestId: string, reviewerId: string) {
  const requests = await readRequests();
  const index = requests.findIndex((request) => request.id === requestId);
  if (index === -1 || requests[index].status !== "pending") {
    throw new Error("Join request not found.");
  }

  const record = requests[index];
  if (!(await canReviewJoinRequest(reviewerId, record.groupId))) {
    throw new Error("You cannot reject this request.");
  }

  const reviewer = await getUserById(reviewerId);
  requests[index] = {
    ...record,
    status: "rejected",
    reviewedAt: new Date().toISOString(),
    reviewedBy: reviewerId,
    reviewedByName: reviewer?.name ?? "Admin",
  };
  await saveRequests(requests);
  return requests[index];
}

export async function listUserJoinRequests(userId: string) {
  const requests = await readRequests();
  return requests.filter((request) => request.userId === userId);
}
