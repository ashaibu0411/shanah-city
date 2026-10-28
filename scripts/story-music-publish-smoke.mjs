/**
 * Staging/local smoke: authenticated story post with optional musicTrackId.
 * Does not print captions or member content — status codes only.
 *
 * Usage:
 *   STORY_MUSIC_QA_SESSION_COOKIE=<session cookie value> \
 *   STORY_MUSIC_SMOKE_BASE_URL=https://shanah-city-staging.vercel.app \
 *   node scripts/story-music-publish-smoke.mjs
 *
 * Optional: STORY_MUSIC_SMOKE_TRACK_ID=way-maker
 */
const BASE = (process.env.STORY_MUSIC_SMOKE_BASE_URL ?? "http://127.0.0.1:3000").replace(/\/$/, "");
const SESSION = process.env.STORY_MUSIC_QA_SESSION_COOKIE?.trim();
const TRACK_ID = process.env.STORY_MUSIC_SMOKE_TRACK_ID?.trim();

if (!SESSION) {
  console.error("STORY_MUSIC_QA_SESSION_COOKIE is required.");
  process.exit(1);
}

async function main() {
  const body = {
    caption: "",
    mediaType: "text",
    ...(TRACK_ID ? { musicTrackId: TRACK_ID } : {}),
  };

  const response = await fetch(`${BASE}/api/community/statuses`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Cookie: `shanah_session=${SESSION}`,
    },
    body: JSON.stringify(body),
  });

  const text = await response.text();
  let json;
  try {
    json = JSON.parse(text);
  } catch {
    json = null;
  }

  console.log(
    JSON.stringify({
      base: BASE,
      status: response.status,
      ok: response.ok,
      hasMusic: Boolean(TRACK_ID),
      error: json?.error ?? (response.ok ? undefined : "request_failed"),
    }),
  );

  if (!response.ok) process.exit(1);
}

main().catch((err) => {
  console.error(err.message ?? err);
  process.exit(1);
});
