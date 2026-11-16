# Shanah City native Story deep links — Store release checklist

## User-facing goal
A WhatsApp message links to `https://shanah-city.vercel.app/community?story=<id>`. After updating to a properly associated **App Store/Play Store** build, tapping the URL on a supported device should launch Shanah City and open that exact Story. People without the app use the authenticated website fallback. Existing 24-hour expiry and group-story permission rules still apply. The app cannot force WhatsApp or a user's OS to choose the native app when the user has overridden link-opening preferences or WhatsApp uses its own browser.

## iOS Universal Links
- Website publishes `/.well-known/apple-app-site-association` with appID `S4MRT53FN9.org.shanahcity.app` and component `/community?story=*`; content-type `application/json`. Apple Developer Team ID is grounded in `ios/App/App.xcodeproj/project.pbxproj`.
- App entitlements include `applinks:shanah-city.vercel.app`. Ensure the App Store distribution provisioning profile enables **Associated Domains** for this bundle identifier, then sign a **new iOS build**. Website deployment alone cannot add an entitlement to an already installed app.
- Verify a real device's fresh install or app update. Apple may cache association; test a link sent from WhatsApp or Notes. A long press on a link may offer Open in Shanah City depending on user preferences.

## Android App Links
- AndroidManifest.xml declares an HTTPS VIEW intent filter with autoVerify=true for host `shanah-city.vercel.app` and path `/community`.
- **REQUIRED RELEASE INPUT:** obtain the SHA-256 fingerprint under **Google Play Console → Release → Setup → App integrity → App signing key certificate** (console navigation can vary). Use **Play App Signing's signing certificate**, not a debug or upload keystore certificate.
- Store this value in Vercel production env var `ANDROID_APP_LINK_SHA256_CERT_FINGERPRINTS` (uppercase colon-delimited SHA-256; comma-separated for multiple Play signing certificates). `/.well-known/assetlinks.json` serves a matching statement only when configured. Until then, that endpoint intentionally returns 503; do not claim Android verified links are live.
- Redeploy production after configuring the variable and check `https://shanah-city.vercel.app/.well-known/assetlinks.json`: HTTPS 200, no redirect, package `org.shanahcity.app`, correct fingerprint.
- Sign and submit a **new Play Store Android build**, because existing installs do not have the new manifest intent filter.
- Validate on device with `adb shell pm get-app-links org.shanahcity.app` (verified host) and an HTTPS story link; Android user settings must permit opening supported links.

## Native runtime
- Global `NativeStoryLinkHandler` handles Capacitor `appUrlOpen` (warm launch) and `getLaunchUrl` (cold launch).
- Strictly accept only the canonical HTTPS host and `/community?story=<safe-id>`; refuse other origins and untrusted paths.
- Navigate inside the existing native WebView to `/community?story=<id>`. Existing site redirects unsigned-in members to `/sign-in?next=...` and the Community Stories viewer selects the matching active Story after login.
- Outbound WhatsApp share always uses the canonical domain instead of an accidental preview or embedded origin.

## QA acceptance on actual Store-distributed apps
1. iPhone installed via App Store, signed in, story active → WhatsApp link opens app and correct Story.
2. iPhone app closed/cold → link opens app and Story.
3. Android installed via Play Store, signed in, verified host → link opens app and correct Story.
4. Recipient logged out → Shanah City sign-in, then exact Story.
5. Expired or deleted Story → clear unavailable message.
6. Recipient without app → normal website fallback.
7. Private group Story link is not externally shareable.
8. Link to other path or untrusted domain is rejected by native Story link handler.
9. WhatsApp Status file export remains a separate feature, subject to media rights.

## Release sequencing
Deploy website association assets first; configure Play signing fingerprint; distribute native app updates through TestFlight / Play Internal Testing; verify on device; then submit new App Store / Play Store versions. No database migration needed.
