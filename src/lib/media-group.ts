const DEFAULT_MEDIA_GROUP_NAMES = ["media team", "media"];

export function getConfiguredMediaGroupId() {
  return process.env.MEDIA_GROUP_ID?.trim() || null;
}

export function getConfiguredMediaGroupName() {
  return process.env.MEDIA_GROUP_NAME?.trim().toLowerCase() || null;
}

export function normalizeGroupName(name: string) {
  return name.trim().toLowerCase();
}

export function isMediaGroupName(name: string) {
  const normalized = normalizeGroupName(name);
  const customName = getConfiguredMediaGroupName();
  if (customName && normalized === customName) {
    return true;
  }
  return DEFAULT_MEDIA_GROUP_NAMES.includes(normalized);
}

export function isMediaGroup(group: { id: string; name: string }) {
  const configuredId = getConfiguredMediaGroupId();
  if (configuredId) {
    return group.id === configuredId;
  }
  return isMediaGroupName(group.name);
}

export function isUserInGroup(
  group: { memberIds: string[]; adminIds: string[] },
  userId: string,
) {
  return group.memberIds.includes(userId) || group.adminIds.includes(userId);
}

export function mediaGroupMatchHint() {
  const configuredId = getConfiguredMediaGroupId();
  if (configuredId) {
    return "the configured Media group";
  }
  const customName = getConfiguredMediaGroupName();
  if (customName) {
    return `the "${customName}" group`;
  }
  return 'a group named "Media Team" or "Media"';
}
