import assert from "node:assert/strict";
import { anedotActivationReady, anedotHostedPageUrl } from "../src/lib/anedot-activation";

const good = "https://secure.anedot.com/shanah-city/donate";
assert.equal(anedotHostedPageUrl(good), good);
for (const bad of [
  "http://secure.anedot.com/shanah-city/donate",
  "https://secure.anedot.com.attacker.invalid/donate",
  "https://secure.anedot.com/",
  "https://secure.anedot.com/shanah-city/donate?memberId=1",
  "https://evil:pass@secure.anedot.com/donate",
  "javascript:alert(1)",
  "",
]) {
  assert.equal(anedotHostedPageUrl(bad), null, bad);
}

const ready = {
  ANEDOT_ACCOUNT_APPROVED: "true",
  ANEDOT_GIVING_ENABLED: "true",
  ANEDOT_LEDGER_INTEGRATION_READY: "true",
  ANEDOT_ACTION_PAGE_URL: good,
  ANEDOT_WEBHOOK_SECRET: "a-placeholder-used-only-for-a-unit-test",
};
assert.equal(anedotActivationReady(ready), true);
for (const key of Object.keys(ready) as (keyof typeof ready)[]) {
  assert.equal(anedotActivationReady({ ...ready, [key]: "" }), false, key);
}
assert.equal(anedotActivationReady({}), false);
console.log("Anedot preapproval activation guard OK");
