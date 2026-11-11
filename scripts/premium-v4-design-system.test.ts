import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { premiumV4PageThemes, premiumV4ThemeForPath, premiumV4Tokens } from "../src/lib/premium-v4-design-system";

const css = readFileSync("src/app/premium-v4-system.css", "utf8");
const globals = readFileSync("src/app/globals.css", "utf8");
const components = readFileSync("src/components/design/PremiumV4Page.tsx", "utf8");

assert.equal(premiumV4Tokens.navy, "#061329");
assert.equal(premiumV4Tokens.royalPurple, "#512D83");
assert.equal(premiumV4Tokens.metallicGold, "#E9BC72");
assert.equal(premiumV4ThemeForPath("/live"), "cinematic");
assert.equal(premiumV4ThemeForPath("/devotions"), "reading");
assert.equal(premiumV4ThemeForPath("/admin"), "workspace");
assert.equal(premiumV4ThemeForPath("/admin/giving"), null, "no implicit nested-route theme");
assert.equal(premiumV4ThemeForPath("/"), null, "keep approved Home V4 intact");
assert.ok(Object.values(premiumV4PageThemes).includes("workspace"));
assert.match(css, /\.sc-v4\[data-sc-theme="cinematic"\]/);
assert.match(css, /\.sc-v4\[data-sc-theme="reading"\]/);
assert.match(css, /\.sc-v4\[data-sc-theme="workspace"\]/);
assert.match(css, /:focus-visible/);
assert.doesNotMatch(css, /^\s*(?:html|body|\.app-main)\s*\{/m, "styles must be opt-in");
assert.match(globals, /@import "\.\/premium-v4-system\.css";/);
assert.match(components, /data-sc-theme=\{theme\}/);
console.log("premium V4 opt-in design system guard OK");
