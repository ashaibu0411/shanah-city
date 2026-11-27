# Hotfix: mobile bottom nav + notification clearing

**Branch:** `hotfix/mobile-nav-notifications` (from `origin/main` — not PR #163)

## Root causes

### Bottom navigation

The tab bar was `position: fixed` but rendered inside the app shell tree, so on some mobile scroll containers (iOS Safari / installed PWA) it could scroll off-screen or sit under transformed ancestors. It also stayed visible over the software keyboard.

### Notifications

1. **Clear all** only called `markFeedsRead` + `markPushInboxRead` — direct messages, group chats, and per-feed items stayed unread; badge totals did not drop to zero.
2. **Tapping a notification** used fire-and-forget `fetch` for push items without `notifyNotificationsChanged()` or badge sync; feed items marked the entire feed read via a stale client path.
3. **Failed API refresh** reset the client summary to zero, masking real unread counts after errors.

## Fixes

- Portal `MobileNav` to `document.body` with `app-mobile-bottom-nav--dock` (fixed viewport, z-index 55, safe-area, GPU layer).
- `AppMobileKeyboardDock` hides the dock while an input has focus (keyboard open); immersive overlays unchanged.
- Server `notification-actions-server.ts`: `dismissNotificationItem`, `clearAllMemberNotificationsWithBadge` (feeds, push, all DM threads, all group chats).
- API: `clearAll`, `markAllAsRead`, `dismissItem`; legacy `clearAllFeeds` maps to full clear.
- Bell UI: await dismiss + refresh; **Mark all read** + **Clear all**; badge hidden when `total === 0`.
- `advanceFeedReadWatermark` for feed-type items so one tap decreases the correct slice where possible.
- Message unread badge on **More** tab when DMs/group chat are unread.

## Verification

```bash
npx tsx scripts/app-notifications-lifecycle.test.ts
npm run build
npm run test:app:nav
```

Manual: signed-in mobile — scroll long pages (home, messages, calendar); confirm tab bar stays fixed; open a text field and confirm nav hides until blur. Notification bell: read one, clear one, mark all, clear all, hard refresh.

## Limitations

- **Ministry report due** notifications remain until the report is submitted or returned item is addressed (action items, not inbox clears).
- Cross-device sync relies on existing polling/focus refresh (30s); no new WebSocket channel.
- Physical device QA (iPhone Safari, Android Chrome, PWA) required before production merge.