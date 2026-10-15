# Vercel staging — Marriage Counseling Hub (Phase 2B acceptance)

Use this guide to test **Stage 2 marriage counseling** without changing **production** (`https://shanah-city.vercel.app`) or using **production member data**.

---

## What the repo already does

| Piece | Behavior |
|-------|----------|
| **Production deploy** | Vercel Git integration on `main`, plus optional GitHub Action [`.github/workflows/vercel-production.yml`](../.github/workflows/vercel-production.yml) (deploy hook secret `VERCEL_DEPLOY_HOOK`). |
| **Build** | [`scripts/build.cjs`](../scripts/build.cjs) runs `prisma migrate deploy` when `DATABASE_URL` is set, then `next build`. |
| **Stage 2** | Controlled only by env vars ([`src/lib/marriage-stage2-feature.ts`](../src/lib/marriage-stage2-feature.ts)). Off by default if unset. |
| **Intimacy module** | Hidden unless `MARRIAGE_HUB_STAGE2_INTIMACY_APPROVED=1` — **never set on staging** until pastoral sign-off. |

**We do not store production secrets in git.** You configure staging entirely in Vercel + Neon dashboards.

---

## Recommended approach: **dedicated Vercel project** (safest)

**Why not only “Preview” URLs?**

- Preview URLs change per branch/PR and are easy to share by mistake.
- Preview often inherits confusing mixes of env vars unless you are strict about scopes.

**Why a second project?**

- Stable URL (e.g. `https://shanah-city-staging.vercel.app`).
- **Production** environment on *that* project = your staging site.
- The live church app project keeps its own **Production** env vars untouched.
- You can enable Deployment Protection on staging without affecting members.

### Alternative (OK for developers, weaker for owners)

**Long-lived Preview** on branch `staging` in the *same* Vercel project, with Stage 2 vars scoped to **Preview only** (never **Production**). Requires **Vercel Deployment Protection** so random visitors cannot open preview URLs. Still shares one project with production — easier to misconfigure.

**Recommendation:** separate project **`shanah-city-staging`**.

---

## Part A — Neon: separate PostgreSQL (no production data)

Do **not** clone or restore production into staging unless leadership explicitly authorizes a sanitized copy.

