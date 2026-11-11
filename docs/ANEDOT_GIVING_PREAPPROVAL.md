# Anedot giving integration — underwriting-pending implementation

Status: **PRE-APPROVAL PREPARATION, NOT LIVE**. Shanah City's Anedot application is pending underwriting (submitted November 10, 2026). Do not expose an Anedot giving button or accept webhooks into the confirmed-giving ledger yet.

## Provider-confirmed capabilities
- Hosted donation Action Page with one-time and recurring ACH, debit/credit card, PayPal, Apple Pay and Google Pay.
- Church/nonprofit pricing confirmed in direct support response: ACH 0.3% + $0.30 and cards/wallets 3.3% + $0.30, subject to account approval.
- Anedot hosted Share URL and QR code. Use **hosted URL** instead of iframe by default: Anedot warns iframe can affect mobile payments and disables some wallets.
- Event webhooks include `donation_completed`, `donation_settled`, `donation_ach_returned`, `donation_refunded`, `donation_chargeback`, `donation_voided`, and recurring commitment lifecycle events. Webhooks include `X-Request-Signature` HMAC-SHA256; verify on raw request body, in constant time. The provider's official webhook signing specification must be confirmed before implementation.
- Anedot's page URL parameter support includes custom hidden fields. Do **not** trust a visible query-string member id as authenticated donor ownership; use signed server-side gift intents with secure reconciliation and verified webhook payload identifiers.

## Work remaining before release
1. Receive underwriting approval. Church Finance creates the actual Anedot Action Page, enables the desired giving funds, confirms accepted payment methods and recurring frequencies, and supplies an **approved hosted Share URL**. Do not guess the URL.
2. Create a server-side giving-intent identifier bound to the Shanah City member, amount/fund, expiry, and Anedot page, then pass an opaque safe reference through an approved hidden field. Guest donations should remain unassigned until verified. Do not match users by email alone.
3. Verify signed webhook on raw body using secret stored only in Vercel server environment. Limit payload size; reject invalid signatures, wrong account/page, unknown events, missing money details, and unmatched member references.
4. Durable Anedot event/transaction ledger with UNIQUE provider donation ID and idempotent processing. Preserve all events and transitions; `donation_completed` may precede actual ACH settlement. Only count a gift as confirmed on provider-verified successful settlement under an explicit policy. Handle return, refund, chargeback, void; do not leave reversed gifts in tax statements.
5. Map Anedot fund IDs to allowed Shanah City fund names using a Finance-controlled allowlist. Reconcile gift versus donor-covered fees, cents currency handling, recurring plan id, donation and settlement date and reference, member or guest ownership.
6. Confirmed GivingRecord and audit must be created/updated atomically and safely, without touching Stripe records. Historical backfills require Finance authorization.
7. Add a separate checkout selection in `/give`, with existing Stripe and Zelle/Cash App unchanged. When Anedot is not enabled, do not display placeholder or broken checkout.
8. Automated tests: invalid/empty HMAC, replay/duplicate delivery, conflicting owner/fund, ACH processing-to-settled-to-returned, refund/chargeback, split fees, duplicate recurring callbacks, and guest donations. Run build and existing giving suite without manual staging rounds.
9. After signing/ledger verification and underwriting approval, set approved Vercel secrets: `ANEDOT_ACTION_PAGE_URL`, `ANEDOT_WEBHOOK_SECRET`, `ANEDOT_ACCOUNT_APPROVED=true`, `ANEDOT_LEDGER_INTEGRATION_READY=true`; set `ANEDOT_GIVING_ENABLED=true` only after all previous checks. Do not print secrets in logs.

## Current commit scope
`src/lib/anedot-activation.ts` is a **fail-closed, standalone preparation helper**. It is not wired into `/give`, does not process webhooks, and is not sufficient to activate payments. The production Anedot integration is not complete.

Provider references:
- https://www.anedot.com/anedot-answers
- https://help.anedot.com/knowledge/share-an-action-page
- https://help.anedot.com/knowledge/url-parameter
- https://help.anedot.com/knowledge/campaign-nucleus

Link related task: https://github.com/ashaibu0411/shanah-city/issues/57 (provider changed from Helcim to Anedot after Helcim declined).
