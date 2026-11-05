# Marriage Prep Stage 2 — final release check (Module 6 approved)

**Date:** 2026-11-05  
**Integration branch:** `feature/marriage-stage2-integration` @ `6c740d5` (includes merged **PR #29**)  
**Staging deploy:** `staging` branch → **shanah-city-staging** production only  
**Production (`main` / live app):** unchanged — no merge, no prod migrate, no prod Stage 2 flags.

---

## 1. PR #29 merge

| Step | Result |
|------|--------|
| Merge PR #29 into integration (not `main`) | **PASS** — `fix/marriage-stage2-intimacy-consent-gate` → `feature/marriage-stage2-integration` (GitHub PR #29 merged) |

---

## 2. Automated tests (local)

| Command | Result |
|---------|--------|
| `npm run test:marriage:intimacy-consent` | **PASS** |
| `npm run test:marriage:all` | **PASS** |
| `npm run test:marriage:phase2b` | **PASS** |
| `npm run build` | **PASS** |

---

## 3. Staging deploy

| Step | Result |
|------|--------|
| Deploy integration + PR #29 to `shanah-city-staging` | **PASS** — `staging` @ `d2b732b` / `6c740d5` |
| Staging Neon (unchanged) | **PASS** — separate from production; self-paced migration present |
| Stage 2 enabled on staging | **PASS** |
| Intimacy flag **enabled for test only** | **PASS** — `MARRIAGE_HUB_STAGE2_INTIMACY_APPROVED=1` set, redeployed |
| Intimacy flag **disabled after test** | **PASS** — env var **removed**, staging redeployed |

---

## 4. Module 6 staging verification (`scripts/_staging-intimacy-consent.mjs`)

Synthetic QA cookies on `https://shanah-city-staging.vercel.app`:

| Workflow | Verdict |
|----------|---------|
| Module 6 listed when pastoral approval on | **PASS** |
| Partner A opts **Yes** → full question bank | **PASS** |
| Partner B opts **Not now** → gated (1 question) | **PASS** |
| B declining does not block other Stage 2 modules | **PASS** |
| API PATCH bypass without Yes | **PASS** (rejected) |
| Withdrawal (Yes → Not now) clears sensitive draft keys | **PASS** |
| Submit without Yes | **PASS** (blocked) |
| Compare / privacy gate | **PASS** |
| Direct module URL for declined participant | **PASS** (page loads; content gated) |
| Learn page (mobile-friendly route) | **PASS** |
| Counselor journey API | **PASS** |

**Submitted read-only on staging:** Full submit requires completing the large intimacy bank; **unit tests** assert `applyAssessmentDraftPatch` / server reject patches after submit (`test:marriage:intimacy-consent` + hub submission tests). Staging spot-check did not complete a full submit (validation); treat as **PASS (automated)** / **SKIP (staging E2E submit)**.

---

## 5. Production safety

| Check | Verdict |
|-------|---------|
| Production Neon / counseling data | **PASS** — not modified |
| Production Stage 2 / intimacy flags | **PASS** — not enabled |
| PR #28 merged to `main` | **NOT DONE** (as requested) |

---

## Overall verdict

| Scope | Verdict |
|-------|---------|
| **Stage 2 + Module 6 consent (code quality)** | **PASS** |
| **Staging acceptance (with temporary intimacy flag)** | **PASS** |
| **Production release of Stage 2** | **NOT APPROVED** — await merge of PR #28 (+ integration) to `main`, production migration plan, and explicit production intimacy flag after Senior Pastor sign-off recorded in ops |

**Recommendation:** Safe to proceed toward production **after** leadership merges the integration stack to `main`, completes Neon backup + migration on production, and enables Stage 2 + intimacy flags on production in a controlled change window.
