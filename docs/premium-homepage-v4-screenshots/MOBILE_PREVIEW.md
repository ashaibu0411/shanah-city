# V4.1 mobile owner preview (390px & 430px)

Use the **PR #163** Vercel preview (login if Deployment Protection prompts).

**Base URL:** https://shanah-city-git-feature-premium-52bda4-zaqnombre-9816s-projects.vercel.app

## Vercel Deployment Protection and console 403s

Preview hosts sit behind [Vercel Deployment Protection](https://vercel.com/docs/security/deployment-protection). The **first** document request (`/`) succeeds after you sign in to Vercel SSO, but **Next.js link prefetch** fires background `GET` requests with `RSC: 1` / `Next-Router-Prefetch: 1` to routes such as `/calendar`, `/give`, `/sermons`, `/about`, `/check-in`, and `/guest`. Those requests **do not include your SSO session** the same way the top-level navigation does, so protection often answers with **HTTP 403 Forbidden** (or a redirect to Vercel login).

That is **not** app middleware, member auth, or a broken route — it is the preview firewall. It does **not** weaken production security.

**What we did in app code (PR #163):** homepage `Link` components on the V4.1 app home use `prefetch={false}` so protected previews do not spam failing RSC prefetches. Normal taps still navigate correctly after SSO.

**Owner review options:**

1. Sign in to Vercel when opening the preview (required for any protected URL).
2. Use a [protection bypass](https://vercel.com/docs/security/deployment-protection/methods-to-bypass-deployment-protection/protection-bypass-automation) header or share link from the project owner (`VERCEL_AUTOMATION_BYPASS_SECRET` in CI / screenshot scripts).
3. Expect fewer 403s after the prefetch fix lands on the preview deployment you are reviewing.

Unauthenticated `curl` to the preview returns `302` → `vercel.com/sso-api`, not the app.

## Touch / scroll console warnings

Chrome may log `[Intervention] Unable to preventDefault inside passive event listener` for `touchmove` when **pull-to-refresh** is active at scroll top (`PullToRefresh.tsx`). That is expected mobile-browser behavior; scrolling the home feed is unaffected when you are not pulling down from the top.

## Fast paths

| Review target | 390px | 430px |
|---------------|-------|-------|
| Public website home | [Open `/church-site`](https://shanah-city-git-feature-premium-52bda4-zaqnombre-9816s-projects.vercel.app/church-site) — set devtools device to iPhone 12/13 | Same URL — set devtools to iPhone 14 Pro Max width **430** |
| App home (signed out) | [Open `/`](https://shanah-city-git-feature-premium-52bda4-zaqnombre-9816s-projects.vercel.app/) in incognito after Vercel SSO | Same, viewport **430×932** |
| App home (signed in) | Sign in on preview, then `/` at 390 | Sign in, then `/` at 430 |

## Chrome DevTools

1. Open the link above and complete Vercel SSO if prompted.
2. Toggle device toolbar (`Ctrl+Shift+M`).
3. Choose **390×844** or enter custom **430×932**.
4. Hard refresh (`Ctrl+Shift+R`).
5. Toggle **light/dark** via the app theme control (app) or system preference (website).

## Committed PNG captures

Regenerated PNGs live beside this file (`app-mobile-light-390-signed-out.png`, `app-mobile-light-430-signed-out.png`, etc.). Regenerate locally or against preview:

```bash
# Local dev
node scripts/capture-premium-v41-screenshots.mjs http://localhost:3010

# Protected preview (set secret in env — never commit)
VERCEL_AUTOMATION_BYPASS_SECRET=*** node scripts/capture-premium-v41-screenshots.mjs https://<preview-host>
```

## App store image (after approval)

When the authenticated V4.1 app home is approved, replace `ChurchSiteHome` app promo image from legacy `01-home-1284x2778.png` to the approved capture (see PR notes). **Do not swap until owner sign-off.**