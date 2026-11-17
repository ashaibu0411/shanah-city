# Vision Center 2027 — installed-app deep links

## Goal
When a leader taps a private Vision Center proposal link in WhatsApp, Messenger, SMS, or email, the installed Shanah City app should open the exact plan, where the operating system and messaging app permit verified app links.

## Changes
- iOS: existing associated domain `applinks:shanah-city.vercel.app` now recognizes `/leadership/vision/*` in the hosted AASA file. Requires the AASA file to be served as valid JSON at `/.well-known/apple-app-site-association` without redirects.
- Android: added an `android:autoVerify` HTTPS intent filter scoped to `/leadership/vision/`. Existing `/.well-known/assetlinks.json` must return the **real Google Play signing certificate fingerprint** for `org.shanahcity.app`.
- Capacitor: native link handler now accepts exact, trusted-origin Vision Center plan paths (cold and warm launches), while preserving Story links.
- Server-side auth and Vision Center invitations remain unchanged. Signed-out users authenticate *inside the native app* and return to the plan; unassigned users see the access gate.

## Release / acceptance requirements
1. Verify `/.well-known/apple-app-site-association` returns valid JSON (200; no redirects) and that its appID matches the shipping iOS signing team and bundle identifier.
2. Verify `/.well-known/assetlinks.json` returns 200 and contains the production **Play App Signing** SHA-256 certificate fingerprint; never use a guessed fingerprint.
3. Run `npx tsx scripts/vision-center-native-deep-links.test.ts`, `npm run build`, and existing Story-link regression tests.
4. Build/release an updated Android binary with the new manifest; an ordinary Vercel deploy **cannot** update Android intent filters in already-installed apps.
5. Confirm iOS app entitlement and test association on an installed iPhone app. iOS app update may be necessary if the current binary is missing the correct entitlement; it is present in the repository.
6. Test cold and warm launches from WhatsApp and Messenger on iOS/Android with an **assigned** account, an unassigned account, and a signed-out account.
7. Verify exact-plan navigation, session retention, sign-in return, feedback submission, and prior Story-link behavior.
8. On devices / messaging apps that decline to open installed apps, retain browser fallback; OS and messaging app policies cannot be overridden.

**Do not expose draft proposal content or bypass existing Vision Center access restrictions.**

## Release readiness findings (2026-11-16)

- Production Vercel project `shanah-city`: `ANDROID_APP_LINK_SHA256_CERT_FINGERPRINTS` **is not configured**. Retrieve the real SHA-256 from Google Play Console → App integrity → App signing key certificate and set the production environment variable before verifying Android App Links.
- Apple repository entitlement declares `applinks:shanah-city.vercel.app` and hosted association file declares `S4MRT53FN9.org.shanahcity.app`; verify the actual shipped signing team/profile and live HTTP response (200, correct JSON, no redirects) on an iPhone.
- GitHub Actions workflows `.github/workflows/android-play-store.yml` (push to main → internal testing) and `.github/workflows/ios-testflight.yml` (push to main → TestFlight) exist, but this branch is not merged; no store binaries have been released from this change.
- Native app link activation needs real installed-app tests (iOS and Android; WhatsApp and Messenger; signed-in/out/assigned). OS/messenger-controlled in-app browsers may still require fallback.
- Do not promote Android to Play production or iOS to App Store until release acceptance passes.
