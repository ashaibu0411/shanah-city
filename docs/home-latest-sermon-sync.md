# Home Latest Sermon — sync fix

## Root cause (pre-fix)

1. **Feed position, not publication time** — `src/app/page.tsx` used `sermonVideos[0]` and the home client called `/api/sermons?limit=1`, assuming API order equals newest sermon. Playlist/search results can be out of order after Short filtering.
2. **Scrape fallback stamped “today”** — `fetchSermonsViaChannelScrape` set `publishedAt: new Date().toISOString()`, which could make an older scraped ID win a newest-first sort.
3. **Env fallback metadata mismatch** — `buildHomeSermonFallback()` paired `NEXT_PUBLIC_HOME_SERMON_VIDEO_ID` with static `latestSermon.title` from `site.ts` and today’s date, mixing title/thumbnail/ID.

## Fix

- `src/lib/youtube-sermons-select.ts` — sort by verified `publishedAt`, exclude Shorts/trailers, `pickLatestEligibleSermon()`.
- `loadChannelSermons()` — always returns a normalized, newest-first list.
- Home page — `mergeHomeSermonVideo(null, sermonVideos)` picks the newest eligible item from the full list.
- Client refresh — fetches `limit=50`, runs the same picker (no stale `videos[0]`).
- Scrape path — no synthetic publication dates; undated entries sort last and are not preferred over dated sermons.
- Env override — only when the feed is empty; generic title, empty date (no static title/date lie).

Home and `/sermons` both consume `getChannelSermons()`; `page.tsx` and API routes remain `force-dynamic` with `cache: "no-store"` on client refetch.

## November 13, 2026 verification

Re-run after deploy preview with `YOUTUBE_API_KEY` configured:

```text
GET /api/sermons?limit=50
```

Compare `pickLatestEligibleSermon(videos)` (first item after fix) against the message the owner posted on **2026-11-13**:

| Check | How |
| --- | --- |
| Expected | Newest eligible long-form upload on @ShanahCity with `publishedAt` on or after 2026-11-13 |
| Homepage | Same `id`, `title`, `thumbnailUrl`, and `publishedAt` as `/api/sermons` newest row |
| Playback | Home play action uses that `id` (no mixed title from `site.latestSermon`) |

From this workstation YouTube RSS returned HTTP 404 (bot block); use the YouTube Data API path in production (preferred) or compare IDs in the browser against the channel uploads tab.

## Tests

`npx tsx scripts/youtube-sermons-select.test.ts` — out-of-order list, Short exclusion, undated scrape entries, merge consistency.