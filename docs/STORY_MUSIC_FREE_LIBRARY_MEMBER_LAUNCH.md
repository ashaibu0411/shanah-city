# Free Worship Music — member launch (after attested import)

**Not complete until at least one `free-library` track is in Blob + authorized catalog and playback is verified.**

## Prerequisites

1. Church curator sets (local only, never commit):
   - `STORY_MUSIC_CURATOR_NAME`
   - `STORY_MUSIC_CURATOR_ATTESTATION` (real authorization text)
   - `STORY_MUSIC_BLOB_READ_WRITE_TOKEN` (production store)
   - `STORY_MUSIC_ADMIN_WRITE_ENABLED=1`
2. Run: `npm run story-music:import-free-library` (or `--dry-run` first).
3. Commit updated `data/story-music-authorized-catalog.json`, `data/story-music-rights-records.json`, and discovery rows marked `published`.
4. Verify on production WebView: search → preview → attach → save story → replay audio.

## Production flags — all members (not pilot-only)

| Variable | Value |
|----------|--------|
| `STORY_MUSIC_PRODUCTION_PILOT_ENABLED` | **`0` / unset** |
| `STORY_MUSIC_HYBRID_ENABLED` | `1` |
| `NEXT_PUBLIC_STORY_MUSIC_HYBRID_ENABLED` | `1` |
| `STORY_MUSIC_FREE_LIBRARY_ENABLED` | `1` |
| `STORY_MUSIC_POC_CATALOG_ENABLED` | **`0` / unset** |
| `STORY_MUSIC_STAGING_QA_LIBRARY` | **unset** |

While **pilot** remains enabled, normal members see `freeLibraryLive: false` even if free-library tracks exist in JSON.

## Blockers checklist

| Blocker | Status |
|---------|--------|
| Curator attestation in env | Required for import |
| Blob upload token | Required for import |
| ≥1 playable `free-library` catalog row | Required for member picker |
| Blob object exists for each `audioPath` | Required for playback |
| Owner sign-off docs (e.g. Amazing Grace review) | Follow worship media process |

## Discovery (no auto-publish)

`npm run story-music:discover -- --only=wikimedia-usgov-pd --max-per-query=15` adds U.S. military band Commons candidates for human review only.
