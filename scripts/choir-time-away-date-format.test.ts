import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { formatAmericanDateRange } from "../src/lib/unavailability-dates";

assert.equal(formatAmericanDateRange("2026-11-29", "2026-11-29", "long"), "Sunday, Nov 29, 2026");
assert.equal(formatAmericanDateRange("2026-11-29", "2026-11-29"), "Sun, Nov 29, 2026");
assert.equal(formatAmericanDateRange("2026-11-29", "2026-11-30", "long"), "Sunday, Nov 29, 2026 – Monday, Nov 30, 2026");

const card = readFileSync(path.join(process.cwd(), "src/components/chat/ChatMessageBubble.tsx"), "utf8");
assert.match(card, /formatAmericanDateRange\(match\[2\], match\[3\], "long"\)/);

console.log("choir-time-away-date-format.test.ts OK");
