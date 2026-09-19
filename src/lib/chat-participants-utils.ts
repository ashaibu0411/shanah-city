export type ChatParticipantEntry = {
  id: string;
  name: string;
  subtitle?: string;
  isLeader?: boolean;
};

export function privateMessageHref(memberId: string, memberName: string) {
  const params = new URLSearchParams({
    member: memberId,
    name: memberName,
  });
  return `/messages?${params.toString()}`;
}

export function sortChatParticipants(
  entries: ChatParticipantEntry[],
  currentUserId: string,
): ChatParticipantEntry[] {
  return [...entries].sort((left, right) => {
    if (left.id === currentUserId) return -1;
    if (right.id === currentUserId) return 1;
    if (left.isLeader && !right.isLeader) return -1;
    if (!left.isLeader && right.isLeader) return 1;
    return left.name.localeCompare(right.name, undefined, { sensitivity: "base" });
  });
}

export function participantsFromMessageThread(
  thread: {
    participantIds: string[];
    participantNames: Record<string, string>;
  },
  currentUserId: string,
): ChatParticipantEntry[] {
  return sortChatParticipants(
    thread.participantIds.map((id) => ({
      id,
      name: thread.participantNames[id] ?? "Member",
    })),
    currentUserId,
  );
}
