# Premium Home V3 — mobile spacing refinement V3

```bash
npx next build
npx next start -p 3020
PLAYWRIGHT_BASE_URL=http://127.0.0.1:3020 npx playwright test -c playwright.premium-home-v3-spacing-v3.config.ts
```

Captures full-page screenshots at **320**, **375**, **390**, and **430** px widths and asserts gutters (~16px), no horizontal overflow, stories→hero spacing, and equal quick-tile heights.