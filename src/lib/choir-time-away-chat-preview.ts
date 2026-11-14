import { formatAmericanDateRange } from "@/lib/unavailability-dates";

export type ChoirTimeAwayChatPreview = {
  personName: string;
  dates: string;
  reason: string;
};

/**
 * Legacy choir chat announcements still contain raw ISO dates and an
 * obsolete reminder that the update was posted to this same chat.
 * Parse them at display time; preserve the underlying message unchanged.
 */
export function parseChoirTimeAwayChatPreview(content: string): ChoirTimeAwayChatPreview | null {
  const match = content.match(
    /^🕊️ Approved time away:\s*(.+?)\s*\((\d{4}-\d{2}-\d{2})\s*[–-]\s*(\d{4}-\d{2}-\d{2})\)(?:\s*—\s*([^\n]*))?/u,
  );
  if (!match) return null;
  const reason = (match[4] ?? "")
    .split(/\s*💬\s*This update is in Shanah Worship group chat/iu)[0]
    .trim();
  return {
    personName: match[1].trim(),
    dates: formatAmericanDateRange(match[2], match[3], "long"),
    reason,
  };
}
