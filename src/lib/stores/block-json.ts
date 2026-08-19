import { promises as fs } from "fs";
import path from "path";
import type { MessageReport, UserBlock } from "@/lib/block-types";

const BLOCKS_FILE = path.join(process.cwd(), "data", "message-blocks.json");
const REPORTS_FILE = path.join(process.cwd(), "data", "message-reports.json");

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

export async function getBlocksForUser(userId: string) {
  const blocks = await readJson<UserBlock[]>(BLOCKS_FILE, []);
  return blocks.filter((block) => block.blockerId === userId);
}

export async function getBlockedUserIds(userId: string) {
  const blocks = await getBlocksForUser(userId);
  return blocks.map((block) => block.blockedUserId);
}

export async function isUserBlocked(blockerId: string, blockedUserId: string) {
  const blocks = await readJson<UserBlock[]>(BLOCKS_FILE, []);
  return blocks.some(
    (block) =>
      block.blockerId === blockerId && block.blockedUserId === blockedUserId,
  );
}

export async function hasMessagingBlock(userA: string, userB: string) {
  const [aBlocksB, bBlocksA] = await Promise.all([
    isUserBlocked(userA, userB),
    isUserBlocked(userB, userA),
  ]);
  return aBlocksB || bBlocksA;
}

export async function getMessagingBlockReason(senderId: string, recipientId: string) {
  if (await isUserBlocked(recipientId, senderId)) {
    return "This member is not available for messages.";
  }
  if (await isUserBlocked(senderId, recipientId)) {
    return "Unblock this member to send messages again.";
  }
  return null;
}

export async function blockUser(input: {
  blockerId: string;
  blockedUserId: string;
  blockedUserName: string;
}) {
  if (input.blockerId === input.blockedUserId) {
    throw new Error("You cannot block yourself.");
  }

  const blocks = await readJson<UserBlock[]>(BLOCKS_FILE, []);
  const existing = blocks.find(
    (block) =>
      block.blockerId === input.blockerId &&
      block.blockedUserId === input.blockedUserId,
  );
  if (existing) {
    return existing;
  }

  const record: UserBlock = {
    id: `block-${Date.now()}`,
    blockerId: input.blockerId,
    blockedUserId: input.blockedUserId,
    blockedUserName: input.blockedUserName,
    createdAt: new Date().toISOString(),
  };

  blocks.unshift(record);
  await writeJson(BLOCKS_FILE, blocks);
  return record;
}

export async function unblockUser(blockerId: string, blockedUserId: string) {
  const blocks = await readJson<UserBlock[]>(BLOCKS_FILE, []);
  const next = blocks.filter(
    (block) =>
      !(block.blockerId === blockerId && block.blockedUserId === blockedUserId),
  );
  await writeJson(BLOCKS_FILE, next);
  return next.filter((block) => block.blockerId === blockerId);
}

export async function reportMember(input: {
  reporterId: string;
  reporterName: string;
  reportedUserId: string;
  reportedUserName: string;
  threadId?: string;
  groupId?: string;
  messageId?: string;
  reason: string;
}) {
  const reason = input.reason.trim();
  if (!reason) {
    throw new Error("Please describe what happened.");
  }

  const reports = await readJson<MessageReport[]>(REPORTS_FILE, []);
  const record: MessageReport = {
    id: `report-${Date.now()}`,
    reporterId: input.reporterId,
    reporterName: input.reporterName,
    reportedUserId: input.reportedUserId,
    reportedUserName: input.reportedUserName,
    threadId: input.threadId,
    groupId: input.groupId,
    messageId: input.messageId,
    reason,
    createdAt: new Date().toISOString(),
    status: "open",
  };

  reports.unshift(record);
  await writeJson(REPORTS_FILE, reports.slice(0, 500));
  return record;
}

export async function getOpenReportsForLeaders(limit = 50) {
  const reports = await readJson<MessageReport[]>(REPORTS_FILE, []);
  return reports.filter((report) => report.status === "open").slice(0, limit);
}
