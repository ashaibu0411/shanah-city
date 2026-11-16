import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const api = readFileSync("src/app/api/vision/plans/route.ts", "utf8");
const ui = readFileSync("src/components/vision/VisionCenterHub.tsx", "utf8");

assert.match(api, /params\.has\("memberSearch"\)/);
const search = api.slice(api.indexOf('if (params.has("memberSearch"))'), api.indexOf('const planId = params.get("planId")'));
assert.match(search, /if \(!isOwner\) return deny\(\)/, "Directory must be owner-only");
assert.match(search, /query\.length < 2/, "Short queries must be rejected");
assert.match(search, /prisma\.user\.findMany/, "Search must include all registered users");
assert.match(search, /name: \{ contains: query, mode: "insensitive" \}/);
assert.match(search, /email: \{ contains: query, mode: "insensitive" \}/);
assert.match(search, /displayName: \{ contains: query, mode: "insensitive" \}/);
assert.match(search, /select: \{ id: true, name: true, displayName: true, email: true \}/);
assert.match(search, /take: 40/, "Result size bounded");
assert.doesNotMatch(search, /passwordHash/, "Never expose passwords");
assert.match(search, /private, no-store/, "No directory caching");
assert.match(api, /action === "assign"/);
assert.match(api, /getUserById\(userId\)/, "Invitation target must be validated");
assert.match(ui, /Search all registered church members/);
assert.match(ui, /memberQuery\.trim\(\)\.length < 2/);
assert.match(ui, /AbortController/, "Prevent stale or cross-query search results");
assert.match(ui, /setAssignUserId\(member\.id\)/);
assert.match(ui, /disabled=\{busy \|\| !assignUserId\}/);
assert.match(ui, /if \(saved\) \{ setAssignUserId\("")/, "Retain recipient on request failure");
console.log("Private Vision reviewer directory search regression checks passed.");
