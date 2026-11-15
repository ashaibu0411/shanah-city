# PR #85 — Vision Center staging acceptance

**Branch:** `feature/vision-center-phase1` · **Commit:** `cbd22f5c` (+ staging follow-up)  
**Constraints:** Staging Neon only · no production migrate/deploy/merge

## Database isolation (verified before migrate)

| Check | Result |
|-------|--------|
| Staging pooled host | `ep-soft-flower-b89de4t0-pooler.c-14.us-east-1.aws.neon.tech` |
| Staging direct host | `ep-soft-flower-b89de4t0.c-14.us-east-1.aws.neon.tech` |
| Production pooled host | `ep-young-glade-auv3jgsb-pooler.c-10.us-east-1.aws.neon.tech` |
| `validateManualStagingMigrateDeploy` | **PASS** (`STAGING_DATABASE_CONFIRM=shanah-city-staging`) |
| Production `VisionPlan` table | **absent** (unchanged) |

**Migration applied (staging only):** `20261114140000_vision_center_phase1`

## Deployment

| Target | URL | Status |
|--------|-----|--------|
| PR preview (staging Vercel project) | https://shanah-city-staging-git-feature-8f4b6e-zaqnombre-9816s-projects.vercel.app | **Ready** (Vercel SUCCESS on `cbd22f5c`) |
| Staging production alias | https://shanah-city-staging.vercel.app | Live **without** Vision routes until `staging` branch includes PR #85 |
| API workflow proof | `next start` on `127.0.0.1:3010` with **staging** `DATABASE_URL` | **PASS** (see JSON artifact) |

PR preview responses require `VERCEL_AUTOMATION_BYPASS_SECRET` for non-interactive API access when deployment protection is enabled.

## Workflow evidence (staging DB)

Automated: `node scripts/_staging-vision-center-phase1-acceptance.mjs`  
Artifact: `docs/VISION_CENTER_STAGING_ACCEPTANCE_PR85.json`  
Summary: **`pass: true`**

- Senior Pastor: list plans, initialize **9** private drafts, assign worship leader  
- Leader: sees **one** assigned ministry only; **403** on other ministries  
- Stranger: **403** on private plan detail; empty plan list  
- Acknowledge → comment + HTTPS Figma link → reject `http://` link (**400**)  
- Save/submit proposal → pastoral idea decision → **approve** with **6** audit events  
- Mobile HTML hints: viewport, title, `max-w-5xl`  
- Regression probes: Groups, Comms calendar, admin reports APIs responded (see JSON)

## Regression (local / CI)

- `npm run test:vision:phase1` — **PASS**
- `npm run test:app:nav` — **PASS**

## Remaining gaps

1. **Hosted staging browser pass** on PR preview (protection bypass or owner sign-in) once alias or `staging` branch tracks this feature.  
2. **Push notifications** — not asserted in automation (staging is non-prod; notify calls are best-effort).  
3. **Pastoral role slot** on staging: `senior_pastor` → `ribonbishop@yahoo.com` (`user-1792126579919`) for Senior Pastor review; QA worship approval and assignments removed. Production pastoral roles unchanged.

## Release readiness

| Gate | Status |
|------|--------|
| Staging schema | **Ready** |
| End-to-end workflow (staging data) | **Ready** |
| Production | **Hold** — no merge/deploy/migrate |