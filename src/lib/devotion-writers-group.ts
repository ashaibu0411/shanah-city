const DEFAULT_DEVOTION_GROUP_NAMES = ["team zncf", "zncf"];

export function getConfiguredDevotionGroupId() {
  return process.env.DEVOTION_GROUP_ID?.trim() || null;
}

export function getConfiguredDevotionGroupName() {
  return process.env.DEVOTION_GROUP_NAME?.trim().toLowerCase() || null;
}

export function normalizeGroupName(name: string) {
  return name.trim().toLowerCase();
}

export function isDevotionWritersGroupName(name: string) {
  const normalized = normalizeGroupName(name);
  const customName = getConfiguredDevotionGroupName();
  if (customName && normalized === customName) {
    return true;
  }
  return DEFAULT_DEVOTION_GROUP_NAMES.includes(normalized);
}

export function isDevotionWritersGroup(group: { id: string; name: string }) {
  const configuredId = getConfiguredDevotionGroupId();
  if (configuredId) {
    return group.id === configuredId;
  }
  return isDevotionWritersGroupName(group.name);
}

export function isUserInGroup(
  group: { memberIds: string[]; adminIds: string[] },
  userId: string,
) {
  return group.memberIds.includes(userId) || group.adminIds.includes(userId);
}

export function devotionGroupMatchHint() {
  const configuredId = getConfiguredDevotionGroupId();
  if (configuredId) {
    return "the configured devotion writers group";
  }
  const customName = getConfiguredDevotionGroupName();
  if (customName) {
    return `the private "${customName}" group`;
  }
  return 'the private "Team ZNCF" group';
}
