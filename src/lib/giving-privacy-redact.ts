/** Redact identifiers for finance diagnostics and logs — never emit full PII in API responses. */

export function redactEmailForLogs(email: string | null | undefined) {
  const normalized = email?.trim();
  if (!normalized) return null;
  const at = normalized.indexOf("@");
  if (at <= 0) return "***";
  const local = normalized.slice(0, at);
  const domain = normalized.slice(at + 1);
  const hint = local.length > 0 ? local[0] : "?";
  return `${hint}***@${domain}`;
}

export function redactStripeId(id: string | null | undefined) {
  const value = id?.trim();
  if (!value) return null;
  if (value.length <= 10) return `${value.slice(0, 3)}…`;
  return `${value.slice(0, 6)}…${value.slice(-4)}`;
}

export function redactUserIdForLogs(userId: string | null | undefined) {
  const value = userId?.trim();
  if (!value) return null;
  if (value.length <= 8) return `${value.slice(0, 2)}…`;
  return `${value.slice(0, 6)}…${value.slice(-3)}`;
}
