# Premium Home V4 mobile screenshots

Playwright captures for PR #64 visual sign-off (390×844 and 430×932 viewports, plus full-page).

Regenerate locally:

```bash
npm run build
# Staging previews may require Vercel Deployment Protection bypass:
# VERCEL_AUTOMATION_BYPASS_SECRET=... PLAYWRIGHT_BASE_URL=https://<staging-preview> npx playwright test -c playwright.premium-home-v4.config.ts
PLAYWRIGHT_BASE_URL=https://<staging-preview> npx playwright test -c playwright.premium-home-v4.config.ts
```

Or against a local `next start` with a valid `DATABASE_URL` (default base URL `http://127.0.0.1:3000`).
