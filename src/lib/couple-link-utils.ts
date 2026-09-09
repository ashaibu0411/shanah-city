export function normalizeCoupleUserIds(userAId: string, userBId: string) {
  return userAId < userBId ? ([userAId, userBId] as const) : ([userBId, userAId] as const);
}

export function partnerIdFromLink(
  link: { userAId: string; userBId: string },
  userId: string,
) {
  if (link.userAId === userId) return link.userBId;
  if (link.userBId === userId) return link.userAId;
  return null;
}
