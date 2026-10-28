/**
 * Staging hybrid acceptance (API). Does not print session cookies.
 * Usage: STORY_MUSIC_ACCEPTANCE_BASE_URL=https://shanah-city-staging.vercel.app \
 *        STORY_MUSIC_QA_SESSION_COOKIE=<value> node scripts/story-music-staging-acceptance.mjs
 */
const BASE = (process.env.STORY_MUSIC_ACCEPTANCE_BASE_URL ?? "https://shanah-city-staging.vercel.app").replace(
  /\/$/,
  "",
);
const SESSION = process.env.STORY_MUSIC_QA_SESSION_COOKIE?.trim();
const cookieHeader = SESSION?.includes("=") ? SESSION : SESSION ? `shanah_session=${SESSION}` : "";

const results = [];

function record(name, ok, detail) {
  results.push({ name, ok, detail });
}

async function main() {
  const catalog = await fetch(`${BASE}/api/community/story-music?q=`).then((r) => r.json());
  record("hybrid_catalog", catalog.hybrid === true, { attachableOnly: catalog.attachableOnly, count: catalog.tracks?.length });

  const trackId = catalog.tracks?.[0]?.id;
  if (!trackId) {
    record("poc_track_present", false, "no tracks");
  } else {
    const pb = await fetch(`${BASE}/api/community/story-music/playback?trackId=${encodeURIComponent(trackId)}`).then(
      (r) => r.json(),
    );
    record("preview_playback", pb.mode === "audio" && Boolean(pb.audioUrl), { mode: pb.mode });

    if (pb.audioUrl) {
      const range = await fetch(pb.audioUrl, { headers: { Range: "bytes=0-1023" } });
      const bytes = (await range.arrayBuffer()).byteLength;
      record("range_206", range.status === 206 && bytes === 1024, {
        status: range.status,
        contentRange: range.headers.get("content-range"),
      });
    }
  }

  if (!cookieHeader) {
    record("authenticated_publish", false, "STORY_MUSIC_QA_SESSION_COOKIE missing");
  } else {
    const trackForPublish = catalog.tracks?.[0]?.id ?? "poc-gh-adom-test";
    const pub = await fetch(`${BASE}/api/community/statuses`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: cookieHeader },
      body: JSON.stringify({
        caption: "[acceptance]",
        mediaType: "text",
        musicTrackId: trackForPublish,
      }),
    });
    const body = await pub.json().catch(() => ({}));
    record("publish_story", pub.status === 201, { status: pub.status });
    record("feed_music", Boolean(body?.status?.music?.trackId), { trackId: body?.status?.music?.trackId });
  }

  const failed = results.filter((r) => !r.ok);
  console.log(JSON.stringify({ base: BASE, results, pass: failed.length === 0 }, null, 2));
  if (failed.length) process.exit(1);
}

main().catch((err) => {
  console.error(err.message ?? err);
  process.exit(1);
});
