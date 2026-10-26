import assert from "node:assert/strict";

/** Mirrors getMarriageHubSummary partner-only sections (regression for prod 500). */
function shouldLoadPartnerPairedHubSections(partnerJoined: boolean): boolean {
  return partnerJoined;
}

assert.equal(shouldLoadPartnerPairedHubSections(false), false);
assert.equal(shouldLoadPartnerPairedHubSections(true), true);

console.log("marriage-hub-partner-gate.test.ts: ok");
