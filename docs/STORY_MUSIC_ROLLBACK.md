# Story music hybrid — rollback strategy

## Goals on rollback

1. **Preserve** all `CommunityStatus` rows and `musicTrackId` / `musicYoutubeVideoId` fields.  
2. **Stop** new hybrid attaches without corrupting data.  
3. **Avoid** duplicate or broken attachments.

## Immediate rollback (production)

1. Unset Vercel env:  
   - `STORY_MUSIC_HYBRID_ENABLED`  
   - `NEXT_PUBLIC_STORY_MUSIC_HYBRID_ENABLED`  
   - `STORY_MUSIC_POC_CATALOG_ENABLED`  
   - `STORY_MUSIC_ADMIN_WRITE_ENABLED`  
2. Redeploy **previous** build (or keep current build — flags off restores `legacy-playback-bridge`).  
3. Confirm compose uses legacy catalog search (no hybrid-only filters).

**Data impact:** None on Postgres. JSON catalog/intake files on disk ignored when hybrid off.

## Partial rollback (hybrid on, catalog issue)

1. Revoke affected intake records via admin API.  
2. Set migration map entries to `planned`.  
3. Hybrid search returns only remaining **playable** tracks (`attachableOnly`).

## Forward rollback (re-enable)

1. Re-enable flags on staging first.  
2. Run pilot test plan.  
3. Production enable with monitoring.

## Duplicate attachment prevention

- Server: `assertTrackAttachable` on every post.  
- Client: preview confirms playability before user selects.  
- Catalog: unique `id` / `catalogTrackId` on publish.

## Broken playback during rollback

Stories posted during hybrid pilot may reference ids that are **unavailable** under legacy mode — acceptable short-term; prioritize **migration map** for top usage ids before re-enable.
