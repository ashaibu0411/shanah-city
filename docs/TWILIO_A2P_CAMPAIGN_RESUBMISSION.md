# Twilio A2P 10DLC — campaign CM1d112aec97f24792a1064965d7df4ff2 (rejection 30909)

## Public URLs (production)

| Resource | URL |
|----------|-----|
| Dedicated SMS opt-in form | https://shanahcity.org/sms-consent |
| Privacy Policy | https://shanahcity.org/privacy |
| Terms & Conditions | https://shanahcity.org/terms |
| Guest form (optional SMS checkbox, separate) | https://shanahcity.org/guest |

All pages are public: no sign-in, no app install, no member shell.

## Enabled opt-in methods (message flow text for Twilio)

Copy for campaign **message flow** field:

```
1. Website form (primary): End users visit https://shanahcity.org/sms-consent, enter name and US mobile number, and affirmatively check an optional unchecked-by-default SMS consent checkbox with full disclosure. Privacy Policy and Terms links appear beside the disclosure. Submit records consent in SmsConsentEvent (phone, timestamp, source sms-consent-page, disclosure version 2026-11-27). This form does not create guest visit records.

2. Guest connection form (secondary, optional): On https://shanahcity.org/guest, users may optionally check a separate unchecked-by-default SMS consent checkbox while submitting guest information. SMS consent is not required to submit the guest form. When checked, consent is recorded in the same SmsConsentEvent audit log with source guest-web-form.

3. In-person (documented): Welcome team may offer a connection card or tablet with the same optional unchecked SMS checkbox and disclosure. Staff enter affirmative opt-ins only when the attendee checks the box. Verbal-only opt-in is not used.

4. Carrier keywords: Subscribers may text HELP for assistance or STOP to unsubscribe. START/UNSTOP may re-enable after a prior STOP via carrier keyword handling on the Twilio inbound webhook.

Outbound marketing/campaign SMS remains disabled in production until campaign approval (SMS_SENDING_ENABLED is not set to true).
```

## Consent disclosure (exact checkbox language)

See `src/lib/sms-consent-copy.ts` — version `2026-11-27`.

## Technical notes

- Consent store: `SmsConsentEvent` + `SmsContactState` (opt-out suppression)
- No duplicate database; dedicated API `POST /api/sms-consent`
- `SMS_SENDING_ENABLED` must remain unset/false until approval