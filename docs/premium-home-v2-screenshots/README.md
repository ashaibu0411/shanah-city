# Premium Home V2 — mobile review screenshots

Captured from production-mode Next.js at **390×844** and **430×932** with **synthetic signed-in QA** (stories rail).

```bash
npm run build
npx next start -p 3020
PREMIUM_V4_FIXTURE_TEST_DATABASE_CONFIRMED=YES PLAYWRIGHT_BASE_URL=http://127.0.0.1:3020 node scripts/premium-v4-community-populated-fixture.mjs
PLAYWRIGHT_COMMUNITY_SAFE_FIXTURES=1 PLAYWRIGHT_COMMUNITY_EMAIL=... PLAYWRIGHT_COMMUNITY_PASSWORD=... PLAYWRIGHT_BASE_URL=http://127.0.0.1:3020 npx playwright test -c playwright.premium-home-v2.config.ts
PREMIUM_V4_QA_CLEANUP_CONFIRMED=YES npx tsx scripts/premium-v4-community-qa-cleanup.ts
```

See [VISUAL_REVIEW.md](./VISUAL_REVIEW.md) for baseline comparison notes.

Artifacts: full mobile, header, hero, tiles, events, stories, sermon, and viewport captures.

Do not merge or deploy from this folder alone — owner visual review required.
