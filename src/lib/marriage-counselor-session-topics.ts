import { getAllModuleDefinitions } from "@/lib/marriage-curriculum-service";
import { MARRIAGE_COUNSELOR_GENERAL_SESSION_TOPICS } from "@/lib/marriage-counselor-session-topics-shared";

export { MARRIAGE_COUNSELOR_GENERAL_SESSION_TOPICS } from "@/lib/marriage-counselor-session-topics-shared";

function normalizeTitle(title: string): string {
  return title.trim().toLowerCase();
}

/** Curriculum module titles plus general topics, deduplicated and sorted for session scheduling. */
export async function listCounselorSessionTopicOptions(): Promise<string[]> {
  const modules = await getAllModuleDefinitions();
  const fromCurriculum = modules
    .filter((m) => !m.archived)
    .map((m) => m.title.trim())
    .filter(Boolean);

  const seen = new Set<string>();
  const merged: string[] = [];

  for (const title of [...fromCurriculum, ...MARRIAGE_COUNSELOR_GENERAL_SESSION_TOPICS]) {
    const key = normalizeTitle(title);
    if (seen.has(key)) continue;
    seen.add(key);
    merged.push(title);
  }

  merged.sort((a, b) => a.localeCompare(b, undefined, { sensitivity: "base" }));
  return merged;
}
