export function isGroupIconRef(value?: string | null) {
  return Boolean(value?.startsWith("group-icon:"));
}

export function getGroupIconApiUrl(groupId: string, cacheKey?: string) {
  const params = new URLSearchParams({ groupId });
  if (cacheKey) params.set("v", cacheKey);
  return `/api/groups/icon?${params.toString()}`;
}
