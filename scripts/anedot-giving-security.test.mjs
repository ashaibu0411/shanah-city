import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();

const webhookRoute = readFileSync(
  join(root, "src/app/api/giving/webhook/anedot/route.ts"),
  "utf8",
);
assert.match(webhookRoute, /anedotWebhookAccepting/);
assert.doesNotMatch(webhookRoute, /console\.log\(.*secret/i);
assert.match(webhookRoute, /request\.text\(\)/);

const intentRoute = readFileSync(join(root, "src/app/api/giving/anedot/intent/route.ts"), "utf8");
assert.match(intentRoute, /anedotPublicCheckoutAvailable/);
assert.doesNotMatch(intentRoute, /ANEDOT_WEBHOOK_SECRET/);

const panel = readFileSync(join(root, "src/components/give/GiveAnedotPanel.tsx"), "utf8");
assert.doesNotMatch(panel, /card number|routing number|account number/i);

const stripeWebhook = readFileSync(join(root, "src/app/api/giving/webhook/route.ts"), "utf8");
assert.match(stripeWebhook, /stripe-signature/);

console.log("anedot-giving-security.test.mjs OK");
