/**
 * Regression: team-context save must use server-verifiable state (signed cookie), not client body.
 */
import assert from "node:assert/strict";

process.env.NODE_ENV = "test";

async function main() {
  const {
    buildEphemeralTeamContextCookieValue,
    fingerprintAskShepherdTranscript,
    mergeEphemeralTeamContextCookie,
    parseEphemeralTeamContextCookie,
  } = await import("../src/lib/ask-shepherd-team-context-cookie");

  const userId = "user-ephemeral-1";
  const dept = "worship";

  const clean = buildEphemeralTeamContextCookieValue({
    userId,
    departmentKey: dept,
    usedConsentedTeamContext: false,
  });
  let p = parseEphemeralTeamContextCookie(clean, userId, dept);
  assert.ok(p.ok);
  assert.equal(p.usedConsentedTeamContext, false);

  const merged = mergeEphemeralTeamContextCookie({
    existingRaw: clean,
    userId,
    departmentKey: dept,
    thisTurnUsedConsentedTeamContext: true,
  });
  p = parseEphemeralTeamContextCookie(merged, userId, dept);
  assert.ok(p.ok);
  assert.equal(p.usedConsentedTeamContext, true);

  const mergedAgain = mergeEphemeralTeamContextCookie({
    existingRaw: merged,
    userId,
    departmentKey: dept,
    thisTurnUsedConsentedTeamContext: false,
  });
  p = parseEphemeralTeamContextCookie(mergedAgain, userId, dept);
  assert.ok(p.ok);
  assert.equal(p.usedConsentedTeamContext, true);

  p = parseEphemeralTeamContextCookie(merged, "other-user", dept);
  assert.equal(p.ok, false);

  const parts = merged.split(".");
  const b64 = parts[0];
  const sig = parts[1];
  assert.ok(b64 && sig);
  const forged = `${b64}.${sig.slice(0, -4)}beef`;
  assert.equal(parseEphemeralTeamContextCookie(forged, userId, dept).ok, false);

  function saveWouldRejectTeamContext(cookieRaw: string | undefined, uid: string, departmentKey: string) {
    const parsed = parseEphemeralTeamContextCookie(cookieRaw, uid, departmentKey);
    return parsed.ok && parsed.usedConsentedTeamContext;
  }
  assert.equal(saveWouldRejectTeamContext(undefined, userId, dept), false);
  assert.equal(saveWouldRejectTeamContext(clean, userId, dept), false);
  assert.equal(saveWouldRejectTeamContext(merged, userId, dept), true);
  assert.equal(saveWouldRejectTeamContext(forged, userId, dept), false);

  // Stronger proof: HMAC binds an actual generated transcript, not just a
  // mutable browser-wide "used team" bit. Clearing the cookie cannot make
  // an old transcript saveable.
  const protectedTranscript = [
    { role: "user" as const, content: "How should I encourage this member?" },
    { role: "assistant" as const, content: "Lead with compassion and clarity." },
  ];
  const digest = fingerprintAskShepherdTranscript(protectedTranscript);
  const protectedReceipt = buildEphemeralTeamContextCookieValue({
    userId, departmentKey: dept, usedConsentedTeamContext: true, transcriptHash: digest,
  });
  const verified = parseEphemeralTeamContextCookie(protectedReceipt, userId, dept);
  assert.ok(verified.ok);
  assert.equal(verified.transcriptHash, digest);
  assert.equal(verified.usedConsentedTeamContext, true);
  assert.notEqual(digest, fingerprintAskShepherdTranscript([...protectedTranscript, {
    role: "assistant", content: "Tampered additional content",
  }]));
  const forgedCleanReceipt = buildEphemeralTeamContextCookieValue({
    userId, departmentKey: dept, usedConsentedTeamContext: false,
    transcriptHash: fingerprintAskShepherdTranscript([
      { role: "user", content: "New harmless question" },
      { role: "assistant", content: "General advice" },
    ]),
  });
  const cleanAfterReset = parseEphemeralTeamContextCookie(forgedCleanReceipt, userId, dept);
  assert.ok(cleanAfterReset.ok);
  assert.notEqual(cleanAfterReset.transcriptHash, digest);
  const canSave = (raw: string | undefined, rows: typeof protectedTranscript) => {
    const parsed = parseEphemeralTeamContextCookie(raw, userId, dept);
    return parsed.ok && !parsed.usedConsentedTeamContext &&
      parsed.transcriptHash === fingerprintAskShepherdTranscript(rows);
  };
  assert.equal(canSave(undefined, protectedTranscript), false);
  assert.equal(canSave(protectedReceipt, protectedTranscript), false);
  assert.equal(canSave(forgedCleanReceipt, protectedTranscript), false);
  assert.equal(canSave(forgedCleanReceipt, [
    { role: "user", content: "New harmless question" },
    { role: "assistant", content: "General advice" },
  ]), true);

  console.log("ask-shepherd-team-context-privacy.test.ts OK");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