1. Log in to [Neon](https://neon.tech) (or your Postgres provider).
2. **Create a new project** (e.g. `shanah-city-staging`). Do not use “branch from production” if that copies data.
3. Open the new project → **Connection details**:
   - Copy the **pooled** connection string → will be staging `DATABASE_URL`.
   - Copy the **direct** (non-pooler) string → staging `DIRECT_URL` (recommended for migrations).
4. On your PC (with the staging URLs in a local file — see [`.env.staging.example`](../.env.staging.example)), run once:

   ```bat
   npm.cmd run db:deploy
   ```

   (Point your shell at staging URLs only; do not use production `.env` for this step.)

5. Confirm: empty database, all migrations applied, **zero production member rows**.

---

## Part B — Vercel: create staging project (do not edit production env)

### 1. New project

1. Vercel → **Add New… → Project**.
2. Import the **same GitHub repo** as production.
3. Name: **`shanah-city-staging`** (or similar).
4. **Production Branch:** `staging` (create this branch in GitHub first — see Part C).
5. Finish import **without** copying production environment variables from the live project (use “Configure manually” if offered).

### 2. Environment variables (staging project only)

Open **shanah-city-staging → Settings → Environment Variables**.

Set scope **Production** only (on this staging project, “Production” means the staging site).

| Variable | Staging value | Notes |
|----------|---------------|--------|
| `DATABASE_URL` | Staging Neon **pooled** URL | Never production. |
| `DIRECT_URL` | Staging Neon **direct** URL | Helps migrations on build. |
| `NEXT_PUBLIC_APP_URL` | `https://<your-staging-domain>` | After first deploy, use the real staging URL. |
| `MARRIAGE_HUB_STAGE2_ENABLED` | `1` | **Only on staging project.** |
| `NEXT_PUBLIC_MARRIAGE_STAGE2` | `1` | **Only on staging project.** |
| `MARRIAGE_HUB_STAGE2_INTIMACY_APPROVED` | *(leave unset)* | Keeps intimacy module off. |
| `MARRIAGE_CURRICULUM_ADMIN_USER_IDS` | Your test admin user id(s) | Comma-separated app user ids. |
| `MARRIAGE_COUNSELOR_USER_IDS` | Counselor test user id(s) | Optional for counselor checklist. |

Copy **non-marriage** vars from production only as needed for login (e.g. auth/session secrets, `CRON_SECRET` if you test crons — use **new** values where possible). Use **test** Stripe keys on staging if you touch giving.

**Do not** add Stage 2 flags to the **shanah-city** (live) project’s **Production** environment.

### 3. Verify production is unchanged

1. Open **shanah-city** (live) → Settings → Environment Variables → **Production**.
2. Confirm `MARRIAGE_HUB_STAGE2_ENABLED` and `NEXT_PUBLIC_MARRIAGE_STAGE2` are **absent** or **not** `1`.
3. Confirm `MARRIAGE_HUB_STAGE2_INTIMACY_APPROVED` is **unset**.

### 4. Deploy staging

1. Push branch `staging` (Part C) or click **Deploy** on the staging project.
2. Note the URL: **Settings → Domains** (default `https://shanah-city-staging.vercel.app` if name matches).

### 5. Optional: password-protect staging

Vercel → staging project → **Settings → Deployment Protection** → enable **Vercel Authentication** or password for Production deployments. Recommended so members do not stumble onto unfinished UI.

### 6. Optional: deploy hook + GitHub

If you use the repo workflow [`.github/workflows/vercel-staging.yml`](../.github/workflows/vercel-staging.yml):

1. Staging project → Settings → Git → **Deploy Hooks** → Create hook for branch **`staging`**.
2. GitHub repo → Settings → Secrets → Actions → **`VERCEL_STAGING_DEPLOY_HOOK`** = hook URL (not the production hook).

---

## Part C — Git: `staging` branch (no production deploy requirement)

Create a long-lived branch that tracks `main` when you want to refresh staging:

```bat
git checkout main
git pull
git checkout -b staging
git push -u origin staging
```

Point the **staging Vercel project’s Production Branch** at `staging`. Merging `main` → `staging` updates staging without enabling Stage 2 on live production.

---

## Part D — Publish Stage 2 curriculum (on staging URL only)

Prerequisites: Stage 2 flags on **staging**; staging DB migrated; curriculum admin user id configured.

1. Sign in on **staging URL** as curriculum admin.
2. Open **`/marriage/admin/curriculum`**.
3. Create draft from seed (or open existing draft) — with Stage 2 enabled, publish **freezes** Modules 1–6 question banks into that version.
4. Click **Publish**; write down the **version label** shown.
5. Start or use a journey that picks up the published version (new premarital journeys use current published content).

Publishing on staging **does not** change production curriculum (separate database).

---

## Part E — Two authorized test accounts

Use **dedicated test accounts** (e.g. staff emails), not real member couples.

| Step | Partner A | Partner B |
|------|-----------|-----------|
| Sign in | Staging URL → `/sign-in` | Same |
| Hub | `/marriage` → start premarital with **partner invite** | `/marriage/join` → enter code |
| Consent | Complete if prompted (`/marriage/consent`) | Same |
| Learning | `/marriage/learn` | Same |

Full walkthrough: [`STAGING_ACCEPTANCE_FOR_OWNERS.md`](./STAGING_ACCEPTANCE_FOR_OWNERS.md).

---

## Pass / fail acceptance (staging)

Use [`STAGING_PASS_FAIL_CHECKLIST.md`](./STAGING_PASS_FAIL_CHECKLIST.md). All items must be **PASS** before Phase 2C implementation.

---

## After staging works

Record:

- **Staging URL:** `https://________________.vercel.app`
- **Curriculum version published:** `________________`
- **Date signed off:** `________________`

Then Phase 2C can begin (implementation still follows [`STAGE_2_PHASE2C_PLAN.md`](./STAGE_2_PHASE2C_PLAN.md)).

**Remaining before Phase 2C:** manual sign-off checklist complete; pastoral copy review for upcoming modules 7–10; keep intimacy flag off until explicit approval.
