# Giving incident: `pi_3URO4j…` (Oct 2026)

## Verified production facts (read-only)

| Source | Finding |
|--------|---------|
| **Neon `shanah-city-db`** | Member `user-1786578251521` (`zaqnombre@yahoo.com`) linked Stripe customer `cus_VR8r4k73xPRJp5`. |
| **GivingRecord** | Only two owned Stripe gifts (Aug/Sep 2026, $25 each). **No** October 2026 row. |
| **Stripe (dashboard)** | `pi_3URO4jLmBWhgE7VM1r0q61Kx` **succeeded** 2026-10-22 ~07:24 (ACH); initiated 2026-10-16; gross **$75.60** ($75 offering + $0.60 fee); donor name/email match member; **PaymentIntent.metadata empty** (Checkout metadata lives on **Session**, not PI). |

### PI → Checkout linkage (live Stripe proof — PR #54 review, read-only)

| Field | Verified (live) |
|-------|-----------------|
| PaymentIntent | `pi_3URO4jLmBWhgE7VM1r0q61Kx` — `succeeded`, 7560 USD cents, `customer=null`, ACH |
| Checkout Session | `cs_live_b11H0HstqRpM0Y75dQGBXSFsnfAuaitgjeImefYHljAc2TKfCn02v72ZGX` — `payment_status=paid`, `customer=null` |
| Ownership pointers | **Both** `client_reference_id` and `metadata.userId` = `user-1786578251521` (member linked customer `cus_VR8r4k73xPRJp5` not on Session/PI) |
| Amounts | `metadata.giftAmount=75`, `metadata.feeAmount=0.6`, `amount_total=7560` |
| Success events | `payment_intent.succeeded` Unix **1792675443**; `checkout.session.async_payment_succeeded` Unix **1792675444** (2026-10-22 UTC) |

Ops command: `PAYMENT_INTENT_ID=pi_3URO4jLmBWhgE7VM1r0q61Kx npx tsx scripts/giving-incident-pi-probe.ts` (production key only).

## Root cause (code + sync metrics)

1. **Webhook gap (primary)** — Handler only recorded gifts on `checkout.session.completed` / `checkout.session.async_payment_succeeded`. It did **not** handle `payment_intent.succeeded`. For ACH, if async Checkout events were missed, delayed, or not subscribed in the Stripe dashboard, **`payment_intent.succeeded` alone would not create a `GivingRecord`**, while PaymentIntent still shows **succeeded**.

2. **PI metadata is not used** — `recordGiftFromCheckoutSession` requires **Checkout Session** metadata (`fund`, `giftAmount`, …). Empty PI metadata is expected; recording must resolve the Session via `checkout.sessions.list({ payment_intent })`.

3. **Customer-scoped recovery missed the paid gift** — `GivingStripeMemberSyncRun` metrics (2026-11-09/10) show `scannedCheckoutSessions: 1`, **`paidCheckoutSessions: 0`**, `skippedByReason.not_paid`. The customer-scoped session list saw a session in the window but **not** the paid $75.60 checkout (wrong row and/or session not listed under the linked customer at sync time). **PaymentIntent rows** in finance reconcile were informational only (`payment_intent_requires_session_or_invoice_match`) and did not drive recovery.

4. **Church-wide dry-run blind spot** — `reportMissingStripeGifts` **skipped** paid checkouts with `success_date_unknown` (common for ACH without a listable Event), so finance backfill lists could omit this gift even when Session metadata was valid.

5. **Return-path UX** — `/give/success` calls `/api/giving/confirm` once; ACH returns **409** while processing and is **not retried** when the bank settles days later.

## PR #54 review fixes

- Live webhooks use signed `event.created` when Events.list is unavailable; Events.list timestamps still preferred when listable.
- Guest Checkout gifts record with `userId=null` (no email-only member assignment).
- ACH trusted dates only from `payment_intent.succeeded` / `checkout.session.async_payment_succeeded` (not replayed `checkout.session.completed`).
- Finance recovery still requires Events.list success date (no Checkout.created, no webhook fallback).
- **October $75 gift:** no automated recovery/backfill in this PR.

## Safeguards (follow-up PR)

- Corroborated `client_reference_id` / `metadata.userId` required (not customer-only).
- Gift amount from metadata or itemized line items — never gross $75.60 as gift.
- No `session.created` as `givenOn` when success timestamp unverified.
- Recovery API returns **503** until `GivingStripeGiftRecoveryAudit` migration is applied.
- Recovery record + audit in a single DB transaction.

## Targeted recovery (Finance POST only — not auto-run)

Use **Finance** `POST /api/admin/giving/recover/checkout` with:

- `confirm: "RECOVER_VERIFIED_CHECKOUT_GIFT"`
- `memberUserId` + `stripeSessionId` (`cs_…`) from Stripe (resolve via `checkout.sessions.list({ payment_intent })` when needed)

**Ownership checks (fail-closed):**

- Session `payment_status === paid`, Shanah metadata (`fund` + `giftAmount`)
- When `session.customer` is set: must match member `stripeCustomerId` plus corroborated `client_reference_id` or `metadata.userId`
- When `session.customer` is null: **both** `client_reference_id` and `metadata.userId` must match the member (no customer-only assignment)
- Member history sync does **not** scan or auto-record customerless checkouts

**Amounts:** persist **$75** gift from `metadata.giftAmount`; fee remains in notes (`feeAmount` / `coverFees`).

**Audit:** `GivingStripeGiftRecoveryAudit` row per attempt (immutable).

## Code fixes (this PR branch)

- `payment_intent.succeeded` webhook → Session lookup → `recordGiftFromCheckoutSession`
- Member history sync: succeeded PaymentIntents → Session → verified record path
- Reconcile dry-run includes paid Shanah sessions with unverified success dates
- Finance targeted recovery API + audit table
- PI probe script for operations
