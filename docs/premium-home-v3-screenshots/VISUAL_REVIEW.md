# Premium Home V3 — visual comparison notes

**Reference:** owner-approved mobile mockup (deep midnight-indigo, violet gradients, warm gold accents).

## Implemented to match reference

| Area | Status |
|------|--------|
| Section order (Stories → Welcome → tiles → Give → Events → Sermon → Check-in → visitor CTA) | Matches |
| V3 color tokens (`--home-v3-*`) on body chrome | Matches spec tokens |
| Stories above hero, V6 portrait rail | Matches |
| Quick tiles: Worship Live, Daily Devotions, Events, **Get Connected** (no Community promo card) | Matches |
| Bottom nav: Home · Devotions · Media · More (Community in More sheet) | Matches |
| Hero mountain asset | Reuses `public/home/premium-v4-mountain-hero.jpg` (church-approved synthetic mountain still) |

## Known remaining differences (owner tuning)

1. **Background depth** — Live gradient is tuned to spec tokens; mockup has stronger diagonal violet light streaks on Give and global ambience. Further pass may add a subtle fixed background layer.
2. **Typography** — Section titles use existing `font-display` (project serif); mockup lettering may appear slightly larger or tighter on “Upcoming Events” / “Give”.
3. **Story ring colors** — Community V6 gradient rings are shared with `/community`; home rail inherits V6 (gold/magenta/violet) without a separate home-only ring shader.
4. **Tile arrows** — Gold chevrons added on V3 tiles; mockup arrows are very subtle on some tiles.
5. **Header wordmark** — Uses production `MobileAppHeader` + dark logo; spacing matches V4 compact header, not a pixel-perfect PSD export.

## Functional risks (regression watch)

- **Bottom nav:** Community removed from primary tabs only; route still in More menu via `useAppNavItems`.
- **Get Connected** tile links to `/community` (same entry as former Community tile).
- **No schema / payment / Community V6 page CSS changes** on this branch.

## Hero asset note

No separate new mountain master file was added in this branch. If the owner supplies a higher-resolution master matching the mockup exactly, swap `premiumV4HeroMountainImage` in `home-premium-v4.ts` or override in `home-premium-v3.ts`.
