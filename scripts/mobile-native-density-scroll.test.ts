import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = (p: string) => readFileSync(p, "utf8");
const css = read("src/app/mobile-native-density.css");
const global = read("src/app/globals.css");
const main = read("src/components/app/AppMain.tsx");
const header = read("src/components/app/MobileAppHeader.tsx");
const nav = read("src/components/app/MobileNav.tsx");

assert.match(global, /@import "\.\/mobile-native-density\.css";/);
assert.match(css, /@media \(max-width: 767px\)/);
assert.match(css, /overflow-x: clip/);
assert.match(css, /scroll-margin-top:/);
assert.match(css, /\.mobile-app-header/);
assert.match(css, /background: #061329 !important/);
assert.match(css, /\.app-mobile-bottom-nav/);
assert.match(css, /\.sc-v4-media/);
assert.match(css, /\.sc-v4-sermons/);
assert.match(css, /\.ph4-tile-grid/);
assert.match(main, /pb-\[calc\(6\.5rem\+env\(safe-area-inset-bottom\)\)\]/);
assert.match(header, /sticky top-0/);
assert.match(nav, /fixed bottom-0/);
assert.doesNotMatch(css, /display:\s*none\s*!important/, "do not hide navigation or cards");
console.log("mobile native density/scroll layout guards OK");
