# Premium Homepage V4 — owner review packet

**Branch:** `feature/premium-homepage-v4` (from `origin/main`, not the prior experimental branch)  
**Scope:** Public church site home (`/church-site` → `shanahcity.org/`) and authenticated app home (`/` in app shell) only.

## V4.1 master directive (in progress on PR #163)

| Phase | Scope | Status |
|-------|--------|--------|
| 1 | Shared V4.1 tokens (`premium-home-v41-tokens.css`, `premium-home-v41.css`) | Shipped |
| 2 | Public website desktop + mobile (`ChurchSiteHome`, header, footer, strip, ministries band) | Shipped — owner screenshot pass pending |
| 3 | App mobile light (porcelain shell, greeting, compact hero, white tiles, live devotion data) | Shipped — visual QA pending |
| 4 | App mobile dark (midnight surfaces, elevated cards in `premium-home-v41.css`) | Shipped — visual QA pending |
| 5 | App desktop V4.1 (editorial hero, porcelain scope, live panel, sermon/give) | Shipped (prior pass + porcelain) |
| 6–7 | Rendered screenshots, previews, owner sign-off | **Not done** — requires browser/Vercel review |

### Skill trace (this pass)

- **shanah-design-system:** Navy/porcelain/gold only; no purple; real gallery paths; `font-display` / existing sans.
- **impeccable:** Church site band layout, devotion immediately under hero, removed duplicate sermon CTAs on app.
- **frontend-design:** Editorial church-site hero + ministry photo grid; app greeting block.
- **ui-ux-pro-max:** Info strip pattern, event rows, guest Connect on desktop; nav hamburger vs horizontal.
- **apple-design:** 44px targets on header menu; safe-area-friendly spacing unchanged.
- **transitions-dev:** Reduced-motion guards on church + app button hover.

## V4.1 (app desktop + shared polish)

**Not for production merge** until owner approves rendered previews (signed-out + signed-in, light/dark, mobile/tablet/desktop).

| Skill | How it influenced V4.1 |
|-------|-------------------------|
| `shanah-design-system` | Navy/porcelain/gold palette only; removed purple tile/give/sermon gradients; real hero photography; no new fonts |
| `impeccable` | Hierarchy pass: shorter desktop hero, 4-column quick tiles, devotion “Read now”, single sermon listen CTA |
| `frontend-design` | Editorial `PremiumHomeV4Hero` on desktop; compact tiles; give title/copy stack |
| `ui-ux-pro-max` | Live panel states (live / starting soon / offline); guest Connect CTA on desktop |
| `apple-design` | Touch-sized sermon listen control; reduced-motion on card transitions |
| `transitions-dev` | Short `0.15–0.2s` ease on tiles/give only (no stagger) |

**Functional:** Live countdown uses `card` variant on desktop (readable on porcelain). Sermon titles strip leading emoji in UI only (`homeSermonDisplayTitle`). Glory Encounter naming unchanged in schedule data.

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

### Vercel preview: 403 on `/calendar`, `/give`, etc.

Those console errors are usually **Deployment Protection** blocking Next.js **RSC prefetch** (`RSC: 1`), not app `middleware.ts` (matcher is church-domain rewrites only). Sign in when the preview prompts; app home links use `appLinkPrefetchEnabled()` so **preview** builds disable prefetch (production unchanged). Owner notes: [`docs/premium-homepage-v4-screenshots/MOBILE_PREVIEW.md`](premium-homepage-v4-screenshots/MOBILE_PREVIEW.md).

If **shanah-city** preview shows *Ignored Build Step*, see [`docs/VERCEL_IGNORED_BUILD_STEP.md`](VERCEL_IGNORED_BUILD_STEP.md). Until the main project builds, **`shanah-city-staging`** preview on the same branch is equivalent for UI review (not production).