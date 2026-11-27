# Shanah City public website — editorial V5

**Branch:** `feature/premium-homepage-v4` (PR #163)  
**Scope:** `/church-site` homepage only — member app home unchanged.

## Art direction

- Typographic hero (no full-bleed photo headline)
- Asymmetric 5/7 editorial photo grid with porcelain service panel overlay
- DM Sans editorial sans hierarchy on warm porcelain (`#F8F7F4`)
- Navy (`#10264A`) + champagne gold accents only
- Reversible: remove `church-site-v5.css` import and restore prior `ChurchSiteHome` / `church-cine` frame classes to roll back

## Files

| File | Role |
|------|------|
| `src/components/church-site/ChurchSiteHome.tsx` | V5 sections A–H |
| `src/components/church-site/ChurchSiteFrame.tsx` | V5 header/footer nav |
| `src/components/church-site/church-site-v5.css` | V5 tokens + layout |

## Service times

Pulled from `site.serviceTimes` (Sunday + Glory Encounter Friday).

## Screenshots

Captured under `docs/premium-homepage-v4-screenshots/` (`church-desktop-1440`, `church-laptop-1280`, `church-tablet-768`, `church-mobile-390`, `church-mobile-430`).

## Independent of

PR #165 (mobile nav + notification hotfix).