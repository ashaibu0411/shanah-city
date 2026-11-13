# Premium Home V3 — mobile vertical balance

Layout-only pass: taller hero and sermon panel, footer group anchored above bottom nav on tall viewports.

```bash
npm run build
npx next start -p 3020
PLAYWRIGHT_BASE_URL=http://127.0.0.1:3020 npx playwright test -c playwright.premium-home-v3-balance.config.ts
```

Compare full-page captures at **360×800**, **390×844**, **412×915**, and **430×932** against the production Samsung gap report.

Do not merge without owner approval.
