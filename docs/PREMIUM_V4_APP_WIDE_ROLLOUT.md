# Shanah City Premium V4 — App-wide design rollout

## Goal
Extend the approved mobile Home V4 visual identity across Shanah City through an **opt-in design system**, without making every page dark or changing data, permissions, transactions, or workflow behavior.

## Foundational change in this PR
- `src/lib/premium-v4-design-system.ts`: canonical navy/deep-blue/royal-purple/violet/gold/cream palette and explicit page theme registry.
- `src/app/premium-v4-system.css`: scoped `.sc-v4[data-sc-theme=...]` styles; no body-level/global override.
- `src/components/design/PremiumV4Page.tsx`: opt-in page shell, title header and card primitives.
- `scripts/premium-v4-design-system.test.ts`: palette, scope and regression guards.

**This PR intentionally does not restyle existing pages or change production workflows.**

## Phase 1 — Foundation (this PR)
- Run `npx tsx scripts/premium-v4-design-system.test.ts`, `npx tsc --noEmit` and `npm run build`.
- Review existing desktop / mobile light and dark modes, with unchanged Home V4 screenshots.
- Merge only after checks pass.

## Phase 2 — Member-facing pages (separate focused PRs)
1. **Worship / Media** (`/live`, `/sermons`): cinematic navy + purple, video-first; gold playback accents; preserve streaming status, watch/listen, playback, playlists and permissions.
2. **Community / Stories** (`/community`): cinematic rich visual cards; accessible composer, replies, stories, moderators and uploads.
3. **Events / Calendar** (`/calendar`): navy cinematic title, warm light calendar cells/forms for legibility; preserve events, RSVPs, availability and Choir one-click planner.
4. **Groups** (`/groups`): polished navy headers and cream content panels, preserve group permissions and routes.
5. **Devotions** (`/devotions`): warm-cream long-form reading, navy/gold headings and purple accents, preserve font scaling.
6. **Giving** (`/give`): warm light forms with navy/gold headers, do not touch Stripe, Anedot, ACH, Zelle, Cash App, webhook reconciliation, donation IDs or settled amounts.

Each sub-phase: use actual existing page components and real visual assets; avoid whole-app CSS; create PR; run mobile screenshots at 390×844 and 430×932 and full-page; verify contrast, tap targets, overflow, header/nav, auth and loading states; run relevant functional tests and `npm run build`; merge only after screenshot approval.

## Phase 3 — Workspaces
Marriage Prep / counseling, assigned-case workspaces and admin/finance: use light workspace surfaces, navy navigation, gold sparingly for branding, violet for focus/selection. Protect private notes, read-only submission behavior, accessibility, existing authorization boundaries and all financial records.

## Acceptance criteria
- Original approved Shanah City logo, not a fabricated SC icon.
- Semantic tokens and scoped styling, no global dark override.
- Visual continuity with Home V4 while maintaining readable task-oriented content.
- No data/schema migrations needed for visual updates.
- No regressions in urgent alerts, media, social interactions, calendar/worship, giving, marriage or admin.
- Respect light/dark settings and accessibility; avoid contrast issues in both.
- Evidence: real screenshots, not only a build success.
