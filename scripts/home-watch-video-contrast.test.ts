import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const home = readFileSync("src/components/home/premium/v4/PremiumHomeV4LatestSermon.tsx", "utf8");
const button = home.match(/<button type="button" onClick=\{openSermon\}[\s\S]*?Watch video[\s\S]*?<\/button>/)?.[0];
assert.ok(button, "Mobile latest sermon Watch video action must remain present");
assert.match(button, /border-2 border-\[#123a67\]/, "Button needs a strong branded outline");
assert.match(button, /bg-white/);
assert.match(button, /text-\[#123a67\]/, "Button text must be high contrast");
assert.match(button, /font-extrabold/);
assert.match(button, /focus-visible:outline/);
assert.match(button, /PremiumHomeV4Play/, "Button needs an unambiguous play affordance");
assert.match(home, /if \(playback\) void playWatch\(playback\);/, "Keep original playback behavior");
assert.match(home, /Listen in background/, "Preserve audio CTA");
console.log("Latest Sermon Watch video button contrast checks passed.");
