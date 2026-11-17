# PR #103 — Release verification report

**PR:** [#103](https://github.com/ashaibu0411/shanah-city/pull/103) Vision Center external sharing  
**Target:** `main` → Vercel production (`https://shanah-city.vercel.app`)

## Pre-merge checks

| Check | Result |
|-------|--------|
| Native share payload (no URL in `text` when `url` passed) | `buildVisionShareInvitationBody` + `navigator.share({ text, url })` — avoids duplicate link on iOS Safari / Android Chrome |
| Assignment-before-link copy | Share panel + invitation body state pastors/leaders must be assigned in Vision Center first |
| Unauthorized recipient | `VisionAccessGate` after sign-in (no proposal body) |
| Unauthenticated recipient | Redirect `sign-in?next=/leadership/vision/<planId>` |
| Authorized deep link | Existing `[planId]` page + API `canReadVision` unchanged |
| Feedback submit | Existing comment/assignment forms unchanged (`GrowingVisionTextarea`, `action: "comment"`) |
| Vision content / approval | No edits to `vision-2027-drafts.ts`, approve/request-revision APIs |
| `npm run build` | **Pass** (local, 2026-11-16) |
| `npx tsx scripts/vision-center-share.test.ts` | Pass |
| `npm run test:vision:phase1` | **Kids ministry pre-existing failure** — see below |

## Pre-existing CI: Kids Ministry draft assertion

Same as [PR102_VISION_CI_PREEXISTING.md](./PR102_VISION_CI_PREEXISTING.md): `vision-center-phase1.test.ts` expects draft-only tokens (`proposed` / `NOT APPROVED`) in the **`kids`** draft; current copy uses **propose** without **proposed**. **Unrelated to PR #103**; do not change kids vision content in this release.

## Manual mobile (post-deploy)

- Senior Pastor: assign reviewer → **Share Vision** → iOS Safari / Android Chrome share sheet → one URL in message.
- Assigned reviewer: open link → sign in → full plan → submit recommendation → “Saved.”
- Unassigned member: open link → sign in → access gate only.

## Release record

_Filled after merge/deploy._

- **Merge commit:** _TBD_
- **Vercel deployment ID:** _TBD_
- **Production spot-check:** _TBD_