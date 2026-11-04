#!/usr/bin/env node
/**
 * Print which import env vars are set (length only — never values).
 */
import { readFileSync } from "fs";
import path from "path";

const keys = [
  "STORY_MUSIC_CURATOR_NAME",
  "STORY_MUSIC_CURATOR_ATTESTATION",
  "STORY_MUSIC_BLOB_READ_WRITE_TOKEN",
  "BLOB_READ_WRITE_TOKEN",
  "STORY_MUSIC_ADMIN_WRITE_ENABLED",
];

const env = { ...process.env };
try {
  for (const line of readFileSync(path.join(process.cwd(), ".env.local"), "utf8").split(/\r?\n/)) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const i = t.indexOf("=");
    if (i <= 0) continue;
    const k = t.slice(0, i).trim();
    if (!env[k]) env[k] = t.slice(i + 1).trim().replace(/^["']|["']$/g, "");
  }
} catch {
  console.log(".env.local: missing");
}

for (const k of keys) {
  const v = env[k];
  console.log(`${k}: ${v && String(v).length ? `set (${String(v).length} chars)` : "MISSING"}`);
}
