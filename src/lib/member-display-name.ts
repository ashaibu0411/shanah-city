export function normalizeDisplayName(value?: string | null) {
  const trimmed = value?.trim();
  if (!trimmed) return undefined;
  return trimmed.slice(0, 50);
}

export function getPublicDisplayName(user: {
  name: string;
  displayName?: string | null;
}) {
  return user.displayName?.trim() || user.name;
}

export function getPublicDisplayFirstName(user: {
  name: string;
  displayName?: string | null;
}) {
  const display = getPublicDisplayName(user);
  return display.split(/\s+/)[0] || display;
}

function normalizeName(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

export function userMatchesStoredAuthorName(
  user: { name: string; displayName?: string | null },
  storedName: string,
) {
  const normalized = normalizeName(storedName);
  if (normalizeName(user.name) === normalized) return true;
  if (user.displayName && normalizeName(user.displayName) === normalized) {
    return true;
  }
  return false;
}
