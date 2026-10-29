# Free Worship Music — production pilot (admin / QA only)

## Purpose

Real-device testing in the **production** Android app without releasing Free Worship Music to all members.

## Server gates (required)

| Variable | Production value | Notes |
|----------|------------------|--------|
| `STORY_MUSIC_PRODUCTION_PILOT_ENABLED` | `1` | Master pilot switch |
| `STORY_MUSIC_HYBRID_ENABLED` | **`0` / unset** | Keeps hybrid **off** for all members; pilot accounts get hybrid via server allowlist |
| `NEXT_PUBLIC_STORY_MUSIC_HYBRID_ENABLED` | `1` | Client compose/viewer for pilot UI |
| `STORY_MUSIC_FREE_LIBRARY_ENABLED` | `1` | Required with pilot; **not** member-wide when pilot is on |
| `STORY_MUSIC_STAGING_QA_LIBRARY` | **unset / `0`** | Never on production |
| `STORY_MUSIC_POC_CATALOG_ENABLED` | **unset / `0`** | No POC hybrid catalog on production |
| `STORY_MUSIC_PILOT_USER_IDS` | optional comma user ids | Extra QA accounts |
| `STORY_MUSIC_PILOT_EMAILS` | optional comma emails | Extra QA accounts |

Access is granted when **pilot is enabled** and the signed-in user is:

- In **Admin Group** (`canManageAsAdmin`), **or**
- Listed in `STORY_MUSIC_PILOT_USER_IDS` / `STORY_MUSIC_PILOT_EMAILS`

All other members: `freeLibraryLive: false`, catalog API omits pilot tracks, attach/stream/playback return **403** for pilot track ids.

## Catalog

- **Only** pilot test track: `qa-production-pilot-instrumental-v1` (tag `production-pilot-test-only`)
- Staging track `qa-staging-shanah-instrumental-v1` remains in JSON but is **hidden** on production (staging tag + no staging flag)
- No historical worship recordings in this pilot

## Blob upload (before first playback)

```bash
STORY_MUSIC_PRODUCTION_PILOT_INTERNAL_AUTH="…internal authorization text…"
vercel env run -e production -- node scripts/story-music-production-pilot-ingest.mjs
```

Uses the same original synthesized WAV as staging QA (`test-fixtures/story-music-poc/shanah-staging-qa-instrumental.wav`).

## Rollback

1. Remove or set `STORY_MUSIC_PRODUCTION_PILOT_ENABLED=0`
2. Remove hybrid / free-library flags if desired
3. Redeploy production

Existing community stories, photos, videos, and voice uploads are unchanged; only Free Worship attach/stream paths are gated.

## Samsung app

Production WebView loads `https://shanahcity.org` (or configured app URL). Sign in as an **admin** account, open **Community**, create a **photo story**, choose **Free Worship Music**, select **Pilot Test Instrumental (Admin QA Only)**.
