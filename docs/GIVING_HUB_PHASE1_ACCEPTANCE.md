# Giving Hub Phase 1 — acceptance

## Scope delivered

- **Giving Hub UI** on `/give` with Stripe Checkout (unchanged), verified alternative methods from DB, and donor recurring guide (Stripe portal; ACH standalone deferred).
- **Admin-configurable methods** (`GivingHubPaymentMethod`) with Finance **verify** before publish.
- **Seed recipients (unverified):** Zelle `finance@shanahcityt.org`, Cash App `shanahcenter` — disabled and unpublished until Finance verifies on `/admin/finance`.
- **Off-platform workflow:** signed-in donors notify Finance (`GivingHubOffPlatformIntent`); Finance reviews in API/admin — **no auto `GivingRecord` writes**.
- **Unified history:** `GET /api/giving/history` includes `GivingRecord` rows plus `offPlatformIntents`.

## Preserved

- Stripe webhooks, recovery, customer-null rules, member sync (no customerless backfill).

## Production deploy

1. Apply migration `20261110130000_giving_hub_phase1`.
2. Finance verifies Zelle/Cash App recipients, then publishes.
3. October $75 recovery remains explicit Finance `POST /api/admin/giving/recover/checkout` after verify — not automated here.
