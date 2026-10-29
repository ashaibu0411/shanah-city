# Staging QA — free library pipeline (TEST ONLY)

Original synthesized audio: `test-fixtures/story-music-poc/shanah-staging-qa-instrumental.wav`  
Catalog id: `qa-staging-shanah-instrumental-v1` (tag `staging-qa-test-only`)

## Unblock checklist (staging only)

1. Merge/deploy PR #21 branch to **shanah-city-staging** (build must pass).
2. Vercel env (staging, **not production**):
   - `STORY_MUSIC_HYBRID_ENABLED=1`
   - `NEXT_PUBLIC_STORY_MUSIC_HYBRID_ENABLED=1`
   - `STORY_MUSIC_FREE_LIBRARY_ENABLED=1`
   - `NEXT_PUBLIC_STORY_MUSIC_FREE_LIBRARY_ENABLED=1`
   - `STORY_MUSIC_STAGING_QA_LIBRARY=1`
   - `STORY_MUSIC_DB_CATALOG=0` (JSON authorized catalog + Blob refs for this pilot)
   - `STORY_MUSIC_POC_CATALOG_ENABLED=0` (exercise free library path, not POC picker overlap)
   - `STORY_MUSIC_BLOB_READ_WRITE_TOKEN` (+ optional `STORY_MUSIC_BLOB_STORE_ID`)
3. Ingest (local; audio never committed):
   ```bash
   STORY_MUSIC_STAGING_QA_INTERNAL_AUTH="…internal authorization text…"
   node scripts/story-music-staging-qa-ingest.mjs
   ```
   Commit only updated `data/story-music-authorized-catalog.json` + `data/story-music-rights-records.json` (metadata + blob refs).
4. Redeploy staging.
5. Authenticated flow (cookie from `data/staging-qa-session-cookies.json` or refresh via `STAGING_QA_ROUND1_PASSWORD`):
   ```bash
   node scripts/story-music-staging-free-library-flow.mjs
   ```

Production: **never** set `STORY_MUSIC_STAGING_QA_LIBRARY` or free library flags until real tracks are approved.
