# Story Music expansion — workstream closed

**Closed:** 2026-11-05  
**Production:** [shanah-city.vercel.app](https://shanah-city.vercel.app) (PR #23 merged, production deploy succeeded)

## Playable library (normal members, hybrid on)

| Item | Count |
|------|------:|
| **Total free-library tracks in catalog + Blob** | **25** |
| Original protected launch tracks | 3 |
| Owner-approved vocal batch | 11 (all `published` in discovery) |
| Expansion imports (rights-verified) | 11 |
| **Production Story Music API tracks returned** | **25** (verified post-deploy) |

## Final bulk review (no new discovery)

| Item | Count |
|------|------:|
| Discovery rows in repository | 225 |
| Published (import complete) | 24 discovery rows → 25 catalog tracks |
| **Skipped / rejected** (rights, vocal QC, non-gospel, duplicates, bad downloads) | **199** |
| Pending import manifest | **0** |
| Quarantined after import QC | 8 catalog ids (documented in vocal expansion final report) |

## Skipped reasons (summary)

- License blocked (NC/ND/SA or unverified)
- No vocal / instrumental-only / non-gospel context
- Military service hymns, MIDI, language samples, sermons
- Duplicate of already-published spiritual
- Download failures (Commons 429 / timeout) — individual failures did not block release
- Explicit reject: Bull of Heaven, quarantined samples, Marines’ Hymn variants

Full skip samples: `data/story-music-workstream-closure.json`

## Verification completed

- [x] `npm run story-music:verify-free-library` — 25/25 Blob OK
- [x] `npm run test:story-music:catalog-integrity`
- [x] `npm run test:story-music:picker-categories`
- [x] `npm run test:story-music:import-packets`
- [x] `npm run build`
- [x] Production `/api/community/story-music` lists 25 playable tracks

## Preserved behavior

- Original three songs unchanged
- Record Your Voice, 60s voice fix, music credit placement, story replay
- Rights records + attribution on attach

## Remaining ops (not blocking closure)

1. Set **`STORY_MUSIC_FREE_LIBRARY_ENABLED=1`** on Vercel production if `freeLibraryLive` should read `true` in API (tracks already attach under hybrid).
2. Optional Linux/ffmpeg pass for MP3 transcodes (OGG/Opus/OGA served as uploaded).
3. No further automated discovery cycles unless owner opens a new rights-sourcing project.

## Git

- Merge: `5ff69a9` — PR #23 `feature/gospel-library-expansion`
- Follow-up fix: `INSTRUMENTAL_ONLY` manifest script regression (this closure commit)

**Workstream status: CLOSED.** Next priority: Marriage Prep / Counseling Hub fixes.
