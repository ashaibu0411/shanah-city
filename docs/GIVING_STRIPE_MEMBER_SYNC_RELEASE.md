# Giving Stripe member sync — production release (PR #51)

## Migration sequencing (required)

Migration: `prisma/migrations/20261108200000_giving_stripe_member_sync_audit`

Tables: `GivingStripeMemberSyncRun`, `GivingStripeMemberSyncReview`

1. **Before or during deploy (not after traffic):** run `npx prisma migrate deploy` against **production** Postgres (direct/unpooled URL recommended).
2. **Vercel production:** `npm run build` may run `prisma migrate deploy` when `DATABASE_URL` / direct URL is set (see `scripts/build-steps.cjs`). **Do not rely on preview builds** — they never migrate.
3. **Validate without printing secrets:**
   - Offline: `node scripts/validate-giving-stripe-sync-migration.cjs`
   - With DB: `DATABASE_URL=… node scripts/validate-giving-stripe-sync-migration.cjs --check-db`  
     (logs hostname + database name only)

If migration is not applied, audit/cooldown queries fail closed: sync still runs, audit rows are skipped (missing-table handling).

## Runtime behavior

| Trigger | Mechanism |
|---------|-----------|
| Sign-in / sign-up | `after()` (`giving-stripe-member-sync-after.ts`) — bounded 14s; login response is not blocked |
| Profile → Your giving | `GET /api/giving/history` — **DB-first JSON**, then `after()` Stripe recovery; existing records return even when Stripe fails |

## Post-deploy smoke

1. Member sign-in → open Profile → Your giving (polls up to ~25s if post-auth sync is still running).
2. Finance: `GET /api/admin/giving/diagnostic?days=90` — `openMemberSyncReviews` for metadata conflicts.

No bulk financial backfill in this release.

## October 2026 missing-history incident (read-only)

**Symptoms:** Paid Stripe activity not appearing on Profile → Your giving while other members’ October `GivingRecord` rows exist church-wide.

**Root causes addressed (code, not data):**

1. **Subscription checkout** — `mode: subscription` sessions are not one-time gifts; paid amounts belong on **`invoice.payment_succeeded`** / paid invoices. Member sync now reports `subscription_checkout_use_invoice` instead of lumping into `not_paid`.
2. **Invoice discovery window** — Stripe `invoices.list` filters on `created`, not `paid_at`. Sync and global reconcile widen the `created` lookback and filter on **paid-at** so subscription cycle invoices paid in-window are eligible.

**Finance review (no automatic writes):**

- `GET /api/admin/giving/reconcile/member?memberUserId=…&since=2026-10-01&until=2026-10-31` — redacted per-payment report (skip reason, DB state, proposed secure linkage, `stripeScan.truncated` if page caps hit). Requires valid `since`/`until` (≤366 days). Paid windows use Stripe `paid_at` only — `paid_at_unknown` → manual review.
- After deploy: confirm eligible rows, then apply only via existing `POST /api/admin/giving/reconcile` with explicit `sessionIds` / `invoiceIds` and `APPLY_STRIPE_GIVING_BACKFILL`.
- Local CLI: `node scripts/load-env-and-probe.cjs` (requires valid production `DATABASE_URL` + `STRIPE_SECRET_KEY`).
