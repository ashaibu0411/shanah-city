import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const component = readFileSync("src/components/groups/choir/ChoirQuickActions.tsx", "utf8");
const css = readFileSync("src/components/groups/choir/choir-premium.css", "utf8");

for (const title of ["Setlists", "Recordings", "My schedule", "Rehearsal room", "Worship team", "Worship academy", "Team connect"]) {
  assert.ok(component.includes(`title: "${title}"`), `Missing shortcut: ${title}`);
}
assert.match(component, /className="choir-quick-actions-grid"/);
assert.match(component, /tile\.key === "connect" \? "choir-tile-featured"/);
assert.match(css, /grid-template-columns:\s*repeat\(2,\s*minmax\(0,\s*1fr\)\)/);
assert.match(css, /\.choir-group-home \.choir-tile-featured\s*\{[^}]*grid-column:\s*1\s*\/\s*-1/s);
assert.match(css, /\.choir-group-home \.choir-tile:focus-visible/);

console.log("choir-home-quick-actions-layout.test.ts OK");
