import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { SMS_CONSENT_DISCLOSURE_TEXT, SMS_CONSENT_DISCLOSURE_VERSION } from "../src/lib/sms-consent-copy";

const root = process.cwd();

const page = readFileSync(join(root, "src/app/sms-consent/page.tsx"), "utf8");
assert.doesNotMatch(page, /GuestCaptureForm/);
assert.match(page, /SmsConsentForm/);
assert.match(page, /unchecked by default/i);
assert.match(page, /In-person opt-in/i);

const form = readFileSync(join(root, "src/components/sms/SmsConsentForm.tsx"), "utf8");
assert.match(form, /useState\(false\)/);
assert.match(form, /disabled=\{loading \|\| !consent\}/);
assert.match(form, /SMS_CONSENT_DISCLOSURE_TEXT/);
assert.match(form, /href="\/privacy"/);
assert.match(form, /href="\/terms"/);

const api = readFileSync(join(root, "src/app/api/sms-consent/route.ts"), "utf8");
assert.match(api, /subscribeSmsFromPublicForm/);
assert.doesNotMatch(api, /addGuestSubmission/);

const sms = readFileSync(join(root, "src/lib/sms-server.ts"), "utf8");
assert.match(sms, /subscribeSmsFromPublicForm/);
assert.match(sms, /does not create guest/);

const middleware = readFileSync(join(root, "src/middleware.ts"), "utf8");
assert.match(middleware, /\/sms-consent/);
assert.match(middleware, /x-shanah-standalone-public/);

const layout = readFileSync(join(root, "src/app/layout.tsx"), "utf8");
assert.match(layout, /PublicComplianceChrome/);
assert.match(layout, /standalonePublic/);

const footer = readFileSync(join(root, "src/components/church-site/ChurchSiteFrame.tsx"), "utf8");
assert.match(footer, /href="\/sms-consent"/);

assert.match(SMS_CONSENT_DISCLOSURE_TEXT, /Reply STOP/);
assert.match(SMS_CONSENT_DISCLOSURE_TEXT, /not a condition of church attendance/);
assert.equal(SMS_CONSENT_DISCLOSURE_VERSION, "2026-11-27");

console.log("sms-consent-compliance.test.ts OK");