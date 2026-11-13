# Premium Home V3 — mobile visual review

Reference: approved deep indigo + violet + warm gold homepage mockup.

```bash
npm run build
npx next start -p 3020
PLAYWRIGHT_BASE_URL=http://127.0.0.1:3020 npx playwright test -c playwright.premium-home-v3.config.ts
```

Signed-in story rail (synthetic QA only):

```bash
PREMIUM_V4_FIXTURE_TEST_DATABASE_CONFIRMED=YES PLAYWRIGHT_BASE_URL=http://127.0.0.1:3020 node scripts/premium-v4-community-populated-fixture.mjs
PLAYWRIGHT_COMMUNITY_SAFE_FIXTURES=1 PLAYWRIGHT_COMMUNITY_EMAIL=... PLAYWRIGHT_COMMUNITY_PASSWORD=... PLAYWRIGHT_BASE_URL=http://127.0.0.1:3020 npx playwright test -c playwright.premium-home-v3.config.ts
PREMIUM_V4_QA_CLEANUP_CONFIRMED=YES npx tsx scripts/premium-v4-community-qa-cleanup.ts
```

See [VISUAL_REVIEW.md](./VISUAL_REVIEW.md) for comparison notes against the approved mockup.

Do not merge or deploy without explicit owner approval.
