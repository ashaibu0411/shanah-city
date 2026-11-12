import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import path from "node:path";

const pushSrc = readFileSync("src/lib/push-server.ts", "utf8");
assert.match(pushSrc, /function configureWebPush/);
assert.match(pushSrc, /catch \{[\s\S]*return false/);
assert.match(pushSrc, /isNativePushConfigured/);

function runProbe(env: NodeJS.ProcessEnv) {
  const result = spawnSync("npx", ["tsx", "scripts/push-vapid-probe.ts"], {
    cwd: process.cwd(),
    encoding: "utf8",
    env: { ...process.env, ...env },
    shell: true,
  });
  assert.equal(result.status, 0, result.stderr || result.stdout);
  return JSON.parse(result.stdout.trim()) as {
    configured: boolean;
    publicKey: string;
    webPushRuntimeReady: boolean;
  };
}

const missing = runProbe({
  NEXT_PUBLIC_VAPID_PUBLIC_KEY: "",
  VAPID_PRIVATE_KEY: "",
  VAPID_SUBJECT: "",
  FIREBASE_SERVICE_ACCOUNT_JSON: "",
  APNS_KEY_P8: "",
  APNS_KEY_ID: "",
  APNS_TEAM_ID: "",
});
assert.equal(missing.publicKey, "");
assert.equal(missing.configured, false);
assert.equal(missing.webPushRuntimeReady, false);

const malformed = runProbe({
  NEXT_PUBLIC_VAPID_PUBLIC_KEY: "!!!not-a-vapid-key!!!",
  VAPID_PRIVATE_KEY: "!!!bad-private!!!",
  VAPID_SUBJECT: "mailto:qa@shanah-city-qa.invalid",
  FIREBASE_SERVICE_ACCOUNT_JSON: "",
  APNS_KEY_P8: "",
  APNS_KEY_ID: "",
  APNS_TEAM_ID: "",
});
assert.equal(malformed.webPushRuntimeReady, false);

const validShape = runProbe({
  NEXT_PUBLIC_VAPID_PUBLIC_KEY:
    "BEl62iUYgUivxIkv69yViEuiBIa-Ib9-SkvMeAtA3LFgDzkrxZJjSgSnfckjBJuBkr3qBUYIHBQFLXYp5Nksh8U",
  VAPID_PRIVATE_KEY: "UUxI4O8-FbRouAevSmBQ6o18hgE4nSG3wqN5jOuM5Is",
  VAPID_SUBJECT: "mailto:qa@shanah-city-qa.invalid",
  FIREBASE_SERVICE_ACCOUNT_JSON: "",
  APNS_KEY_P8: "",
  APNS_KEY_ID: "",
  APNS_TEAM_ID: "",
});
assert.equal(validShape.configured, true);
assert.equal(validShape.webPushRuntimeReady, true);
assert.ok(validShape.publicKey.length > 20);

console.log("push VAPID configuration probe OK");
