# Marriage Prep Stage 2 — final acceptance report

**Date:** 2026-11-05  
**Scope:** PR [#28](https://github.com/ashaibu0411/shanah-city/pull/28) (`feature/marriage-stage2-integration`)  
**Verdict:** **FAIL — staging acceptance incomplete (blocking).** Automated quality gates **PASS**. Production release **not authorized**.

No merge to `main`, no production migration, no production Stage 2 flags, and **no intimacy approval** were performed.

---

## 1. Staging vs production database

| Check | Result |
|-------|--------|
| Separate Neon projects | **PASS** — `shanah-city-staging` (`late-moon-18456188`) vs `shanah-city-db` (`red-surf-98807264`) |
| Self-paced migration on staging | **PASS** — `20261027190000_marriage_self_paced_counseling` applied; `MarriageCounselingJourney.counselingDeliveryMode` present |
| Self-paced migration on production | **PASS (intentionally absent)** — no `20261027190000_*` row on production |
| Migration parity (repo vs staging) | **PASS** — 96 migrations in repo and on staging |

---

## 2. Staging migration (task 2)

**PASS — already applied.** Re-running `prisma migrate deploy` on staging is a no-op for this migration. Production was not touched.

---

## 3. Stage 2 flags on staging (intimacy OFF)

| Check | Result |
|-------|--------|
| `MARRIAGE_HUB_STAGE2_ENABLED` / `NEXT_PUBLIC_MARRIAGE_STAGE2` | **PASS** — staging API probe: `stage2Enabled: true`, Stage 2 activity list includes modules 7–12 |
| `MARRIAGE_HUB_STAGE2_INTIMACY_APPROVED` | **PASS** — `s2-mod-06-intimacy` **not** in partner activity list; assessment gate returns blocked when unapproved |
| Production Stage 2 | **PASS (off)** — not enabled on live app (no staging-style Stage 2 hub on production for anonymous probe) |

---

## 4. Automated tests (local, PR #28 branch)

All executed on `feature/marriage-stage2-integration` with Stage 2 env simulated where noted.

| Suite | Result |
|-------|--------|
| `test:marriage:curriculum` | **PASS** |
| `test:marriage:stage2`, `phase2a`, `phase2b`, `stage2-modules` | **PASS** |
| `test:marriage:self-paced`, `homework-review`, `counseling-mode` | **PASS** |
| `test:marriage:couple-feedback`, `stage2-enrichment` | **PASS** |
| `test:marriage:hub-submission-status` | **PASS** |
| `test:marriage:security` (40 routes) | **PASS** |
| `test:marriage:all` (workflow, layout, readability, integration) | **PASS** |
| `test:marriage:playwright` (8 tests: Chromium + **mobile-android**) | **PASS** |

**Note:** Playwright config has **mobile-android** only; there is **no dedicated iPhone WebKit project**. Responsive Marriage Prep CSS is covered by `test:marriage:counselor-layout` and readability tests.

---

## 5. Staging synthetic couple + counselor (task 5)

| Scenario | Result | Evidence |
|----------|--------|----------|
| Stage 2 learning / modules 1–12 (API) | **PASS** | `_staging-marriage-phasec-api.mjs`: Stage 2 enabled; activities include `s2-mod-07` … `s2-mod-12`; intimacy excluded |
| Stage 1 hub modules | **PASS** | Hub returns 16 Stage 1 module rows for QA partner A |
| Consent / compare ACL | **PASS** (partial) | Compare not unlocked for fixture journey (expected); stranger cookie probe fails closed |
| **Delivery-mode selection** | **FAIL** | Staging hub: `counselingExperience` **absent** (PR #28 UI/API not on stable staging URL) |
| **Self-paced / feedback APIs** | **FAIL** | `GET /api/marriage/self-paced` on `shanah-city-staging.vercel.app` → **404** (route not deployed on current staging production deployment) |
| **Full self-paced closure** (both partners, counselor approve, homework revision) | **FAIL (blocked)** | `scripts/_staging-closure-acceptance.mjs` requires `STAGING_QA_ROUND1_PASSWORD` — not available in this environment |
| iPhone browser E2E on staging | **NOT RUN** | No WebKit project; stable staging URL lacks PR #28 routes for manual pass |

**Blocking action:** Deploy PR #28 to the **staging Vercel production branch** (merge `feature/marriage-stage2-integration` → `staging`, or promote the successful **shanah-city-staging** PR preview), then re-run closure script with QA credentials.

---

## 6. Stage 2 ↔ self-paced session linking (review)

**PASS (behavior safe; UX gap documented).**

- **Eight-session tracker** (`MarriageCoupleSessionProgressTracker`) separates **coursework** status from **counselor-led session** status and states that appointments are tracked separately.
- **Self-paced approval** (`approveSelfPacedSession`) marks a **premarital** session complete only for non-enrichment keys, and only after published feedback + both partners submitted + homework approved.
- **Stage 2 enrichment** uses `stage2:<moduleId>` session keys; approval **does not** increment premarital session completion (regression test).
- **Pure self-paced** journeys block counselor “mark complete” without review (`assertPremaritalSessionCompletionAllowed`).
- **Gap (non-blocking for safety):** Stage 2 lesson progress lives under `/marriage/learn`, not on each eight-session row. Couples should use hub copy + learning center; optional future UX is to cross-link recommended modules per session.

This does **not** falsely complete counselor-led appointments when partners only submit Stage 2 or coursework.

---

## 7. Stage 1 compatibility

| Check | Result |
|-------|--------|
| Stage 1 hub module list on staging | **PASS** |
| Submission status regression tests | **PASS** |
| Two-partner Playwright journey (consent, private drafts, compare, counselor ACL) | **PASS** |
| Production data | **PASS** — no production migration or flag changes |

---

## 8. Blocking issues (must resolve before production Stage 2)

1. **Stable staging URL does not run PR #28 application code** — self-paced routes and `counselingExperience` missing on `https://shanah-city-staging.vercel.app` despite DB migration and Stage 2 flags.
2. **End-to-end staging closure not executed** — requires `STAGING_QA_ROUND1_PASSWORD` and deployed PR #28 code.
3. **Pastoral intimacy approval** — remain **OFF** until explicit authorization (correct today).
4. **Production** — do **not** merge PR #28, migrate production, or enable production Stage 2 flags until items 1–2 pass and leadership signs off.

---

## 9. Non-blocking follow-ups

- Add Playwright **iPhone WebKit** project for parity with Android.
- Optional UI: link eight-session rows to related Stage 2 modules / self-paced review status.
- Run `scripts/_staging-closure-acceptance.mjs` after staging deploy and attach `.tmp-staging-closure.json` to release record.

---

## 10. Release decision matrix

| Gate | Status |
|------|--------|
| Code + unit/integration/security tests | **PASS** |
| Playwright (local isolated E2E) | **PASS** |
| Neon isolation + staging migration | **PASS** |
| Staging flags (Stage 2 on, intimacy off) | **PASS** |
| Staging full product acceptance (PR #28 on staging URL) | **FAIL** |
| Production deploy | **NOT APPROVED** |

**Overall: FAIL** for Stage 2 production release; **PASS** to continue staging deploy + QA of PR #28.

---

## Update — staging deploy (2026-11-05, PR #28 @ `a568f86`)

| Step | Result |
|------|--------|
| `staging` branch → `a568f86` (force-with-lease) | **PASS** — Vercel **shanah-city-staging** production updated |
| Stable URL serves PR #28 | **PASS** — `/api/marriage/self-paced` → **401** unauthenticated (route exists); hub includes `counselingExperience` |
| Staging Neon migration | **PASS** — `20261027190000_marriage_self_paced_counseling` present |
| Stage 2 on / intimacy off | **PASS** — verified via API |
| Cookie-based synthetic workflow (`scripts/_staging-cookie-closure.mjs`) | **PASS** — all 21 checks |
| Official `_staging-closure-acceptance.mjs` (password env) | **SKIP** — `STAGING_QA_ROUND1_PASSWORD` not present in local secure env; use cookie script or set env locally and re-run |

**Staging acceptance (stable URL): PASS** for PR #28 code. **Production release: still NOT APPROVED** (no merge, no prod migrate, no prod flags, no intimacy approval).
