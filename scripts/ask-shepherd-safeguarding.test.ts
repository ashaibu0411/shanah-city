import assert from "node:assert/strict";
import { assessSafeguardingSignals } from "../src/lib/ask-shepherd-safeguarding";

const criticalSamples = [
  "A volunteer reports that a child may be experiencing abuse. What should I do?",
  "A volunteer told me a child is being abused. What should I do?",
  "A volunteer says someone is hurting a child.",
  "I suspect neglect of a minor in our children's ministry.",
  "A teenager says they are being groomed.",
  "A child may be in danger of violence.",
  "Sexual assault of a child was reported to us.",
  "Someone reports child abuse."
];

for (const sample of criticalSamples) {
  assert.equal(
    assessSafeguardingSignals(sample).level,
    "critical",
    `Expected immediate static safeguarding for: ${sample}`,
  );
}

for (const sample of [
  "How do I give a worship team member constructive feedback?",
  "I need help facilitating a team meeting.",
  "What is an effective volunteer onboarding plan?",
]) {
  assert.equal(
    assessSafeguardingSignals(sample).level,
    "none",
    `Unexpected safeguarding escalation for: ${sample}`,
  );
}

console.log("ask-shepherd-safeguarding.test.ts OK");
