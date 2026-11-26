# Premium Homepage V4 — owner review packet

**Branch:** `feature/premium-homepage-v4` (from `origin/main`, not the prior experimental branch)  
**Scope:** Public church site home (`/church-site` → `shanahcity.org/`) and authenticated app home (`/` in app shell) only.

## Design authority

Applied `shanah-design-system` tokens (porcelain `#f8f7f4`, navy `#10264a` / `#061329`, champagne gold `#c9a66b`, clay accents). Removed violet hero glows from app V4 CSS. No global token rewrites.

## Impeccable-style critique (manual, hooks off)

| Area | Before | V4 direction |
|------|--------|----------------|
| Public hero | Heavy gradient stack, cyan accents, decorative pill badge | Single cinematic photo, navy scrim, editorial headline |
| Ministries | Numbered grid rows | Photo-led 2×2 editorial links |
| App home mobile | V3+V4 class stack, purple scrim | V4 chrome only, devotion spotlight, porcelain lower tray |
| App home desktop | Mixed V1 sections | V4 quick tiles, devotion, sermon/give column |
| Anti–AI-slop | Middle-dot meta, repeated `rounded-[28px]` cards | Restrained radii, sentence-case, real gallery paths |

## Verification commands

```bash
npm run test:design:skills
npx tsx scripts/premium-home-v4-layout.test.ts
npx tsx scripts/premium-home-v3-layout.test.ts
npm run build
```

## Screenshots

Capture after preview deploy:

- Public: `http://localhost:3000/church-site` (desktop 1440, mobile 390)
- App home signed-in: `/` with mobile shell (390×844) light + dark
- App home desktop: `/` at 1280+ light + dark

Store under `docs/premium-homepage-v4-screenshots/` when captured.

## Preview deploy

Push branch and open Vercel preview URL from PR checks — **do not merge to production** until owner signs off on rendered previews.