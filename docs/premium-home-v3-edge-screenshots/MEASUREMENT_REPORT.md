# Premium Home V3 — edge-to-edge layout measurements

Branch: `feature/home-v3-edge-to-edge-layout`  
Captured against production build at `http://127.0.0.1:3020` (Playwright Chromium).

## Geometry (guest `/`)

| Viewport | VP width | Content width (hero) | L/R gutter | Hero H | Sermon thumb W×H | Aspect | Overflow |
| --- | ---: | ---: | ---: | ---: | --- | ---: | --- |
| 360×800 | 360 | 340 | 10 / 10 | 228 | 322×181 | 1.78 | none |
| 390×844 | 390 | 370 | 10 / 10 | 228 | 352×198 | 1.78 | none |
| 412×915 | 412 | 392 | 10 / 10 | 228 | 374×210 | 1.78 | none |
| 430×932 | 430 | 410 | 10 / 10 | 232 | 392×220 | 1.78 | none |

**Notes**

- Single shell gutter (`--home-v3-gutter: 10px`); no nested `app-main` + section double inset.
- Latest Sermon uses stacked `.ph4-sermon--stack` with full-width 16:9 thumbnail (thumb width ≥ 92% of sermon panel).
- Event titles allow two-line clamp with reduced row padding.

## Signed-in Samsung bottom gap (412×915, synthetic QA)

| Metric | Value |
| --- | ---: |
| CTA bottom → nav top | **28px** |
| Target band | 20–40px |

## Artifacts

PNG files in this folder: full page, hero, sermon, events per viewport; signed-in bottom + full scroll for 412×915.

## How to re-run

```text
npm run build
npx next start -p 3020
PREMIUM_V4_FIXTURE_TEST_DATABASE_CONFIRMED=YES PLAYWRIGHT_BASE_URL=http://127.0.0.1:3020 node scripts/premium-v4-community-populated-fixture.mjs
PLAYWRIGHT_BASE_URL=http://127.0.0.1:3020 npx playwright test -c playwright.premium-home-v3-edge.config.ts
PLAYWRIGHT_COMMUNITY_SAFE_FIXTURES=1 PLAYWRIGHT_COMMUNITY_EMAIL=... PLAYWRIGHT_COMMUNITY_PASSWORD=... npx playwright test -c playwright.premium-home-v3-edge.config.ts --grep "412x915 gap"
```

Synthetic QA only. Do not merge or deploy without owner approval.