import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";

export function mintAnedotIntentToken(): string {
  return randomBytes(24).toString("base64url");
}

export function signAnedotIntentPayload(payload: string, secret: string): string {
  return createHmac("sha256", secret).update(payload, "utf8").digest("base64url");
}

export function verifyAnedotIntentBinding(
  intentToken: string,
  intentId: string,
  secret: string,
  signature: string | undefined | null,
): boolean {
  if (!signature?.trim()) return false;
  const expected = signAnedotIntentPayload(`${intentId}:${intentToken}`, secret);
  const a = Buffer.from(expected, "utf8");
  const b = Buffer.from(signature.trim(), "utf8");
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}
