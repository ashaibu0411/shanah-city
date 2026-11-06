/**
 * Regression: team-context save must use server-verifiable state (signed cookie), not client body.
 */
import assert from "node:assert/strict";

process.env.NODE_ENV = "test";

async function main() {
  const {
    buildEphemeralTeamContextCookieValue,
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

  console.log("ask-shepherd-team-context-privacy.test.ts OK");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
