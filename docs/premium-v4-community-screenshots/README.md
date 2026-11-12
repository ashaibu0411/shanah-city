# Premium V4 community screenshots (PR #67)

```bash
npm run build
PLAYWRIGHT_BASE_URL=http://127.0.0.1:3021 npx playwright test -c playwright.premium-v4-community.config.ts
```

Optional signed-in captures (member with stories/posts in the connected database):

```bash
PLAYWRIGHT_COMMUNITY_EMAIL=you@example.com PLAYWRIGHT_COMMUNITY_PASSWORD=... ^
  PLAYWRIGHT_BASE_URL=http://127.0.0.1:3021 npx playwright test -c playwright.premium-v4-community.config.ts
```

Captures `/community` hero + Stories, scrolled feed, and full-page at 390×844 and 430×932.
