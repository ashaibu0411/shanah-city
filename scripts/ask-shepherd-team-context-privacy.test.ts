/**
 * Ask Shepherd ephemeral privacy: signed cookie + turn receipts (hashes only).
 */
import assert from "node:assert/strict";

process.env.NODE_ENV = "test";

async function main() {
  const {
    appendEphemeralTurnReceipt,
    contentHash16,
    createFreshEphemeralPrivacyCookie,
    parseEphemeralPrivacyCookie,
    validateEphemeralHistoryAgainstCookie,
    validateEphemeralPrivacyBinding,
    validateEphemeralSaveMessages,
  } = await import("../src/lib/ask-shepherd-ephemeral-privacy-cookie");

  const userId = "user-a";
  const dept = "worship";

  let save = validateEphemeralSaveMessages({
    cookieRaw: undefined,
    userId,
    departmentKey: dept,
    messages: [
      { role: "user", content: "hi" },
      { role: "assistant", content: "hello" },
    ],
  });
  assert.equal(save.ok, false);
  assert.equal(save.ok ? "" : save.clientErrorCode, "privacy_session_invalid");

  let cookie = createFreshEphemeralPrivacyCookie({ userId, departmentKey: dept });
  cookie = appendEphemeralTurnReceipt({
    existingRaw: cookie,
    userId,
    departmentKey: dept,
    userMessage: "How do I debrief a volunteer?",
    assistantMessage: "Listen first, then clarify expectations.",
    teamContextThisTurn: false,
    kind: "ai",
  });

  save = validateEphemeralSaveMessages({
    cookieRaw: cookie,
    userId,
    departmentKey: dept,
    messages: [
      { role: "user", content: "How do I debrief a volunteer?" },
      { role: "assistant", content: "Listen first, then clarify expectations." },
    ],
  });
  assert.equal(save.ok, true);

  save = validateEphemeralSaveMessages({
    cookieRaw: cookie,
    userId,
    departmentKey: dept,
    messages: [
      { role: "user", content: "How do I debrief a volunteer?" },
      { role: "assistant", content: "Different text" },
    ],
  });
  assert.equal(save.ok, false);
  assert.equal(save.ok ? "" : save.clientErrorCode, "save_tampered_transcript");

  save = validateEphemeralSaveMessages({
    cookieRaw: cookie,
    userId: "other",
    departmentKey: dept,
    messages: [
      { role: "user", content: "How do I debrief a volunteer?" },
      { role: "assistant", content: "Listen first, then clarify expectations." },
    ],
  });
  assert.equal(save.ok, false);
  assert.equal(save.ok ? "" : save.clientErrorCode, "privacy_session_invalid");

  const parsed = validateEphemeralPrivacyBinding(parseEphemeralPrivacyCookie(cookie), userId, dept);
  assert.ok(parsed.ok);
  const stalePayload = { ...parsed.payload, t: Math.floor(Date.now() / 1000) - 9 * 24 * 60 * 60 };
  const { createHmac } = await import("crypto");
  const secret = process.env.ASK_SHEPHERD_TEST_PRIVACY_SECRET?.trim() || "ask-shepherd-test-privacy-secret";
  const jsonBytes = Buffer.from(JSON.stringify(stalePayload), "utf8");
  function b64url(buf: Buffer): string {
    return buf
      .toString("base64")
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");
  }
  const sig = createHmac("sha256", secret).update(jsonBytes).digest("hex");
  const staleCookie = `${b64url(jsonBytes)}.${sig}`;
  save = validateEphemeralSaveMessages({
    cookieRaw: staleCookie,
    userId,
    departmentKey: dept,
    messages: [
      { role: "user", content: "How do I debrief a volunteer?" },
      { role: "assistant", content: "Listen first, then clarify expectations." },
    ],
  });
  assert.equal(save.ok, false);
  assert.equal(save.ok ? "" : save.clientErrorCode, "privacy_session_invalid");

  const fresh = createFreshEphemeralPrivacyCookie({ userId, departmentKey: dept });
  save = validateEphemeralSaveMessages({
    cookieRaw: fresh,
    userId,
    departmentKey: dept,
    messages: [
      { role: "user", content: "How do I debrief a volunteer?" },
      { role: "assistant", content: "Listen first, then clarify expectations." },
    ],
  });
  assert.equal(save.ok, false);
  assert.equal(save.ok ? "" : save.clientErrorCode, "save_provenance_mismatch");

  let teamCookie = createFreshEphemeralPrivacyCookie({ userId, departmentKey: dept });
  teamCookie = appendEphemeralTurnReceipt({
    existingRaw: teamCookie,
    userId,
    departmentKey: dept,
    userMessage: "Help with this person",
    assistantMessage: "Consider their strengths.",
    teamContextThisTurn: true,
    kind: "ai",
  });
  save = validateEphemeralSaveMessages({
    cookieRaw: teamCookie,
    userId,
    departmentKey: dept,
    messages: [
      { role: "user", content: "Help with this person" },
      { role: "assistant", content: "Consider their strengths." },
    ],
  });
  assert.equal(save.ok, false);
  assert.equal(save.ok ? "" : save.clientErrorCode, "team_context_save_blocked");

  const [b64Part, sigPart] = cookie.split(".");
  assert.ok(b64Part && sigPart);
  const forgedCookie = `${b64Part}.${sigPart.slice(0, -4)}dead`;
  assert.equal(parseEphemeralPrivacyCookie(forgedCookie).ok, false);

  let critCookie = createFreshEphemeralPrivacyCookie({ userId, departmentKey: dept });
  const critText = (await import("../src/lib/ask-shepherd-safeguarding-static")).criticalSafeguardingResponseWithoutAi();
  critCookie = appendEphemeralTurnReceipt({
    existingRaw: critCookie,
    userId,
    departmentKey: dept,
    userMessage: "someone is hurting a child",
    assistantMessage: critText,
    teamContextThisTurn: false,
    kind: "crit",
  });
  save = validateEphemeralSaveMessages({
    cookieRaw: critCookie,
    userId,
    departmentKey: dept,
    messages: [
      { role: "user", content: "someone is hurting a child" },
      { role: "assistant", content: critText },
    ],
  });
  assert.equal(save.ok, true);

  assert.equal(contentHash16("x").length, 16);

  save = validateEphemeralSaveMessages({
    cookieRaw: cookie,
    userId,
    departmentKey: dept,
    messages: [{ role: "user", content: "only user" }],
  });
  assert.equal(save.ok, false);
  assert.equal(save.ok ? "" : save.clientErrorCode, "save_malformed_transcript");

  // Replay after clear: non-empty history with fresh cookie → 409
  let h = validateEphemeralHistoryAgainstCookie({
    cookieRaw: createFreshEphemeralPrivacyCookie({ userId, departmentKey: dept }),
    userId,
    departmentKey: dept,
    ephemeralHistory: [
      { role: "user", content: "How do I debrief a volunteer?" },
      { role: "assistant", content: "Listen first, then clarify expectations." },
    ],
  });
  assert.equal(h.ok, false);
  assert.equal(h.ok ? "" : h.clientErrorCode, "ephemeral_session_mismatch");

  // History matches cookie receipts
  h = validateEphemeralHistoryAgainstCookie({
    cookieRaw: cookie,
    userId,
    departmentKey: dept,
    ephemeralHistory: [
      { role: "user", content: "How do I debrief a volunteer?" },
      { role: "assistant", content: "Listen first, then clarify expectations." },
    ],
  });
  assert.equal(h.ok, true);

  console.log("ask-shepherd-team-context-privacy.test.ts OK");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
