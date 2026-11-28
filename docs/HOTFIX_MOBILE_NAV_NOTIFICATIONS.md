# Hotfix: mobile bottom nav + notification clearing

**Branch:** `hotfix/persistent-nav-notification-sync` (from `origin/main` — not PR #163)

## Root causes

### Bottom navigation

The tab bar was `position: fixed` but rendered inside the app shell tree, so on some mobile scroll containers (iOS Safari / installed PWA) it could scroll off-screen or sit under transformed ancestors. It also stayed visible over the software keyboard.

### Notifications

1. **Clear all** only called `markFeedsRead` + `markPushInboxRead` — direct messages, group chats, and per-feed items stayed unread; badge totals did not drop to zero.
2. **Tapping a notification** used fire-and-forget `fetch` for push items without `notifyNotificationsChanged()` or badge sync; feed items marked the entire feed read via a stale client path.
3. **Failed API refresh** reset the client summary to zero, masking real unread counts after errors.
4. **Clear all** (first pass) marked every DM and group thread read, which cleared Messages unread while the member had not opened the conversations.

## Fixes

- Portal `MobileNav` to `document.body` with `app-mobile-bottom-nav--dock` (fixed viewport, z-index 55, safe-area, GPU layer).
- `AppMobileKeyboardDock` hides the dock while an input has focus (keyboard open); immersive overlays unchanged.
- Server-persisted `NotificationDismissal` (Prisma + JSON fallback) keyed by `item.id` with a `dismissedThroughAt` watermark so newer DM/group activity resurfaces in the bell.
- `dismissNotificationItem` — push marks inbox read; DM/group/ministry dismiss from the bell only; feeds use `advanceFeedReadWatermark`.
- **Mark all read** — feeds + push only (`markAllMemberNotificationsRead`).
- **Clear all** — mark all read plus dismiss all conversation rows from the bell without `markThreadRead`.
- `getAppNotifications` filters dismissed items; `directMessages` / `groupChat` counts stay true thread unread for the **More** tab badge; bell `total` reflects visible rows only.
- Bell UI: await dismiss + refresh; **Mark all read** + **Clear all**; badge hidden when `total === 0`.
- Legacy `clearAllFeeds` maps to full clear.

## Verification

```bash
npx tsx scripts/app-notifications-lifecycle.test.ts
npm run build
npm run test:app:nav
```

Manual: signed-in mobile — scroll long pages (home, messages, calendar); confirm tab bar stays fixed; open a text field and confirm nav hides until blur. Notification bell: read one, clear one, mark all, clear all, hard refresh — confirm Messages unread unchanged after clear all.

## Limitations

- **Ministry report due** notifications return after dismiss until the report is submitted (dismissal is stored; new cycles may surface new ids).
- Cross-device sync relies on existing polling/focus refresh (30s); no new WebSocket channel.
- Physical device QA (iPhone Safari, Android Chrome, PWA) required before production merge.