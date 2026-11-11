/**
 * Anedot pre-approval gate.
 * Intentionally does not activate payment routing until the application is approved,
 * a verified hosted Action Page exists, and a webhook signing secret is configured.
 * Do not surface user-facing checkout until the full signed webhook ledger integration exists.
 */
export function anedotHostedPageUrl(raw: string | undefined): string | null {
  if (!raw) return null;
  try {
    const url = new URL(raw);
    if (url.protocol !== "https:" || url.username || url.password) return null;
    if (!["secure.anedot.com", "secure.anedot-sandbox.com"].includes(url.hostname)) return null;
    if (!url.pathname || url.pathname === "/") return null;
    if (url.search || url.hash) return null;
    return url.toString();
  } catch {
    return null;
  }
}

export function anedotActivationReady(env: {
  ANEDOT_ACCOUNT_APPROVED?: string;
  ANEDOT_GIVING_ENABLED?: string;
  ANEDOT_ACTION_PAGE_URL?: string;
  ANEDOT_WEBHOOK_SECRET?: string;
  ANEDOT_LEDGER_INTEGRATION_READY?: string;
  ANEDOT_ACCOUNT_UID?: string;
}): boolean {
  return (
    env.ANEDOT_ACCOUNT_APPROVED === "true" &&
    env.ANEDOT_GIVING_ENABLED === "true" &&
    env.ANEDOT_LEDGER_INTEGRATION_READY === "true" &&
    Boolean(env.ANEDOT_WEBHOOK_SECRET?.trim()) &&
    Boolean(env.ANEDOT_ACCOUNT_UID?.trim()) &&
    Boolean(anedotHostedPageUrl(env.ANEDOT_ACTION_PAGE_URL))
  );
}
