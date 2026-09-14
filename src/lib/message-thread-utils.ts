import type { MessageThread } from "@/lib/member-types";

export function threadKey(userA: string, userB: string): [string, string] {
  return userA < userB ? [userA, userB] : [userB, userA];
}

export function buildDirectThreadId(userA: string, userB: string) {
  const [first, second] = threadKey(userA, userB);
  return `thread-${first}-${second}`;
}

export function buildGroupThreadId(participantIds: string[]) {
  const sorted = [...new Set(participantIds)].sort();
  return `thread-group-${sorted.join("--")}`;
}

export function normalizeThreadParticipantIds(record: {
  participantAId: string;
  participantBId: string;
  participantIds?: unknown;
  isGroup?: boolean;
}): string[] {
  if (Array.isArray(record.participantIds) && record.participantIds.length >= 2) {
    return [...new Set(record.participantIds as string[])].sort();
  }
  return threadKey(record.participantAId, record.participantBId);
}

export function getThreadDisplayName(thread: MessageThread, userId: string) {
  const others = thread.participantIds.filter((id) => id !== userId);
  if (others.length === 0) return "Member";
  if (others.length === 1) {
    return thread.participantNames[others[0]] ?? "Member";
  }
  const names = others.map(
    (id) => thread.participantNames[id]?.split(/\s+/)[0] ?? "Member",
  );
  return names.join(", ");
}

export function getPrimaryOtherParticipantId(thread: MessageThread, userId: string) {
  if (thread.participantIds.length > 2) return null;
  return thread.participantIds.find((id) => id !== userId) ?? null;
}
