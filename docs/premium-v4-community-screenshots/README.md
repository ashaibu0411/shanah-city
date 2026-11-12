# Premium V4 community screenshots (PR #67)

```bash
npm run build
PLAYWRIGHT_BASE_URL=http://127.0.0.1:3021 npx playwright test -c playwright.premium-v4-community.config.ts
```

Guest captures: main viewport, stories row, feed, filter tabs, scrolled chrome, and full-page at **390×844** and **430×932**. Also smoke-checks Devotions, Giving, Marriage Prep, and Admin for horizontal overflow.

## Populated / signed-in captures (synthetic QA only)

See [POPULATED_QA.md](./POPULATED_QA.md). Requires isolated fixture DB + `PLAYWRIGHT_COMMUNITY_SAFE_FIXTURES=1`:

```bash
PLAYWRIGHT_COMMUNITY_SAFE_FIXTURES=1 ^
PLAYWRIGHT_COMMUNITY_EMAIL=... PLAYWRIGHT_COMMUNITY_PASSWORD=... ^
PLAYWRIGHT_BASE_URL=http://127.0.0.1:3021 ^
npx playwright test -c playwright.premium-v4-community-populated.config.ts
```

Populated artifacts: feed, stories, story viewer, composer, comments/replies sheet, and scrolled feed.
