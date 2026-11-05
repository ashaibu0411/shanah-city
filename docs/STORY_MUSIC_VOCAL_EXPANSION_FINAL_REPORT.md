# Story Music — Vocal gospel library expansion (final report)

**Date:** 2026-11-05  
**Branch:** `feature/gospel-library-expansion`  
**Target 50–100+ vocal tracks:** **Not met** — verifiable Commons/FMA pool in-repo was exhausted after rights + vocal QC. **25** member-playable free-library tracks shipped (3 original + 11 owner-approved vocal batch + 11 expansion imports).

## Metrics

| Metric | Value |
|--------|------:|
| Discovery candidates in repository | 225 |
| Assessed in bulk manifest (latest pass) | 17 remaining pool + full history ~225 |
| Verified vocal gospel / worship (published free-library) | **25** |
| Rights-cleared and published in catalog + rights JSON | **25** |
| Blob upload verified (`story-music:verify-free-library`) | **25** / 25 OK |
| Playable by normal members (hybrid + free-library flags) | **25** (same catalog; confirm on production after deploy) |
| Rejected / quarantined (expansion QC) | **187+** discovery rows rejected; **8** catalog quarantines (see below) |
| African Gospel picker tracks | 0 (no cleared African-specific sources in pool) |
| Traditional Gospel | 10 tagged |
| Gospel Choirs | 3 tagged |
| Gospel & Worship / Contemporary Christian tags | 11+ tagged |
| Approx. Blob storage (free-library audio) | ~165 MB (sum of verified object sizes) |

## Protected originals (unchanged)

- `amazing-grace-usaf-reserve-band`
- `the-god-of-abraham-praise-usaf-band`
- `gospel-train-us-navy-edwards`

## Quarantined (removed from member library)

| Catalog id | Reason |
|------------|--------|
| `drunkenjoe-faruqi-audio-sample` | Language sample / not worship |
| `ad-te-levavi-animam-meam-choir-of-ss-simon-amp-jude-cathedral-phoenix-ar` | Latin choral / not gospel library |
| `no-machine-readable-author-provided-celestianpower-assumed-based-on-copy` | Ineligible / bad metadata |
| `composition-jacques-offenbach-*` (Marine's Hymn ×2) | Military service hymn, not gospel library |
| `wikimedia-commons-contributor-marines-hymn-*` (×2) | Military service hymn |
| `mu1-william-f-edwards-iii-gospel-train` | Duplicate of protected Gospel Train |
| `bull-of-heaven-079-praise-to-our-common-father-endlessness` | Non-gospel artist (experimental); wrongly passed title filter |

## Pipeline (this expansion)

| Script | Purpose |
|--------|---------|
| `npm run story-music:discover-vocal-scale` | Commons-scale discovery |
| `npm run story-music:build-bulk-manifest` | Reassess pool, packets, manifest |
| `npm run story-music:import-bulk-expansion` | Resumable bulk import |
| `npm run story-music:import-vocal-batch` | Original 11 approved vocal ids |
| `npm run story-music:verify-free-library` | Catalog ↔ Blob verification |
| `node scripts/story-music-quarantine-tracks.mjs` | Remove failed QC from catalog/rights |

## Engineering fixes

- Import loop writes discovery snapshot before ingest (`STORY_MUSIC_DISCOVERY_PATH`) so approved packets publish correctly.
- Intake path resolution supports `.oga`, `.opus`, and other extensions.
- Atomic JSON writes in `story-music-complete-intake-publish.mjs` to prevent rights-file corruption.
- Stricter manifest filters: military hymns, MIDI, Bull of Heaven, duplicates, non-vocal signals.

## Member picker

Categories: Gospel & Worship Songs, Contemporary Christian, African Gospel, Traditional Gospel, Gospel Choirs, Instrumentals — via `pickerCategory` on `/api/community/story-music`.

## Production

After merge, ensure Vercel production env (see `docs/STORY_MUSIC_FREE_LIBRARY_MEMBER_LAUNCH.md`):

- `STORY_MUSIC_HYBRID_ENABLED=1`
- `NEXT_PUBLIC_STORY_MUSIC_HYBRID_ENABLED=1`
- `STORY_MUSIC_FREE_LIBRARY_ENABLED=1`
- `STORY_MUSIC_PRODUCTION_PILOT_ENABLED` off

## Blockers to reaching 50–100

1. **Source ceiling:** Most of 225 discovery rows fail license (NC/ND/SA), vocal evidence, or gospel context after human QC.
2. **Commons rate limits (429):** Slow/blocked scale discovery and downloads.
3. **No ffmpeg on Windows ingest host:** OGG/Opus/OGA stored as-is (works on many devices; MP3 transcode optional in CI/Linux).
4. **FMA / LoC / independent CC artists:** Not fully mined in this pass; would need dedicated discovery + owner attestation per CC BY artist.

## Git / deploy

- Commit on `feature/gospel-library-expansion`, PR to `main`, merge when CI green, Vercel production deploy on existing project.
