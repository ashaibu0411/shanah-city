import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  buildVisionShareInvitation,
  visionPlanCanonicalPath,
  visionPlanShareUrl,
  visionShareDocumentTitle,
} from "../src/lib/vision-center-share";

const planPage = readFileSync("src/app/leadership/vision/[planId]/page.tsx", "utf8");
const hub = readFileSync("src/components/vision/VisionCenterHub.tsx", "utf8");
const shareUi = readFileSync("src/components/vision/VisionShareButton.tsx", "utf8");
const gate = readFileSync("src/components/vision/VisionAccessGate.tsx", "utf8");

const sampleId = "plan-abc-123";
const url = visionPlanShareUrl("https://shanah-city.vercel.app", sampleId);

assert.equal(visionPlanCanonicalPath(sampleId), "/leadership/vision/plan-abc-123");
assert.equal(url, "https://shanah-city.vercel.app/leadership/vision/plan-abc-123");
assert.match(buildVisionShareInvitation("2027 Master Vision", url), /feasibility assessment/);
assert.match(buildVisionShareInvitation("2027 Master Vision", url), /does not open the proposal by itself/);
assert.equal(visionShareDocumentTitle("Kids Ministry"), "Shanah City — Kids Ministry");

assert.match(planPage, /VisionAccessGate/);
assert.match(planPage, /visionPlan\.findUnique/);
assert.match(planPage, /return <VisionAccessGate \/>/);

assert.match(hub, /VisionShareButton/);
assert.doesNotMatch(hub, /Copy private review link/);

assert.match(shareUi, /navigator\.share/);
assert.match(shareUi, /Copy link/);
assert.match(shareUi, /Copy invitation/);
assert.doesNotMatch(shareUi, /whatsAppShareUrl/);

assert.match(gate, /sign-in alone does not grant access/i);

console.log("Vision Center external share regression checks passed.");