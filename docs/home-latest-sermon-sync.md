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

## Completed-service livestream coverage (follow-up)

The owner clarified that **Friday, November 13, 2026 evening service ended**, and its public archived livestream should become Latest Sermon. The server now checks YouTube `search.list` with `eventType=completed` and validates each candidate using `videos.list` (`actualEndTime`, public status, matching channel, and minimum long-form duration). The validated end time is used as the chronological sort key for a completed broadcast. The expensive search is cached for **30 minutes** to protect YouTube API quota, so fresh recordings may take that long to surface. The uploads playlist remains an additional source.

The mobile home card refreshes on mount, focus, returning to a visible tab, and every five minutes while visible; it retains the last available sermon when requests fail.

### Content verification gate (not yet passed)

The exact November 13 video ID/title has **not** been independently obtained from YouTube. Verify the expected public recording by opening the channel's Live tab, then compare its ID to the newest eligible entry in the PR preview `/api/sermons?limit=50` and the homepage playback ID. A 404 or blocked public feed is **not** evidence that no recording exists. Do not merge based only on sorting tests.

**Expected recording video ID:** pending direct YouTube confirmation.  
**API-selected video ID:** pending preview/production API confirmation.  
**Merge/deploy:** hold pending matching IDs and owner approval.


## Owner-supplied source video (November 13, 2026)

- URL: https://www.youtube.com/live/-RGc46zoSoo?si=ghtkC40738Urmns5
- YouTube ID: `-RGc46zoSoo`
- The supplied link identifies the **expected** Friday evening message; video title, channel ownership, actual livestream end time and public availability have not been independently verified from YouTube in this environment.
- This ID is included as a **discovery seed**, not a permanently pinned top sermon. YouTube `videos.list` must verify it belongs to the configured channel, is public, has actually ended and meets the minimum duration. Its verified actual end time competes normally with future services; Sunday's newer service can supersede it.
- **Before merging:** request `/api/sermons?limit=50` in an authenticated preview that can reach YouTube Data API and confirm the selected video ID is `-RGc46zoSoo`, title/thumbnail match YouTube, and playback opens this ID. If it does not match, record the actual API-selected ID and why. Production is not changed by this branch.
