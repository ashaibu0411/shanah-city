# Community social feed v6 — mobile QA screenshots

Captured from production-mode Next.js against **synthetic** QA members only (local disposable DB). Production must never receive fixture data.

```bash
PREMIUM_V4_FIXTURE_TEST_DATABASE_CONFIRMED=YES PLAYWRIGHT_BASE_URL=http://127.0.0.1:3021 node scripts/premium-v4-community-populated-fixture.mjs
PLAYWRIGHT_COMMUNITY_SAFE_FIXTURES=1 PLAYWRIGHT_COMMUNITY_EMAIL=... PLAYWRIGHT_COMMUNITY_PASSWORD=... npx playwright test -c playwright.community-social-feed-v6.config.ts
```

Owner review captures (full mobile chrome): `community-v6-full-mobile-*` (390×844 / 430×932), plus `community-v6-stories-*`, `community-v6-filters-*`, `community-v6-first-post-*`.

Reels rail appears only when 2+ video highlights exist (compact 4.5rem tiles); single-video posts surface in the main feed only.
