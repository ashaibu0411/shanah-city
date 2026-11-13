# Premium Home V3 — visual comparison (fidelity pass)

**Approved reference (side-by-side):** [approved-reference-mockup.jpg](./approved-reference-mockup.jpg)

Compare captured PNGs in this folder against that mockup at **390×844** and **430×932**.

## Pass 3 — finishing (`final finishing pass`)

- **Give:** diagonal metallic-gold beam (`::before`), violet base wash, higher-contrast heart emblem.
- **Bottom nav (home only):** indigo/violet gradient bar, violet top highlight, gold active Home icon (no teal shell).
- **Create Story / Reel:** transparent midnight circles, gold outlines (no flat navy fill).
- **Hero:** slightly warmer sunset grading + deeper violet scrim (image asset unchanged).

## Pass 2 corrections (`visual fidelity` commit)

| Area | Mockup target | Implementation after pass |
|------|----------------|---------------------------|
| Page background | Midnight indigo + soft violet blooms | Layered gradient + fixed radial ambient (`app-main::before`); overrides V4 navy chrome |
| Header / bottom nav | Indigo/violet glass, gold active Home | V3-specific overrides on shared chrome; violet top edge on nav |
| Hero | Sunset mountains, violet/gold grade, gold greeting, pill CTA | `ph4-hero--v3` crop, image filter, violet scrim, gold-outline service pill, serif title |
| Quick tiles | Photo-forward, purple overlay, gold rim | Violet scrims, gold border, image saturation, chevrons |
| Give | Violet panel + gold light streak | Gradient panel, heart emblem, subtitle line |
| Events / Sermon | Compact violet panels, date badges | Panel surfaces, purple date chips |
| Check-in / Connect | Violet strip + gold Open / outline Connect | `mobile-card` + guest pill styling |
| Stories (signed-in) | Rings + Create Story/Reel + scroll | Synthetic QA Playwright captures + viewer |

## Remaining differences (owner tuning)

1. **Hero photograph** — Still uses production `premium-v4-mountain-hero.jpg`, color-graded in CSS. Not a byte-identical export of the mockup PSD still.
2. **Global violet streak** — Give bar has a localized gold streak; mockup shows a slightly stronger diagonal across the full page width.
3. **Story ring shader** — Shared Community V6 ring CSS; not duplicated for home-only cosmetics.
4. **Status bar / device chrome** — Playwright captures omit iOS status-bar styling from the design comp.

## Signed-in evidence required for release

- `premium-home-v3-full-mobile-signed-in-*.png`
- `premium-home-v3-stories-signed-in-*.png`
- `premium-home-v3-story-viewer-signed-in-*.png`

Guest captures alone are not sufficient for final approval.
