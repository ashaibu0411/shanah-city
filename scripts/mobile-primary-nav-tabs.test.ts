import assert from "node:assert/strict";
import { mobilePrimaryNavTabs } from "../src/lib/mobile-primary-nav-tabs";

const hrefs = mobilePrimaryNavTabs.map((tab) => tab.href);
assert.deepEqual(hrefs, ["/", "/devotions", "/live"]);
assert.equal(mobilePrimaryNavTabs.length, 3);

console.log("mobile-primary-nav-tabs.test.ts OK");
