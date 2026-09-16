export function getMemberAvatarApiUrl(
  userId: string,
  avatarUrl?: string | null,
  cacheKey?: string,
) {
  if (!avatarUrl?.startsWith("avatar:") && !avatarUrl?.startsWith("blob:")) return null;
  const base = `/api/profile/avatar?userId=${encodeURIComponent(userId)}`;
  return cacheKey ? `${base}&v=${encodeURIComponent(cacheKey)}` : base;
}
