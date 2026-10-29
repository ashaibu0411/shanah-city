import { appendFile, mkdir } from "fs/promises";
import path from "path";

export type StoryMusicAdminAuditAction =
  | "intake_create"
  | "intake_update"
  | "intake_verify"
  | "intake_publish"
  | "intake_revoke"
  | "intake_withdraw"
  | "catalog_update"
  | "migration_map_update"
  | "discovery_status"
  | "discovery_promote";

export type StoryMusicAdminAuditEntry = {
  id: string;
  at: string;
  actorUserId: string;
  actorName?: string;
  action: StoryMusicAdminAuditAction;
  targetId?: string;
  summary: string;
  meta?: Record<string, string>;
};

const AUDIT_PATH = path.join(process.cwd(), "data", "story-music-admin-audit.jsonl");

export async function appendStoryMusicAdminAudit(entry: Omit<StoryMusicAdminAuditEntry, "id" | "at">) {
  await mkdir(path.dirname(AUDIT_PATH), { recursive: true });
  const line: StoryMusicAdminAuditEntry = {
    id: `sma-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    at: new Date().toISOString(),
    ...entry,
  };
  await appendFile(AUDIT_PATH, `${JSON.stringify(line)}\n`, "utf8");
  return line;
}

/** Read recent audit entries (admin only — caller must authorize). */
export async function readRecentStoryMusicAdminAudit(limit = 50): Promise<StoryMusicAdminAuditEntry[]> {
  const { readFile } = await import("fs/promises");
  try {
    const raw = await readFile(AUDIT_PATH, "utf8");
    const lines = raw.trim().split("\n").filter(Boolean);
    return lines
      .slice(-limit)
      .map((line) => JSON.parse(line) as StoryMusicAdminAuditEntry)
      .reverse();
  } catch {
    return [];
  }
}
