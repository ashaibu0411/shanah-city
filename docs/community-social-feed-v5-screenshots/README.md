# Community social feed v5 — mobile QA screenshots

Captured from a production-mode Next.js server against **synthetic** QA members only.

```bash
PREMIUM_V4_FIXTURE_TEST_DATABASE_CONFIRMED=YES PLAYWRIGHT_BASE_URL=http://127.0.0.1:3021 node scripts/premium-v4-community-populated-fixture.mjs
PLAYWRIGHT_COMMUNITY_SAFE_FIXTURES=1 PLAYWRIGHT_COMMUNITY_EMAIL=... PLAYWRIGHT_COMMUNITY_PASSWORD=... npx playwright test -c playwright.community-social-feed-v5.config.ts
```
