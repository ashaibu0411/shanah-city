export const FOLLOW_UP_GROUP_ID = "group-follow-up";

export function isFollowUpGroup(group: { id: string; name?: string }) {
  if (group.id === FOLLOW_UP_GROUP_ID) return true;
  return /follow[\s-]?up/i.test(group.name ?? "");
}
