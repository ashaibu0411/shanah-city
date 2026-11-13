# Community social feed v6 — mobile QA screenshots

Captured from production-mode Next.js against **synthetic** QA members only (local disposable DB). Production must never receive fixture data.

```bash
PREMIUM_V4_FIXTURE_TEST_DATABASE_CONFIRMED=YES PLAYWRIGHT_BASE_URL=http://127.0.0.1:3021 node scripts/premium-v4-community-populated-fixture.mjs
PLAYWRIGHT_COMMUNITY_SAFE_FIXTURES=1 PLAYWRIGHT_COMMUNITY_EMAIL=... PLAYWRIGHT_COMMUNITY_PASSWORD=... npx playwright test -c playwright.community-social-feed-v6.config.ts
```

Owner review captures (full mobile chrome): `community-v6-full-mobile-*`, `community-v6-post-photo-*`, `community-v6-post-video-*`, plus stories/filters/first-post variants at 390×844 and 430×932.

Reels rail appears only when 2+ video highlights exist (compact 4.5rem tiles); single-video posts surface in the main feed only.

## Portrait-video regression (V6)

The V6 Playwright suite now generates an **in-memory 180×320 (9:16) WebM** in Chromium and injects it into a synthetic QA feed video. It asserts the decoded portrait aspect ratio, a matching adaptive media frame, and `object-fit: contain` (no cropping). The capture is `community-v6-post-portrait-390x844.png` / `community-v6-post-portrait-430x932.png`.

Run the QA suite with the fixture credentials above, then commit the refreshed **binary PNG evidence** from your local checkout:

```bash
git add docs/community-social-feed-v6-screenshots/*.png
git commit -m "test(community): attach final portrait and landscape media screenshots"
git push origin feature/community-social-feed-v6
```

Do not use real member media or real accounts for fixture capture. Do not merge until the updated screenshot evidence is visually reviewed and the final commit has passing CI.
