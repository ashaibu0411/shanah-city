# Mobile native density screenshots (PR #68)

```bash
npm run build
PLAYWRIGHT_BASE_URL=http://127.0.0.1:3022 npx playwright test -c playwright.mobile-native-density-screenshots.config.ts
```

Captures Home, Live, Shorts, and Sermons at 390×844 and 430×932 (top + scrolled), plus overflow guards on Devotions, Giving, Marriage Prep, and Admin.
