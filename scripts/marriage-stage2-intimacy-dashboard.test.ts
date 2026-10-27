import assert from "node:assert/strict";
import { allStage2ModuleDefinitions } from "../src/lib/marriage-stage2-module-registry";
import { marriageStage2IntimacyModuleAccessible } from "../src/lib/marriage-stage2-feature";

function visibleStage2ModuleIds() {
  return allStage2ModuleDefinitions()
    .filter((mod) => marriageStage2IntimacyModuleAccessible(mod.id))
    .map((m) => m.id);
}

const prev = process.env.MARRIAGE_HUB_STAGE2_INTIMACY_APPROVED;
process.env.MARRIAGE_HUB_STAGE2_INTIMACY_APPROVED = "";
const withoutApproval = visibleStage2ModuleIds();
assert.ok(!withoutApproval.includes("s2-mod-06-intimacy"), "intimacy hidden when approval flag off");

process.env.MARRIAGE_HUB_STAGE2_INTIMACY_APPROVED = "1";
const withApproval = visibleStage2ModuleIds();
assert.ok(withApproval.includes("s2-mod-06-intimacy"), "intimacy visible when approval flag on");

if (prev === undefined) delete process.env.MARRIAGE_HUB_STAGE2_INTIMACY_APPROVED;
else process.env.MARRIAGE_HUB_STAGE2_INTIMACY_APPROVED = prev;

console.log("marriage-stage2-intimacy-dashboard.test.ts OK");
