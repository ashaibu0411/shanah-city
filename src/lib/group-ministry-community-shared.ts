export function ministryHubCommunityUrl(groupId: string) {
  return `/community?group=${encodeURIComponent(groupId)}&filter=prayer`;
}

export function ministryHubPrayerTabUrl(groupId: string) {
  return `/groups/${encodeURIComponent(groupId)}?prayer=1`;
}
