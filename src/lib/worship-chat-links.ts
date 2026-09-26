import { worshipMemberServicePath } from "@/lib/worship-plan-links";

const WORSHIP_PATH =
  /(\/worship(?:\/[^\s<>\[\]{}|\\^`"]*)?(?:\?[^\s<>\[\]{}|\\^`"]*)?)/i;

const WORSHIP_HTTP =
  /\bhttps?:\/\/[^\s<>\[\]{}|\\^`"]*(?:\/worship(?:\/[^\s<>\[\]{}|\\^`"]*)?(?:\?[^\s<>\[\]{}|\\^`"]*)?)/i;

const WORSHIP_LINK_AFTER_LABEL =
  /(?:Full planner|Open the planner|Open service setlist|Open setlist(?: & practice)?)\s*(?:\([^)]*\))?\s*:?\s*(\/(?:worship)[^\s<]+|https?:\/\/[^\s<]+)/i;

export function trimChatLinkTrailingPunctuation(value: string) {
  let trimmed = value;
  while (/[.,;:!?)}\]'"\u201d]$/.test(trimmed)) {
    trimmed = trimmed.slice(0, -1);
  }
  return trimmed;
}

export function isValidAppNavigationHref(href: string): boolean {
  if (!href.startsWith("/")) return false;
  if (/[()]/.test(href)) return false;
  return /^\/(?:worship|groups)(?:\/|$|\?)/.test(href);
}

export function appPathFromAbsoluteUrl(url: string): string | null {
  try {
    const parsed = new URL(url);
    if (!parsed.pathname.startsWith("/worship") && !parsed.pathname.startsWith("/groups")) {
      return null;
    }
    return `${parsed.pathname}${parsed.search}`;
  } catch {
    return null;
  }
}

/** Prefer member setlist for old planner deep links in chat history. */
export function normalizeWorshipChatHref(pathOrUrl: string): string {
  const trimmed = trimChatLinkTrailingPunctuation(pathOrUrl.trim());
  if (!trimmed) {
    return "/worship";
  }

  const path = trimmed.startsWith("http")
    ? appPathFromAbsoluteUrl(trimmed) ?? trimmed
    : trimmed;

  if (!path.startsWith("/worship")) {
    return isValidAppNavigationHref(path) ? path : "/worship";
  }

  if (path.startsWith("/worship/service")) {
    return path;
  }

  if (path.startsWith("/worship/run-sheet")) {
    return path;
  }

  if (path.startsWith("/worship?") || path === "/worship") {
    const query = path.includes("?") ? path.slice(path.indexOf("?") + 1) : "";
    const params = new URLSearchParams(query);
    const date = params.get("date")?.trim();
    const time = params.get("time")?.trim() || "10:00";
    const song = params.get("song")?.trim();
    const tab = params.get("tab")?.trim();

    if (tab === "schedule") {
      return `/worship?tab=schedule`;
    }

    if (date) {
      return worshipMemberServicePath({ serviceDate: date, serviceTime: time }, song || undefined);
    }
  }

  return isValidAppNavigationHref(path) ? path : "/worship";
}

export function extractWorshipHrefFromChatBody(body: string): string | null {
  const httpMatch = body.match(WORSHIP_HTTP);
  if (httpMatch?.[0]) {
    const href = normalizeWorshipChatHref(trimChatLinkTrailingPunctuation(httpMatch[0]));
    if (isValidAppNavigationHref(href)) return href;
  }

  const pathMatch = body.match(WORSHIP_PATH);
  if (pathMatch?.[1]) {
    const href = normalizeWorshipChatHref(pathMatch[1]);
    if (isValidAppNavigationHref(href)) return href;
  }

  const labeled = body.match(WORSHIP_LINK_AFTER_LABEL);
  if (labeled?.[1]) {
    const href = normalizeWorshipChatHref(labeled[1]);
    if (isValidAppNavigationHref(href)) return href;
  }

  return null;
}

export type WorshipChatAction = {
  href: string;
  label: string;
};

export function worshipChatActionForMessage(text: string): WorshipChatAction | null {
  const body = text.trim();
  if (!body) return null;

  const extracted = extractWorshipHrefFromChatBody(body);
  if (extracted) {
    return {
      href: extracted,
      label: extracted.includes("tab=schedule") ? "Open worship schedule" : "Open setlist",
    };
  }

  if (/Worship leader schedule published/i.test(body) || /📋 Worship leader schedule/i.test(body)) {
    return { href: "/worship?tab=schedule", label: "Open worship schedule" };
  }

  if (/📅 New schedule|✏️ Schedule updated/i.test(body)) {
    return { href: "/worship?tab=schedule", label: "Open worship schedule" };
  }

  if (/🎵 Worship plan|Worship plan published/i.test(body)) {
    return { href: "/worship?tab=schedule", label: "Open worship schedule" };
  }

  return null;
}
