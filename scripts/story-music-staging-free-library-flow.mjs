#!/usr/bin/env node
/**
 * Authenticated staging/local free-library story flow (API-level).
 * Reads session from data/staging-qa-session-cookies.json or STORY_MUSIC_QA_SESSION_COOKIE.
 * Refreshes session via STAGING_QA_ROUND1_PASSWORD when expired (no cookie values logged).
 */

import fs from "node:fs";
import path from "node:path";
import { readFileSync } from "node:fs";

const BASE = (process.env.STORY_MUSIC_FLOW_BASE_URL ?? "https://shanah-city-staging.vercel.app").replace(
  /\/$/,
  "",
);
const QA_TRACK_ID = process.env.STORY_MUSIC_QA_TRACK_ID?.trim() ?? "qa-staging-shanah-instrumental-v1";
const PASS = process.env.STAGING_QA_ROUND1_PASSWORD?.trim();

const results = [];
function record(name, ok, detail) {
  results.push({ name, ok, detail });
}

function loadEnvFile(filePath) {
  try {
    const text = readFileSync(filePath, "utf8");
    for (const line of text.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eq = trimmed.indexOf("=");
      if (eq <= 0) continue;
      const key = trimmed.slice(0, eq).trim();
      if (process.env[key]) continue;
      let val = trimmed.slice(eq + 1).trim();
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      }
      process.env[key] = val;
    }
  } catch {
    /* optional */
  }
}

loadEnvFile(path.join(process.cwd(), ".env.staging.local"));
loadEnvFile(path.join(process.cwd(), ".env.local"));

function resolveCookie() {
  const fromEnv = process.env.STORY_MUSIC_QA_SESSION_COOKIE?.trim();
  if (fromEnv) return fromEnv.includes("=") ? fromEnv : `shanah_session=${fromEnv}`;
  const file = path.join(process.cwd(), "data", "staging-qa-session-cookies.json");
  if (!fs.existsSync(file)) return "";
  const parsed = JSON.parse(fs.readFileSync(file, "utf8"));
  const entry = parsed.sessions?.find((s) => s.key === "partnerA") ?? parsed.sessions?.[0];
  const c = entry?.cookie?.trim() ?? "";
  return c.includes("=") ? c : c ? `shanah_session=${c}` : "";
}

async function refreshSession() {
  const file = path.join(process.cwd(), "data", "staging-qa-session-cookies.json");
  if (!PASS || !fs.existsSync(file)) return "";
  const parsed = JSON.parse(fs.readFileSync(file, "utf8"));
  const entry = parsed.sessions?.find((s) => s.key === "partnerA");
  if (!entry?.email) return "";
  const res = await fetch(`${BASE}/api/auth`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "signin", email: entry.email, password: PASS }),
  });
  const setCookie = res.headers.getSetCookie?.() ?? [];
  for (const line of setCookie) {
    const part = line.split(";")[0];
    if (part.startsWith("shanah_session=")) return part;
  }
  return "";
}

async function main() {
  let cookie = resolveCookie();
  const authHeaders = () => ({ Cookie: cookie, "Content-Type": "application/json" });

  let me = await fetch(`${BASE}/api/auth`, { headers: { Cookie: cookie } });
  if (me.status === 401) {
    const refreshed = await refreshSession();
    if (refreshed) {
      cookie = refreshed;
      me = await fetch(`${BASE}/api/auth`, { headers: { Cookie: cookie } });
    }
  }
  record("authenticated_session", me.ok, { status: me.status });

  const catalog = await fetch(`${BASE}/api/community/story-music?q=&genre=all`).then((r) => r.json());
  record("free_library_live", catalog.freeLibraryLive === true, {
    freeLibraryLive: catalog.freeLibraryLive,
    activeFreeTrackCount: catalog.activeFreeTrackCount,
  });
  record("hybrid_catalog", catalog.hybrid === true, { trackCount: catalog.tracks?.length });

  const track = catalog.tracks?.find((t) => t.id === QA_TRACK_ID);
  record("search_find_qa_track", Boolean(track), { trackId: QA_TRACK_ID, found: track?.id });

  const pb = track
    ? await fetch(
        `${BASE}/api/community/story-music/playback?trackId=${encodeURIComponent(QA_TRACK_ID)}`,
      ).then((r) => r.json())
    : null;
  record("preview_playback", pb?.mode === "audio" && Boolean(pb?.audioUrl), { mode: pb?.mode });

  if (pb?.audioUrl) {
    const range = await fetch(pb.audioUrl, { headers: { Range: "bytes=0-1023", Cookie: cookie } });
    record("stream_range", range.status === 206 || range.ok, { status: range.status });
  } else {
    record("stream_range", false, "no preview url");
  }

  const pub = await fetch(`${BASE}/api/community/statuses`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({
      caption: "[qa-free-library-flow]",
      mediaType: "text",
      musicTrackId: QA_TRACK_ID,
    }),
  });
  const pubBody = await pub.json().catch(() => ({}));
  record("attach_publish", pub.status === 201, { status: pub.status, musicId: pubBody?.status?.music?.trackId });

  const statusId = pubBody?.status?.id;
  if (statusId) {
    const feed = await fetch(`${BASE}/api/community/statuses?limit=20`, { headers: { Cookie: cookie } }).then((r) =>
      r.json(),
    );
    const row = feed?.statuses?.find((s) => s.id === statusId);
    record("feed_refresh", Boolean(row?.music?.trackId), { trackId: row?.music?.trackId });

    const pb2 = await fetch(
      `${BASE}/api/community/story-music/playback?trackId=${encodeURIComponent(QA_TRACK_ID)}`,
    ).then((r) => r.json());
    record("reopen_playback_plan", pb2?.mode === "audio", { mode: pb2?.mode });
  } else {
    record("feed_refresh", false, "no status id");
    record("reopen_playback_plan", false, "skipped");
  }

  const wav = Buffer.alloc(44 + 8000);
  wav.write("RIFF", 0);
  wav.writeUInt32LE(36 + 8000, 4);
  wav.write("WAVE", 8);
  wav.write("fmt ", 12);
  wav.writeUInt32LE(16, 16);
  wav.writeUInt16LE(1, 20);
  wav.writeUInt16LE(1, 22);
  wav.writeUInt32LE(8000, 24);
  wav.writeUInt32LE(16000, 28);
  wav.writeUInt16LE(2, 32);
  wav.writeUInt16LE(16, 34);
  wav.write("data", 36);
  wav.writeUInt32LE(8000, 40);

  const boundary = `----scqa${Date.now()}`;
  const bodyParts = [
    `--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="voice-q.wav"\r\nContent-Type: audio/wav\r\n\r\n`,
    wav,
    `\r\n--${boundary}--\r\n`,
  ];
  const body = Buffer.concat(bodyParts.map((p) => (typeof p === "string" ? Buffer.from(p) : p)));

  const voiceUp = await fetch(`${BASE}/api/community/media`, {
    method: "POST",
    headers: { Cookie: cookie, "Content-Type": `multipart/form-data; boundary=${boundary}` },
    body,
  });
  record("voice_upload", voiceUp.status === 200, { status: voiceUp.status });

  const failed = results.filter((r) => !r.ok);
  console.log(JSON.stringify({ base: BASE, qaTrackId: QA_TRACK_ID, results, pass: failed.length === 0 }, null, 2));
  process.exit(failed.length ? 1 : 0);
}

main().catch((e) => {
  console.error(e.message ?? e);
  process.exit(1);
});
