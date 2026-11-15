import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const hub = readFileSync("src/components/vision/VisionCenterHub.tsx", "utf8");
const reader = readFileSync("src/components/vision/VisionDocument.tsx", "utf8");

assert.match(hub, /max-w-\[1440px\]/, "Vision Center should use wide reading canvas");
assert.match(hub, /grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3/, "Ministry cards should reflow responsively");
assert.match(hub, /<VisionDocument content=\{selected\.content\}/, "Detailed vision must render as formatted reading content");
assert.match(hub, /editingVision/, "Pastoral editing must be a deliberate action");
assert.match(reader, /text-\[17px\]/, "Mobile body text must be large enough to read");
assert.match(reader, /sm:text-\[18px\]/, "Desktop body text must be comfortably readable");
assert.match(reader, /font-extrabold/, "Document section headings must have strong hierarchy");
assert.match(reader, /break-words/, "Long paragraphs must not overflow their containers");
assert.doesNotMatch(hub, /max-h-64|overflow-y-auto|lg:grid-cols-\[280px_1fr\]/, "No nested scroll panes or narrow reading sidebar");
assert.doesNotMatch(hub, /text-xs/, "Vision pages should not depend on tiny text");
const detailPage = readFileSync("src/app/leadership/vision/[planId]/page.tsx", "utf8");
const indexPage = readFileSync("src/app/leadership/vision/page.tsx", "utf8");
const notify = readFileSync("src/lib/vision-center-notify-server.ts", "utf8");
assert.match(hub, /<Link href=\{"\/leadership\/vision\/" \+ encodeURIComponent\(plan\.id\)\}/, "Ministry cards must open new plan routes");
assert.match(hub, /!planId && <section aria-label="Ministry vision directory"/, "Plan pages must not repeat the directory");
assert.match(hub, /planId && selected &&/, "Plan details should render only on individual page");
assert.match(hub, /Back to all ministry visions/, "Plan pages must provide a clear return link");
assert.match(detailPage, /canReadVision/, "Dedicated page must enforce access server-side");
assert.match(detailPage, /notFound\(\)/, "Unauthorized plan access must not reveal content");
assert.match(indexPage, /encodeURIComponent\(plan\)/, "Old notification URLs must redirect to dedicated pages");
assert.match(notify, /"\/leadership\/vision\/" \+ encodeURIComponent\(planId\)/, "New notifications must deep-link directly");
console.log("Vision Center premium readable layout checks passed.");
