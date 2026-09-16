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

/** Title-case each name part for display (e.g. "john smith" → "John Smith"). */
export function formatPersonNameForDisplay(name: string) {
  const trimmed = name.trim();
  if (!trimmed) return trimmed;

  return trimmed
    .split(/\s+/)
    .map((part) =>
      part
        .split("-")
        .map((segment) => {
          if (!segment) return segment;
          return segment.charAt(0).toUpperCase() + segment.slice(1).toLowerCase();
        })
        .join("-"),
    )
    .join(" ");
}

export function getFormattedPublicDisplayName(user: {
  name: string;
  displayName?: string | null;
}) {
  return formatPersonNameForDisplay(getPublicDisplayName(user));
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
