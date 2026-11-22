import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { VISION_2027_DRAFTS } from "../src/lib/vision-2027-drafts";
import { VISION_MINISTRIES } from "../src/lib/vision-center-access-server";

const master = VISION_2027_DRAFTS.find(plan => plan.ministryKey === "churchwide");
assert.ok(master);
assert.match(master.title, /Pastoral Review Proposal/);
assert.match(master.summary, /Senior Pastor/);
for(const phrase of ["Dear Pastors", "I am believing", "my proposal", "priority", "achievable",
  "2027 MONTH-BY-MONTH CALENDAR", "SHANAH CITY", "Vacation Bible School",
  "Kids Sunday", "Transformed Women", "Mother's Day", "SHIFT Conference", "Hail the King",
  "three in-person", "building", "community", "financial", "not a final event schedule",
  "approval", "budget", "spiritual", "pastoral team"]) {
  assert.ok(master.content.toLowerCase().includes(phrase.toLowerCase()), "Master proposal missing: " + phrase);
}
for (const month of ["January","February","March","April","May","June","July","August","September","October","November","December"]) {
  assert.match(master.content, new RegExp("^" + month + ":", "m"), "Missing standalone calendar review item: " + month);
}
assert.ok(master.content.length <= 20000, "Must fit existing owner edit limit");
assert.equal(VISION_MINISTRIES.find(m => m.key === "churchwide")?.title, master.title);

const viewer = readFileSync("src/components/vision/VisionDocument.tsx", "utf8");
assert.match(viewer, /onSuggest\?: \(section: string\) => void/);
assert.match(viewer, /onSuggest\("calendar:" \+ calendarMonth\)|onSuggest\(subject\)/);
assert.match(viewer, /Suggest a change for/);
assert.match(viewer, /Priority \[1-5\]/);
assert.match(viewer, /Training \(\?:One\|Two\|Three\)/);

const hub = readFileSync("src/components/vision/VisionCenterHub.tsx", "utf8");
assert.match(hub, /function GrowingVisionTextarea/);
assert.match(hub, /element\.scrollHeight/);
assert.match(hub, /overflowY: "hidden"/);
assert.match(hub, /<GrowingVisionTextarea/);
assert.match(hub, /<VisionDocument content=\{selected\.content\} onSuggest=\{suggestFor\}/);
assert.match(hub, /commentFormRef\.current\?\.scrollIntoView/);
assert.match(hub, /calendar:" \+ month/);
assert.match(hub, /My full pastoral review, corrections and additions/);
assert.match(hub, /Share privately with registered pastoral team/);
assert.match(hub, /<VisionShareButton/);
const shareButton = readFileSync("src/components/vision/VisionShareButton.tsx", "utf8");
assert.match(shareButton, /Copy link/);
assert.match(shareButton, /Share Vision/);
assert.match(shareButton, /Only invited leaders can open it after sign-in/);
assert.match(hub, /if \(saved\) \{ setCommentText\(""\)/, "Submission must preserve draft on failure");
assert.match(hub, /maxLength=\{8000\}/);

const route = readFileSync("src/app/api/vision/plans/route.ts", "utf8");
assert.match(route, /action === "assign-pastoral-team"/);
assert.match(route, /getPastoralReviewerUserIds\(\)/);
assert.match(route, /if \(!isOwner\) return deny\(\)/);
assert.match(route, /plan\.ministryKey !== "churchwide"/);
assert.match(route, /visionAssignment\.create/);
assert.match(route, /notifyVisionLeader\(reviewerId, planId, "assigned"\)/);
assert.match(route, /canReadVision\(planId, user\.id, isOwner\)/);
assert.match(route, /safeVisionString\(body\.body, 8000\)/);
assert.match(route, /decide-comment/);
assert.match(route, /visionAuditEvent/);
console.log("Master pastoral proposal, 12 month-specific feedback topics, sharing and growing text fields source checks passed.");
