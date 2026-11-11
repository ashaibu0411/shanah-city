import { createHmac, timingSafeEqual } from "node:crypto";

/** Anedot: HMAC-SHA256 hex digest of raw body using webhook secret (X-Request-Signature). */
export function computeAnedotWebhookSignature(rawBody: string, secret: string): string {
  return createHmac("sha256", secret).update(rawBody, "utf8").digest("hex");
}

export function verifyAnedotWebhookSignature(
  rawBody: string,
  signatureHeader: string | null | undefined,
  secret: string,
): boolean {
  if (!signatureHeader?.trim()) return false;
  const expected = computeAnedotWebhookSignature(rawBody, secret);
  const provided = signatureHeader.trim().toLowerCase();
  const expectedBuf = Buffer.from(expected, "utf8");
  const providedBuf = Buffer.from(provided, "utf8");
  if (expectedBuf.length !== providedBuf.length) return false;
  return timingSafeEqual(expectedBuf, providedBuf);
}
