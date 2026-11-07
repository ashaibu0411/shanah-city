/**
 * Ephemeral Ask Shepherd privacy: HttpOnly signed cookie binds a browser session (sid)
 * to verifiable turn receipts (content hashes only — no message text in cookie).
 * Team-context use is sticky per sid; clearing the cookie starts a new sid (replay blocked on save).
 */

import { createHmac, createHash, randomBytes, timingSafeEqual } from "crypto";
import type { NextResponse } from "next/server";

export const ASK_SHEPHERD_EPHEMERAL_PRIVACY_COOKIE = "ask_shepherd_ephemeral_priv";

const COOKIE_VERSION = 2;
const COOKIE_MAX_AGE_SEC = 7 * 24 * 60 * 60;
const MAX_RECEIPTS = 32;

type TurnKind = "ai" | "crit";

type Receipt = {
  /** Monotonic index within this ephemeral session */
  n: number;
  /** sha256(userUtf8) first 16 hex chars */
  hu: string;
  /** sha256(assistantUtf8) first 16 hex chars */
  ha: string;
  /** 1 if this turn used consented temperament highlights in the model */
  tc: 0 | 1;
  k: TurnKind;
};

type PayloadV2 = {
  v: typeof COOKIE_VERSION;
  u: string;
  d: string;
  /** Opaque session id — rotated on clear / new chat */
  sid: string;
  /** Last update unix seconds (rolling — used for expiry) */
  t: number;
  /** Sticky: any turn used consented team context in this sid */
  x: 0 | 1;
  r: Receipt[];
};

function privacySecret(): string {
  if (process.env.NODE_ENV === "test") {
    return process.env.ASK_SHEPHERD_TEST_PRIVACY_SECRET?.trim() || "ask-shepherd-test-privacy-secret";
  }
  const dedicated = process.env.ASK_SHEPHERD_PRIVACY_SECRET?.trim();
  if (dedicated) return dedicated;
  /** Local dev only — staging/production must set ASK_SHEPHERD_PRIVACY_SECRET */
  if (process.env.NODE_ENV === "development") {
    const cron = process.env.CRON_SECRET?.trim();
    if (cron) return cron;
  }
  return "";
}

/** Save/chat privacy features require a signing secret (prefer dedicated ASK_SHEPHERD_PRIVACY_SECRET in staging). */
export function isAskShepherdEphemeralPrivacyConfigured(): boolean {
  return Boolean(privacySecret());
}

export function contentHash16(text: string): string {
  return createHash("sha256").update(text, "utf8").digest("hex").slice(0, 16);
}

