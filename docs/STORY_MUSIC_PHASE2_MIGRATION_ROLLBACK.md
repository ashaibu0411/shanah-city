# Story Music Phase 2 — migration and rollback

**Do not run against production until explicitly approved.** This branch ships the migration SQL only; operators apply it on staging first.

## Prisma migration

- **Folder:** `prisma/migrations/20261027230000_story_music_phase2/`
- **Models:** `StoryMusicRightsRecord`, `StoryMusicCatalogTrack`, `StoryMusicRightsEvidence`, `StoryMusicAdminAuditEvent`, `StoryMusicLegacyMigrationMap`
- **Apply (staging / local only):**
  ```bash
  npx prisma migrate deploy
  ```
  Or for dev:
  ```bash
  npm run db:migrate
  ```

## Feature flags (default off)

| Variable | Production default | Purpose |
|----------|-------------------|---------|
| `STORY_MUSIC_HYBRID_ENABLED` | unset / not `1` | Hybrid catalog + stream endpoint |
| `NEXT_PUBLIC_STORY_MUSIC_HYBRID_ENABLED` | unset | Client UI hint |
| `STORY_MUSIC_DB_CATALOG` | unset | Prisma catalog instead of JSON stores |
| `STORY_MUSIC_POC_CATALOG_ENABLED` | unset | Local POC wav catalog (QA only) |
| `STORY_MUSIC_ADMIN_WRITE_ENABLED` | unset | Admin/curator writes |

With all flags off, **legacy YouTube/Piped playback and existing `CommunityStatus` music fields behave as before.**

## Staging enablement (after migration)

1. Set Blob tokens (separate stores recommended):
   - `STORY_MUSIC_BLOB_READ_WRITE_TOKEN` (+ optional `STORY_MUSIC_BLOB_STORE_ID`)
   - `STORY_MUSIC_EVIDENCE_BLOB_READ_WRITE_TOKEN` (+ optional `STORY_MUSIC_EVIDENCE_BLOB_STORE_ID`)
2. Set `STORY_MUSIC_HYBRID_ENABLED=1`, `NEXT_PUBLIC_STORY_MUSIC_HYBRID_ENABLED=1`, `STORY_MUSIC_DB_CATALOG=1`, `STORY_MUSIC_ADMIN_WRITE_ENABLED=1`
3. Keep `STORY_MUSIC_POC_CATALOG_ENABLED=0` on staging unless running POC QA.
4. Set `STORY_MUSIC_CURATOR_USER_IDS` for worship staff who may create/propose drafts (admins always allowed).

## Rollback

1. **Immediate (no DB change):** Unset `STORY_MUSIC_DB_CATALOG`, then `STORY_MUSIC_HYBRID_ENABLED` / client flag. Traffic returns to legacy JSON + YouTube path.
2. **Data:** Phase 2 tables are additive; rollback does not require dropping tables. Published stories keep existing `musicTrackId` values.
3. **Destructive (only if abandoning Phase 2 data):** Drop tables in reverse FK order (`StoryMusicRightsEvidence`, `StoryMusicAdminAuditEvent`, `StoryMusicCatalogTrack`, `StoryMusicLegacyMigrationMap`, `StoryMusicRightsRecord`) — **staging only**, with backup.

## Verification checklist

- `npm run test:story-music:hybrid`
- `npm run test:story-music:security`
- `npm run test:story-music:admin`
- `npm run test:story-music:phase2`
- Confirm `/api/community/story-music/*` never returns `story-music://evidence/` refs.
- Confirm evidence download requires admin session via `/api/admin/story-music/evidence`.
