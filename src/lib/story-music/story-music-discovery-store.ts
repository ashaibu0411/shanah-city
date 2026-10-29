import { readFile, writeFile, mkdir } from "fs/promises";
import path from "path";
import type { StoryMusicDiscoveryCandidate } from "@/lib/story-music/story-music-discovery-types";

const DISCOVERY_PATH = path.join(process.cwd(), "data", "story-music-discovery-candidates.json");

type DiscoveryFile = {
  version: string;
  updatedAt: string;
  candidates: StoryMusicDiscoveryCandidate[];
};

export async function loadStoryMusicDiscoveryCandidates(): Promise<StoryMusicDiscoveryCandidate[]> {
  try {
    const raw = await readFile(DISCOVERY_PATH, "utf8");
    const parsed = JSON.parse(raw) as DiscoveryFile;
    return parsed.candidates ?? [];
  } catch {
    return [];
  }
}

export async function saveStoryMusicDiscoveryCandidates(candidates: StoryMusicDiscoveryCandidate[]) {
  const payload: DiscoveryFile = {
    version: "1",
    updatedAt: new Date().toISOString(),
    candidates,
  };
  await mkdir(path.dirname(DISCOVERY_PATH), { recursive: true });
  await writeFile(DISCOVERY_PATH, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
}

export function discoveryCandidateStats(candidates: StoryMusicDiscoveryCandidate[]) {
  const byStatus: Record<string, number> = {};
  const byCategory: Record<string, number> = {};
  const bySource: Record<string, number> = {};
  let licenseAllowed = 0;
  let licenseRejected = 0;

  for (const row of candidates) {
    byStatus[row.reviewStatus] = (byStatus[row.reviewStatus] ?? 0) + 1;
    byCategory[row.category] = (byCategory[row.category] ?? 0) + 1;
    bySource[row.source] = (bySource[row.source] ?? 0) + 1;
    if (row.licenseClass === "rejected") licenseRejected += 1;
    else licenseAllowed += 1;
  }

  return { total: candidates.length, byStatus, byCategory, bySource, licenseAllowed, licenseRejected };
}