function b64url(buf: Buffer): string {
  return buf
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

function b64urlDecode(s: string): Buffer {
  const pad = 4 - (s.length % 4 || 4);
  const b64 = s.replace(/-/g, "+").replace(/_/g, "/") + "=".repeat(pad === 4 ? 0 : pad);
  return Buffer.from(b64, "base64");
}

function signPayload(jsonBytes: Buffer): string {
  const secret = privacySecret();
  if (!secret) throw new Error("ASK_SHEPHERD_PRIVACY_SECRET or CRON_SECRET required");
  return createHmac("sha256", secret).update(jsonBytes).digest("hex");
}

function buildCookieValue(payload: PayloadV2): string {
  const jsonBytes = Buffer.from(JSON.stringify(payload), "utf8");
  return `${b64url(jsonBytes)}.${signPayload(jsonBytes)}`;
}

export function createFreshEphemeralPrivacyCookie(args: { userId: string; departmentKey: string }): string {
  const now = Math.floor(Date.now() / 1000);
  const sid = randomBytes(16).toString("hex");
  return buildCookieValue({
    v: COOKIE_VERSION,
    u: args.userId,
    d: args.departmentKey,
    sid,
    t: now,
    x: 0,
    r: [],
  });
}

export type ParsedEphemeralPrivacyCookie =
  | { ok: true; payload: PayloadV2 }
  | { ok: false; reason?: string };

function isReceipt(x: unknown): x is Receipt {
  if (!x || typeof x !== "object") return false;
  const o = x as Partial<Receipt>;
  return (
    typeof o.n === "number" &&
    typeof o.hu === "string" &&
    typeof o.ha === "string" &&
    (o.tc === 0 || o.tc === 1) &&
    (o.k === "ai" || o.k === "crit")
  );
}

export function parseEphemeralPrivacyCookie(raw: string | undefined): ParsedEphemeralPrivacyCookie {
  if (!raw?.trim()) return { ok: false, reason: "missing" };
  const parts = raw.split(".");
  if (parts.length !== 2) return { ok: false, reason: "format" };
  const [b64, sigHex] = parts;
  let jsonBytes: Buffer;
  try {
    jsonBytes = b64urlDecode(b64);
  } catch {
    return { ok: false, reason: "decode" };
  }
  const secret = privacySecret();
  if (!secret) return { ok: false, reason: "no_secret" };
  const expectedSig = createHmac("sha256", secret).update(jsonBytes).digest("hex");
  if (expectedSig.length !== sigHex.length) return { ok: false, reason: "sig_len" };
  if (!timingSafeEqual(Buffer.from(expectedSig, "hex"), Buffer.from(sigHex, "hex"))) {
    return { ok: false, reason: "sig" };
  }
  let p: unknown;
  try {
    p = JSON.parse(jsonBytes.toString("utf8"));
  } catch {
    return { ok: false, reason: "json" };
  }
  if (!p || typeof p !== "object") return { ok: false, reason: "shape" };
  const o = p as Partial<PayloadV2>;
  if (o.v !== COOKIE_VERSION) return { ok: false, reason: "version" };
  if (typeof o.u !== "string" || typeof o.d !== "string" || typeof o.sid !== "string") {
    return { ok: false, reason: "ids" };
  }
  if (typeof o.t !== "number" || (o.x !== 0 && o.x !== 1)) return { ok: false, reason: "tx" };
  if (!Array.isArray(o.r)) return { ok: false, reason: "receipts" };
  const now = Math.floor(Date.now() / 1000);
  if (now - o.t > COOKIE_MAX_AGE_SEC) return { ok: false, reason: "expired" };
  if (o.r.length > MAX_RECEIPTS) return { ok: false, reason: "too_many" };
  for (const row of o.r) {
    if (!isReceipt(row)) return { ok: false, reason: "receipt_shape" };
  }
  return { ok: true, payload: o as PayloadV2 };
}

/** Bind cookie to authenticated user + department. */
export function validateEphemeralPrivacyBinding(
  parsed: ParsedEphemeralPrivacyCookie,
  userId: string,
  departmentKey: string,
): ParsedEphemeralPrivacyCookie {
  if (!parsed.ok) return parsed;
  if (parsed.payload.u !== userId || parsed.payload.d !== departmentKey) {
    return { ok: false, reason: "binding" };
  }
  return parsed;
}

export function appendEphemeralTurnReceipt(args: {
  existingRaw: string | undefined;
  userId: string;
  departmentKey: string;
  userMessage: string;
  assistantMessage: string;
  teamContextThisTurn: boolean;
  kind: TurnKind;
}): string {
  let payload: PayloadV2;
  const parsed = validateEphemeralPrivacyBinding(
    parseEphemeralPrivacyCookie(args.existingRaw),
    args.userId,
    args.departmentKey,
  );
  if (!parsed.ok) {
    const fresh = createFreshEphemeralPrivacyCookie({ userId: args.userId, departmentKey: args.departmentKey });
    const inner = parseEphemeralPrivacyCookie(fresh);
    if (!inner.ok) throw new Error("fresh_cookie_invalid");
    payload = { ...inner.payload, r: [] };
  } else {
    payload = { ...parsed.payload, r: [...parsed.payload.r] };
  }
  if (payload.r.length >= MAX_RECEIPTS) {
    throw new Error("ephemeral_receipt_limit");
  }
  const nextN = payload.r.length;
  const tc: 0 | 1 = args.teamContextThisTurn ? 1 : 0;
  payload.r.push({
    n: nextN,
    hu: contentHash16(args.userMessage),
    ha: contentHash16(args.assistantMessage),
    tc,
    k: args.kind,
  });
  payload.t = Math.floor(Date.now() / 1000);
  payload.x = payload.x === 1 || tc === 1 ? 1 : 0;
  return buildCookieValue(payload);
}

export type SaveValidationResult =
  | { ok: true }
  | { ok: false; clientErrorCode: string; status: number };

function countValidPairs(rows: { role: string; content: string }[]): number {
  if (rows.length % 2 !== 0) return -1;
  for (let i = 0; i < rows.length; i += 2) {
    if (rows[i]?.role !== "user" || rows[i + 1]?.role !== "assistant") return -1;
  }
  return rows.length / 2;
}

/**
 * Before running a new ephemeral turn: client `ephemeralHistory` must match signed receipts already issued
 * (prevents clearing the cookie and replaying an old history string against the server).
 */
export function validateEphemeralHistoryAgainstCookie(args: {
  cookieRaw: string | undefined;
  userId: string;
  departmentKey: string;
  ephemeralHistory: { role: "user" | "assistant"; content: string }[];
}): SaveValidationResult {
  if (!isAskShepherdEphemeralPrivacyConfigured()) {
    return { ok: false, clientErrorCode: "privacy_verification_unconfigured", status: 503 };
  }
  const priorPairs = countValidPairs(args.ephemeralHistory);
  if (priorPairs < 0) {
    return { ok: false, clientErrorCode: "ephemeral_history_malformed", status: 400 };
  }
  const parsed = validateEphemeralPrivacyBinding(
    parseEphemeralPrivacyCookie(args.cookieRaw),
    args.userId,
    args.departmentKey,
  );
  if (!parsed.ok) {
    if (priorPairs === 0) return { ok: true };
    return { ok: false, clientErrorCode: "ephemeral_session_mismatch", status: 409 };
  }
  const { payload } = parsed;
  if (priorPairs !== payload.r.length) {
    return { ok: false, clientErrorCode: "ephemeral_session_mismatch", status: 409 };
  }
  for (let i = 0; i < priorPairs; i++) {
    const rec = payload.r[i];
    const u = args.ephemeralHistory[i * 2]!;
    const a = args.ephemeralHistory[i * 2 + 1]!;
    if (!rec || rec.n !== i) {
      return { ok: false, clientErrorCode: "ephemeral_session_mismatch", status: 409 };
    }
    if (rec.hu !== contentHash16(u.content) || rec.ha !== contentHash16(a.content)) {
      return { ok: false, clientErrorCode: "ephemeral_session_mismatch", status: 409 };
    }
  }
  return { ok: true };
}

/**
 * Validates client-supplied messages against signed server receipts.
 * Expects alternating user/assistant pairs starting with user.
 */
export function validateEphemeralSaveMessages(args: {
  cookieRaw: string | undefined;
  userId: string;
  departmentKey: string;
  messages: { role: "user" | "assistant"; content: string }[];
}): SaveValidationResult {
  if (!isAskShepherdEphemeralPrivacyConfigured()) {
    return { ok: false, clientErrorCode: "privacy_verification_unconfigured", status: 503 };
  }
  const parsed = validateEphemeralPrivacyBinding(
    parseEphemeralPrivacyCookie(args.cookieRaw),
    args.userId,
    args.departmentKey,
  );
  if (!parsed.ok) {
    return { ok: false, clientErrorCode: "privacy_session_invalid", status: 400 };
  }
  const { payload } = parsed;
  if (payload.x === 1) {
    return { ok: false, clientErrorCode: "team_context_save_blocked", status: 400 };
  }
  const pairs: { user: string; assistant: string }[] = [];
  const msgs = args.messages;
  for (let i = 0; i < msgs.length; i += 2) {
    const u = msgs[i];
    const a = msgs[i + 1];
    if (!u || !a || u.role !== "user" || a.role !== "assistant") {
      return { ok: false, clientErrorCode: "save_malformed_transcript", status: 400 };
    }
    pairs.push({ user: u.content, assistant: a.content });
  }
  if (pairs.length === 0) {
    return { ok: false, clientErrorCode: "nothing_to_save", status: 400 };
  }
  if (pairs.length !== payload.r.length) {
    return { ok: false, clientErrorCode: "save_provenance_mismatch", status: 400 };
  }
  for (let i = 0; i < pairs.length; i++) {
    const rec = payload.r[i];
    if (!rec || rec.n !== i) {
      return { ok: false, clientErrorCode: "save_provenance_mismatch", status: 400 };
    }
    if (rec.tc === 1) {
      return { ok: false, clientErrorCode: "team_context_save_blocked", status: 400 };
    }
    if (rec.hu !== contentHash16(pairs[i].user) || rec.ha !== contentHash16(pairs[i].assistant)) {
      return { ok: false, clientErrorCode: "save_tampered_transcript", status: 400 };
    }
  }
  return { ok: true };
}

export function ephemeralTeamContextLockedFromPayload(payload: PayloadV2): boolean {
  return payload.x === 1;
}

export function cookieOptionsEphemeralPrivacy(): {
  httpOnly: boolean;
  secure: boolean;
  sameSite: "lax";
  path: string;
  maxAge: number;
} {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: COOKIE_MAX_AGE_SEC,
  };
}

export function setEphemeralPrivacyCookieOnResponse(res: NextResponse, value: string) {
  res.cookies.set(ASK_SHEPHERD_EPHEMERAL_PRIVACY_COOKIE, value, cookieOptionsEphemeralPrivacy());
}

export function clearEphemeralPrivacyCookieOnResponse(res: NextResponse) {
  res.cookies.set(ASK_SHEPHERD_EPHEMERAL_PRIVACY_COOKIE, "", {
    ...cookieOptionsEphemeralPrivacy(),
    maxAge: 0,
  });
}
