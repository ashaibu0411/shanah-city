# Premium Home V2 — visual review pass 2

Compare **V2 signed-in** captures in this folder against **V1 baseline** copies (`baseline-v4-full-mobile-*` from `docs/premium-home-v4-screenshots/`).

## Intended improvements (vs. original / pass 1)

| Area | Before | V2 pass 2 |
|------|--------|-----------|
| **Hierarchy** | Repeated bordered navy cards | Tiered: hero + community = rich photo; events/sermon = open list/media rows; tiles/give = light utility surfaces; stories = circular rail |
| **Header** | Taller chrome | Shorter bar; tighter logo ↔ actions alignment |
| **Hero** | Flyer-like stack | Editorial overline + title block; softer scrim; service line as text (no pill) |
| **Tiles** | Heavy gold borders | Frameless tiles; photo + gradient label only |
| **Events** | Card rows | Divider list; compact date column |
| **Sermon** | Boxed card | Horizontal 16×9 thumb + typography; no wrapper border |
| **Stories** | Guest panel in anonymous runs | **Signed-in QA** — circular avatars, horizontal scroll, names |
| **Density** | Large section gaps | ~0.52–0.58rem rhythm; shorter hero; more above-the-fold blocks |

## Capture checklist (signed-in @ 390×844 & 430×932)

- `premium-home-v2-viewport-*` — above-the-fold density
- `premium-home-v2-full-mobile-*` — full scroll
- Section crops: header, hero, tiles, give, events, sermon, stories-signed-in, community, lower

Synthetic QA only (`PLAYWRIGHT_COMMUNITY_SAFE_FIXTURES=1`). Do not merge or deploy without owner approval.
