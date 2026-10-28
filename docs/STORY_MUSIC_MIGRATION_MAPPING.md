# Legacy `musicTrackId` migration mapping

## Principle

**Never change** `CommunityStatus.musicTrackId` on published stories. Playback and attach logic use the **same id** with new authorized audio.

## Artifacts

| File | Purpose |
|------|---------|
| `data/story-music-legacy-migration-map.json` | Per-id audio path when remapped |
| `data/story-music-authorized-catalog.json` | New ids for newly licensed tracks |
| `scripts/story-music-legacy-usage-report.mjs` | Priority list (aggregate counts only) |

## Mapping entry

```json
{
  "legacyTrackId": "way-maker",
  "rightsRecordId": "smr-…",
  "audioPath": "/story-music/way-maker-authorized.mp3",
  "status": "published",
  "notes": "Label agreement 2026-…"
}
```

| `status` | Behavior |
|----------|----------|
| `planned` | No playback change |
| `ready` | File on storage; not live |
| `published` | `legacy_catalog` resolves **playable** via `audioPath` |
| `skipped` | Keep unavailable until licensed provider covers id |

## Process

1. Run usage report → sort by `totalStories` / `activeStories`.  
2. For each priority id, complete [STORY_MUSIC_RIGHTS_INTAKE.md](./STORY_MUSIC_RIGHTS_INTAKE.md).  
3. Upload encoded file to `public/story-music/` (pilot) or Vercel Blob (production).  
4. Add mapping with `status: published` **or** publish same `catalogTrackId` as legacy id via intake.  
5. Verify preview + story playback on staging (hybrid on, POC off).  
6. No DB migration required for stories.

## Duplicate prevention

- One **published** mapping per `legacyTrackId`.  
- Admin publish removes prior catalog row with same `rightsRecordId`.  
- Attach API uses `assertTrackAttachable` — prevents duplicate conflicting ids in catalog JSON.
