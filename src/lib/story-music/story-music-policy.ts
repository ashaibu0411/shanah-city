import type { StoryMusicRightsStatus } from "@/lib/story-music/story-music-rights-types";

export type StoryMusicRightsRow = {
  status: string;
  licenseStartDate?: Date | null;
  licenseEndDate?: Date | null;
  streamingPermitted: boolean;
  storagePermitted: boolean;
  territoryCodesJson?: string | null;
  revokedAt?: Date | null;
};

export function parseTerritoryCodes(json: string | null | undefined): string[] {
  if (!json?.trim()) return [];
  try {
    const parsed = JSON.parse(json) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.map((v) => String(v).trim().toUpperCase()).filter(Boolean);
  } catch {
    return [];
  }
}

export function effectiveRightsStatus(
  row: StoryMusicRightsRow,
  now = new Date(),
): StoryMusicRightsStatus {
  if (row.status === "revoked" || row.revokedAt) return "revoked";
  if (row.licenseEndDate && row.licenseEndDate.getTime() < now.getTime()) return "expired";
  if (row.licenseStartDate && row.licenseStartDate.getTime() > now.getTime()) return "draft";
  return row.status as StoryMusicRightsStatus;
}

export function rightsAllowPlayback(row: StoryMusicRightsRow, now = new Date()): boolean {
  const status = effectiveRightsStatus(row, now);
  if (status !== "published") return false;
  if (!row.streamingPermitted) return false;
  return true;
}

export function territoryAllowsPlayback(
  territoryCodesJson: string | null | undefined,
  viewerCountryCode?: string | null,
): boolean {
  const allowed = parseTerritoryCodes(territoryCodesJson);
  if (allowed.length === 0) return true;
  if (!viewerCountryCode?.trim()) return true;
  return allowed.includes(viewerCountryCode.trim().toUpperCase());
}

export function storyUseAuthorized(authorizedUses: string) {
  const text = authorizedUses.toLowerCase();
  return text.includes("story") && (text.includes("background") || text.includes("ugc") || text.includes("user-generated"));
}
