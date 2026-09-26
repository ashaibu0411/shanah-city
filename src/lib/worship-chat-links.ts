import { worshipMemberServicePath } from "@/lib/worship-plan-links";

const WORSHIP_PATH =
  /(\/worship(?:\/[^\s<>\[\]{}|\\^`"]*)?(?:\?[^\s<>\[\]{}|\\^`"]*)?)/i;

const WORSHIP_HTTP =
  /\bhttps?:\/\/[^\s<>\[\]{}|\\^`"]*(?:\/worship(?:\/[^\s<>\[\]{}|\\^`"]*)?(?:\?[^\s<>\[\]{}|\\^`"]*)?)/i;

export function trimChatLinkTrailingPunctuation(value: string) {
  let trimmed = value;
  while (/[.,;:!?)}\]'"\u201d]$/.test(trimmed)) {
    trimmed = trimmed.slice(0, -1);
  }
  return trimmed;
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
  const path = trimmed.startsWith("http")
    ? appPathFromAbsoluteUrl(trimmed) ?? trimmed
    : trimmed;

  if (!path.startsWith("/worship")) {
    return path;
  }

  if (path.startsWith("/worship/service")) {
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

  return path;
}

export type WorshipChatAction = {
  href: string;
  label: string;
};

export function worshipChatActionForMessage(text: string): WorshipChatAction | null {
  const body = text.trim();
  if (!body) return null;

  if (/Worship leader schedule published/i.test(body) || /📋 Worship leader schedule/i.test(body)) {
    return { href: "/worship?tab=schedule", label: "Open worship schedule" };
  }

  const labeledPath = body.match(
    /(?:Full planner|Open the planner|Open setlist(?: & practice)?|In planner|Open service setlist)\s*:?\s*(\S+)/i,
  );
  if (labeledPath?.[1]) {
    const raw = trimChatLinkTrailingPunctuation(labeledPath[1]);
    const href = normalizeWorshipChatHref(raw);
    return { href, label: href.includes("tab=schedule") ? "Open worship schedule" : "Open setlist" };
  }

  const pathMatch = body.match(WORSHIP_PATH);
  if (pathMatch?.[1]) {
    const href = normalizeWorshipChatHref(pathMatch[1]);
    return {
      href,
      label: href.includes("tab=schedule") ? "Open worship schedule" : "Open setlist",
    };
  }

  const httpMatch = body.match(WORSHIP_HTTP);
  if (httpMatch?.[0]) {
    const href = normalizeWorshipChatHref(trimChatLinkTrailingPunctuation(httpMatch[0]));
    return {
      href,
      label: href.includes("tab=schedule") ? "Open worship schedule" : "Open setlist",
    };
  }

  if (/🎵 Worship plan|Worship plan published/i.test(body)) {
    return { href: "/worship?tab=schedule", label: "Open worship schedule" };
  }

  if (/📅 New schedule|✏️ Schedule updated/i.test(body)) {
    return { href: "/worship?tab=schedule", label: "Open worship schedule" };
  }

  return null;
}
