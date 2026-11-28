import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();

const api = readFileSync(join(root, "src/app/api/notifications/route.ts"), "utf8");
assert.match(api, /clearAllMemberNotificationsWithBadge/);
assert.match(api, /markAllMemberNotificationsReadWithBadge/);
assert.match(api, /dismissNotificationItem/);
assert.match(api, /action === "markAllAsRead"/);

const actions = readFileSync(join(root, "src/lib/notification-actions-server.ts"), "utf8");
assert.match(actions, /dismissNotificationItems/);
assert.match(actions, /throughAt: item\.at/);
assert.doesNotMatch(actions, /markThreadRead/);
assert.doesNotMatch(actions, /markAllDirectThreadsRead/);
assert.doesNotMatch(actions, /markGroupChatRead/);
assert.match(actions, /markAllMemberNotificationsRead/);
assert.match(actions, /advanceFeedReadWatermark/);

const server = readFileSync(join(root, "src/lib/notification-server.ts"), "utf8");
assert.match(server, /getDismissedNotificationWatermarks/);
assert.match(server, /isNotificationItemDismissed/);
assert.match(server, /getRawAppNotificationItems/);

const client = readFileSync(join(root, "src/lib/notification-client.ts"), "utf8");
assert.match(client, /dismissNotificationItem/);
assert.match(client, /notifyNotificationsChanged/);

const bell = readFileSync(join(root, "src/components/notifications/NotificationBell.tsx"), "utf8");
assert.match(bell, /dismissNotificationItem\(item\)/);
assert.doesNotMatch(bell, /markPushRead.*ids:\[item\.id\]/);

const nav = readFileSync(join(root, "src/components/app/MobileNav.tsx"), "utf8");
assert.match(nav, /createPortal/);
assert.match(nav, /app-mobile-bottom-nav--dock/);

const schema = readFileSync(join(root, "prisma/schema.prisma"), "utf8");
assert.match(schema, /model NotificationDismissal/);

console.log("app-notifications-lifecycle.test.ts OK");