/**
 * Server-verifiable flag: ephemeral Ask Shepherd session used consented team (temperament) context.
 * Stored in an HttpOnly signed cookie — not forgeable without CRON_SECRET (or ASK_SHEPHERD_PRIVACY_SECRET).
 * Does not store chat content.
 */

import { createHmac, timingSafeEqual } from "crypto";
import type { NextResponse } from "next/server";

export const ASK_SHEPHERD_TEAM_CTX_COOKIE = "ask_shepherd_ephemeral_team";

const COOKIE_VERSION = 1;
const COOKIE_MAX_AGE_SEC = 7 * 24 * 60 * 60;

type PayloadV1 = {
  v: typeof COOKIE_VERSION;
  u: string;
  d: string;
  t: number;
  /** True once any ephemeral turn used consented member highlights in this browser session. */
  x: 0 | 1;
};

function signingSecret(): string {
  const explicit =
    process.env.ASK_SHEPHERD_PRIVACY_SECRET?.trim() || process.env.CRON_SECRET?.trim();
  if (explicit) return explicit;
  if (process.env.NODE_ENV === "test") {
    return process.env.ASK_SHEPHERD_TEST_PRIVACY_SECRET?.trim() || "ask-shepherd-test-privacy-secret";
  }
  return "";
}

/** Production/staging should set CRON_SECRET or ASK_SHEPHERD_PRIVACY_SECRET; cookies are skipped if unset. */
export function isAskShepherdTeamContextCookieConfigured(): boolean {
  return Boolean(signingSecret());
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
  const secret = signingSecret();
  if (!secret) {
    throw new Error("ASK_SHEPHERD_PRIVACY_SECRET or CRON_SECRET is required for Ask Shepherd privacy cookies.");
  }
  return createHmac("sha256", secret).update(jsonBytes).digest("hex");
}

/** Build cookie value (for Set-Cookie). */
export function buildEphemeralTeamContextCookieValue(args: {
  userId: string;
  departmentKey: string;
  /** If true, session must not be saveable until reset or cookie expires. */
  usedConsentedTeamContext: boolean;
}): string {
  const now = Math.floor(Date.now() / 1000);
  const payload: PayloadV1 = {
    v: COOKIE_VERSION,
    u: args.userId,
    d: args.departmentKey,
    t: now,
    x: args.usedConsentedTeamContext ? 1 : 0,
  };
  const jsonBytes = Buffer.from(JSON.stringify(payload), "utf8");
  const sig = signPayload(jsonBytes);
  return `${b64url(jsonBytes)}.${sig}`;
}

export type ParsedTeamContextCookie =
  | { ok: true; usedConsentedTeamContext: boolean; userId: string; departmentKey: string }
  | { ok: false };

/** Parse and verify cookie; enforce user + department match and expiry. */
export function parseEphemeralTeamContextCookie(
  raw: string | undefined,
  expectedUserId: string,
  expectedDepartmentKey: string,
): ParsedTeamContextCookie {
  if (!raw?.trim()) return { ok: false };
  const parts = raw.split(".");
  if (parts.length !== 2) return { ok: false };
  const [b64, sigHex] = parts;
  let jsonBytes: Buffer;
  try {
    jsonBytes = b64urlDecode(b64);
  } catch {
    return { ok: false };
  }
  const secret = signingSecret();
  if (!secret) return { ok: false };
  const expectedSig = createHmac("sha256", secret).update(jsonBytes).digest("hex");
  if (expectedSig.length !== sigHex.length) return { ok: false };
  if (!timingSafeEqual(Buffer.from(expectedSig, "hex"), Buffer.from(sigHex, "hex"))) {
    return { ok: false };
  }
  let p: unknown;
  try {
    p = JSON.parse(jsonBytes.toString("utf8"));
  } catch {
    return { ok: false };
  }
  if (!p || typeof p !== "object") return { ok: false };
  const o = p as Partial<PayloadV1>;
  if (o.v !== COOKIE_VERSION || typeof o.u !== "string" || typeof o.d !== "string" || typeof o.t !== "number") {
    return { ok: false };
  }
  if (o.x !== 0 && o.x !== 1) return { ok: false };
  const now = Math.floor(Date.now() / 1000);
  if (now - o.t > COOKIE_MAX_AGE_SEC) return { ok: false };
  if (o.u !== expectedUserId || o.d !== expectedDepartmentKey) return { ok: false };
  return { ok: true, usedConsentedTeamContext: o.x === 1, userId: o.u, departmentKey: o.d };
}

export function mergeEphemeralTeamContextCookie(args: {
  existingRaw: string | undefined;
  userId: string;
  departmentKey: string;
  thisTurnUsedConsentedTeamContext: boolean;
}): string {
  let used = args.thisTurnUsedConsentedTeamContext;
  const prev = parseEphemeralTeamContextCookie(args.existingRaw, args.userId, args.departmentKey);
  if (prev.ok && prev.usedConsentedTeamContext) used = true;
  return buildEphemeralTeamContextCookieValue({
    userId: args.userId,
    departmentKey: args.departmentKey,
    usedConsentedTeamContext: used,
  });
}

export function cookieValueIndicatesTeamContextUsed(
  cookieValue: string,
  userId: string,
  departmentKey: string,
): boolean {
  const p = parseEphemeralTeamContextCookie(cookieValue, userId, departmentKey);
  return p.ok && p.usedConsentedTeamContext;
}

export function cookieOptionsForAskShepherd(): {
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

export function setTeamContextCookieOnResponse(res: NextResponse, value: string) {
  res.cookies.set(ASK_SHEPHERD_TEAM_CTX_COOKIE, value, cookieOptionsForAskShepherd());
}

/** Clear after explicit "new chat" so a fresh ephemeral session can be saved. */
export function clearTeamContextCookieOnResponse(res: NextResponse) {
  res.cookies.set(ASK_SHEPHERD_TEAM_CTX_COOKIE, "", {
    ...cookieOptionsForAskShepherd(),
    maxAge: 0,
  });
}
