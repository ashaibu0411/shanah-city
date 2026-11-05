/** Prevent a regression where counselor pages render unstyled despite working Tailwind utilities.
 * Run: npm run test:marriage:counselor-layout
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";

const root = process.cwd();
const read = (file) => readFileSync(path.join(root, file), "utf8");
const css = read("src/app/marriage-counselor.css");
const layout = read("src/app/layout.tsx");
const nav = read("src/components/marriage/MarriageCounselorJourneyNav.tsx");
const inset = read("src/components/marriage/marriage-counseling-premium.ts");

assert.match(layout, /import\s+["']\.\/marriage-counselor\.css["']/, "root layout must load counselor CSS");
assert.match(nav, /flex-nowrap/, "section tabs must not wrap into a tall mobile header");
assert.doesNotMatch(nav, /\bsticky\s+top-0\b/, "mobile section tabs must not block couple details");
assert.match(css, /overflow-x:\s*auto/, "section tabs need horizontal scrolling");
assert.match(inset, /counselorDashboardInset:.*pb-40/, "counselor pages need bottom navigation clearance");

const sources = [
  "src/components/marriage/MarriageCounselorClinicalDashboard.tsx",
  "src/components/marriage/MarriageCounselorPremaritalOperationsPanel.tsx",
  "src/components/marriage/MarriageCounselorPremaritalProgramPanel.tsx",
  "src/components/marriage/MarriageCounselorCommandCenter.tsx",
  "src/components/marriage/MarriageCounselorJourneyDetail.tsx",
  "src/components/marriage/MarriageCounselorJourneyNav.tsx",
];
const classNames = new Set();
for (const file of sources) {
  for (const match of read(file).matchAll(/marriage-c3m-[a-z0-9-]+/g)) classNames.add(match[0]);
}
classNames.add("marriage-c3m-dashboard");
for (const name of classNames) {
  assert.ok(
    css.includes(`.${name}`),
    `Missing custom CSS for ${name}; it will render as unstyled text or form controls`,
  );
}
assert.match(css, /grid-template-columns:\s*repeat\(2,\s*minmax\(0,\s*1fr\)\)/, "mobile metrics must have columns");
assert.match(css, /@media\s*\(min-width:\s*1024px\)/, "desktop dashboard needs its own column layout");
assert.match(css, /font-size:\s*1rem;\s*\/\* Prevent iOS input focus zoom/, "form inputs must prevent mobile focus zoom");
console.log(`marriage-counselor-mobile-style.test.mjs: OK (${classNames.size} component classes)`);
