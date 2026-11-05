/** Regression guard for the Marriage Prep typography and mobile layout audit.
 * Run: npm run test:marriage:readability
 * Structural coverage only; signed-in iOS/Android visual acceptance is separate.
 */
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

const read = (file) => readFileSync(path.join(process.cwd(), file), "utf8");
const routeLayout = read("src/app/marriage/layout.tsx");
const sharedCss = read("src/components/marriage/marriage-counseling.css");
const counselorCss = read("src/app/marriage-counselor.css");
const counselorPanel = read("src/components/marriage/MarriageCounselorPremaritalProgramPanel.tsx");
const operationsPanel = read("src/components/marriage/MarriageCounselorPremaritalOperationsPanel.tsx");
const guides = read("src/lib/marriage-premarital-session-guides.ts");

assert.match(routeLayout, /marriage-prep-layout/, "every Marriage Prep route needs a common layout wrapper");
assert.match(sharedCss, /\.marriage-prep-layout\s*\{/, "shared layout styles must be defined");
assert.match(sharedCss, /\.marriage-prep-layout\s+:where\(p, li, dt, dd, label\)/, "long question and guidance text must wrap");
assert.match(sharedCss, /overflow-wrap:\s*break-word/, "long words need safe overflow handling");
assert.match(sharedCss, /text-wrap:\s*pretty/, "prose should wrap naturally where supported");

for (const name of [
  "marriage-c3m-teaching-section",
  "marriage-c3m-teaching-heading",
  "marriage-c3m-teaching-copy",
  "marriage-c3m-reading-list",
  "marriage-c3m-ops-nav",
]) {
  assert.ok(counselorCss.includes(`.${name}`), `Missing counselor teaching style ${name}`);
}
assert.match(counselorPanel, /marriage-c3m-teaching-section/, "session teaching should be grouped in sections");
assert.match(counselorPanel, /<h4 className="marriage-c3m-teaching-heading">/, "teaching section headings need hierarchy");
assert.match(counselorPanel, /className="mt-3 space-y-4"/, "separate guide paragraphs with breathing room");
assert.match(operationsPanel, /marriage-c3m-ops-nav/, "operations navigation must be a single scrollable row");
assert.match(counselorCss, /\.marriage-c3m-ops-nav[^]*?overflow-x:\s*auto;/, "operations navigation must scroll");
assert.equal((guides.match(/heading: "Practical in-session exercise"/g) ?? []).length, 8, "keep all eight session exercises");
assert.doesNotMatch(guides, /_{5,}/, "avoid unbroken long underscore blanks in spoken exercises");
assert.match(guides, /\[name a commitment\]/, "spoken exercise includes a readable placeholder");

const pages = [
  "src/app/marriage/page.tsx",
  "src/app/marriage/about/page.tsx",
  "src/app/marriage/consent/page.tsx",
  "src/app/marriage/join/page.tsx",
  "src/app/marriage/journal/page.tsx",
  "src/app/marriage/learn/page.tsx",
  "src/app/marriage/homework/page.tsx",
  "src/app/marriage/homework/[homeworkId]/page.tsx",
  "src/app/marriage/module/[moduleId]/page.tsx",
  "src/app/marriage/module/[moduleId]/compare/page.tsx",
  "src/app/marriage/module/[moduleId]/discuss/page.tsx",
  "src/app/marriage/module/[moduleId]/review/page.tsx",
  "src/app/marriage/module/[moduleId]/submit/page.tsx",
  "src/app/marriage/counselor/page.tsx",
  "src/app/marriage/counselor/journey/[journeyId]/page.tsx",
  "src/app/marriage/counselor/journey/[journeyId]/homework/page.tsx",
  "src/app/marriage/admin/curriculum/page.tsx",
  "src/app/marriage/admin/counselor-assignments/page.tsx",
  "src/app/marriage/admin/certificate-settings/page.tsx",
  "src/app/marriage/admin/deletion-requests/page.tsx",
];
for (const file of pages) {
  assert.ok(existsSync(path.join(process.cwd(), file)), `Marriage Prep route missing: ${file}`);
}
console.log(`marriage-prep-readability.test.mjs: OK (${pages.length} routes, eight teaching sessions)`);
