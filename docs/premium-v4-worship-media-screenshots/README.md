# Premium V4 worship & media screenshots (PR #66)

Regenerate after production build and `next start` with `DATABASE_URL` set:

```bash
npm run build
PLAYWRIGHT_BASE_URL=http://127.0.0.1:3010 npx playwright test -c playwright.premium-v4-worship-media.config.ts
```

Artifacts: `/live` (Live + Shorts tabs) and `/sermons` at 390×844 and 430×932.
