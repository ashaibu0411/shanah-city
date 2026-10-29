# Free Worship Story Music Library

## Status

- **Production:** Not live until `STORY_MUSIC_HYBRID_ENABLED=1`, `STORY_MUSIC_FREE_LIBRARY_ENABLED=1`, and at least one **published** track exists in `data/story-music-authorized-catalog.json` with hosted audio (Blob or approved path).
- **Discovery:** Run `node scripts/story-music-discover-sources.mjs` (metadata only; no auto-approve).

## Sources

| Source | API | Notes |
|--------|-----|--------|
| Openverse | `https://api.openverse.org/v1/audio/` | Requires `OPENVERSE_CLIENT_ID` + `OPENVERSE_CLIENT_SECRET` (OAuth client credentials). |
| Wikimedia Commons | MediaWiki API | License read from file `extmetadata`; human must verify composition/recording. |
| FMA / Internet Archive | `advancedsearch.php` | CC BY / public domain URL filter only. |

## Workflow

`discovered` → `needs_review` → `rights_verified` → `audio_tested` → `approved` → intake draft → verify → publish.

Admin UI: `/admin/story-music` → **Free worship discovery queue**.

Curated first-launch review (125 candidates): `docs/STORY_MUSIC_FIRST_LIBRARY_SHORTLIST.md` (regenerate via `node scripts/story-music-review-candidates.mjs` then `node scripts/story-music-build-shortlist-doc.mjs`).

Post human **approved** status: `node scripts/story-music-ingest-approved.mjs --candidate=<id> [--dry-run] [--transcode-mp3]` downloads verified audio (optional ffmpeg transcode for OGG/OPUS/WAV) into `.tmp-story-music-ingest/` — **never commit audio**; Blob upload remains a credentialed admin step before publish.

First-launch rights detail: `docs/STORY_MUSIC_FIRST_LAUNCH_RIGHTS.md`. Embedded OGG license probe: `node scripts/story-music-probe-embedded-license.mjs <url>`.

## Member UX

- **Free Worship Music** — native HTML5 background audio (photo stays full screen).
- **Gospel Music Videos** — YouTube in-app viewer (separate; not background extraction).
- **Background Audio** — member record/upload (unchanged).

## Bandwidth

Estimate before bulk Blob ingest: `(avg file MB) × (monthly story views) × (replay factor)`.
