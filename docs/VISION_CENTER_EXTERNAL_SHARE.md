# Vision Center 2027 — External sharing

## Behavior

- **Share Vision** appears on every ministry vision page (`/leadership/vision/[planId]`) for users who can already read the proposal (Senior Pastor or invited assignees).
- **Canonical URL:** `https://<host>/leadership/vision/<planId>` (legacy `?plan=` on `/leadership/vision` still redirects).
- **Web Share API** on supported mobile browsers; **Copy link** and **Copy invitation** fallbacks on desktop or when `navigator.share` is unavailable.
- **No access grant on share.** Unsigned users → sign-in with `next=`. Signed-in users without an assignment → **Vision proposal access** gate (no document body or comments).
- Approval status and pastoral workflows are unchanged.

## Manual verification checklist

- [ ] Master Vision (`churchwide`): Share Vision, native share sheet (iOS Safari / Android Chrome), copy link, copy invitation.
- [ ] Men's, Women's, Young Adults, Worship, Kids, and remaining ministry plans: same share panel visible on each dedicated page.
- [ ] Authorized recipient: open link → sign in if needed → full proposal → submit comment/feedback → “Saved.” confirmation.
- [ ] Unauthorized recipient: open link → sign in → access gate (no leak of draft text).
- [ ] Deep link after sign-in lands on the same `planId`, not the hub home.
- [ ] Pastoral assign + invite flow unchanged; sharing does not auto-approve or publish.

## Automated

```bash
npm run test:vision:phase1
```

Includes `scripts/vision-center-share.test.ts` for URL/invitation copy and UI wiring regressions.