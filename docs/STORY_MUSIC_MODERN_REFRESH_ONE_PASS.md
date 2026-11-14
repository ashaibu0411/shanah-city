# Stories music — modern gospel refresh (single-pass acceptance)

## Goal
Remove 1900s hymns, military-band recordings and instrumental library filler from the **default** member music picker. Provide modern vocal Christian / gospel songs members actually want to attach in 30–60 second clips. Don't say a track is live unless it plays through production `/api/community/story-music/playback` and `/stream`.

## Current state
- Published free library is mostly classic / hymn / historic / military-band; eight HMG tracks are tagged `classic-style`. Do **not** relabel them as modern.
- PR #79 changes picker default to Modern worship; nonmodern tracks remain discoverable only by opting into categories; legacy attached Stories still work.
- Independently sourced FMA candidate queue: `data/story-music-contemporary-2026-intake-queue.json`. **Nothing in this queue is cleared or published yet.**
- Verify FMA track pages individually: an album-level CC BY claim is not the per-track license.
- Gabby Inza 'New Creation' is a modern Christian rap lead with CC0 marked on FMA, but listed third-party beat producers require validation before publishing.
- Do NOT import from Pixabay as a standalone audio catalog without explicit authorization, nor CC BY-NC / ND; no Spotify/YouTube rips.

## One-pass implementation task for Cursor/operator
1. Starting at PR #79, test member-facing discovery (mobile 390 × 844, 430 × 932). All old Stories and chosen legacy clips must continue playing.
2. Source **at least 10 distinct, high-quality contemporary vocal Christian/gospel recordings** across modern worship, youth gospel, afro-gospel and Christian hip-hop, prioritizing geographic/language diversity. If ten cannot pass, publish only passing recordings and disclose exact count; never pad with hymns/instrumentals.
3. For each recording, obtain a valid original file from the artist's official channel/authorized distributor. Confirm composition **and** master rights, specific per-track CC BY/CC0 or artist's grant allowing worldwide app storage, streaming, editing/clipping, and syncing to members' audiovisual stories. Save exact URL, license, attestation, curator, SHA256 and evidence. Reject unclear, NC, ND, unlicensed mainstream and misleading 'free download' files.
4. Follow the established Story Music rights pipeline: `scripts/story-music-rights-packets.mjs`, `story-music-ingest-approved.mjs`, `story-music-complete-intake-publish.mjs`; do not bypass audit, Blob, authenticated stream or attribution.
5. Download, sample-listen and technically validate every track (at least 60s if selectable for 60s; 30s minimum). Check actual vocals, modern production, dynamic range, clipping, corrupt files, duration, source integrity and no non-gospel content. Verify audio file SHA256 and Blob readback. If the file is not downloadable/usable, skip it.
6. Publish only rights-cleared, playable songs in the existing catalog. Tag accurately `modern-worship` / `youth-gospel` / `afrogospel` as appropriate, with region/country/language grounded in artist metadata. Don't claim global diversity without real tracks.
7. Prove using *normal member* production-equivalent access: `/api/community/story-music`, authenticated playback, 200/range audio stream, song attribution, clip drag, 30/60s preview and end-to-end published Story playback on iPhone/Safari. Old hymns should not appear on default Discover.
8. Run the catalog-integrity, picker-categories, modern-default, free-license, import-packets, audio-source policy, and build tests; record screenshots and audible/HTTP evidence. If production deployment is requested, use guarded PR review, merge only with passing CI, confirm Vercel READY and errors.

## STOP conditions (must not be misreported as completion)
- Source / copyright evidence missing, audio unreachable, unavailable Blob write access, missing curator attestation, failing automated tests, or no verified published songs.
- A UI-only PR must never be reported as a catalog refresh. Current PR #79 is explicitly UI-only, plus an intake list.
