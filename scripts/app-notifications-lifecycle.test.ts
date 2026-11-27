import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();

const api = readFileSync(join(root, "src/app/api/notifications/route.ts"), "utf8");
assert.match(api, /clearAllMemberNotificationsWithBadge/);
assert.match(api, /dismissNotificationItem/);
assert.match(api, /action === "markAllAsRead"/);

const actions = readFileSync(join(root, "src/lib/notification-actions-server.ts"), "utf8");
assert.match(actions, /markAllDirectThreadsRead/);
assert.match(actions, /markAllGroupChatsRead/);
assert.match(actions, /advanceFeedReadWatermark/);

const client = readFileSync(join(root, "src/lib/notification-client.ts"), "utf8");
assert.match(client, /dismissNotificationItem/);
assert.match(client, /notifyNotificationsChanged/);

const bell = readFileSync(join(root, "src/components/notifications/NotificationBell.tsx"), "utf8");
assert.match(bell, /dismissNotificationItem\(item\)/);
assert.doesNotMatch(bell, /markPushRead.*ids:\[item\.id\]/);

const nav = readFileSync(join(root, "src/components/app/MobileNav.tsx"), "utf8");
assert.match(nav, /createPortal/);
assert.match(nav, /app-mobile-bottom-nav--dock/);

console.log("app-notifications-lifecycle.test.ts OK");