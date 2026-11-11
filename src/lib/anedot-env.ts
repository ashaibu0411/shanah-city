import { anedotActivationReady, anedotHostedPageUrl } from "@/lib/anedot-activation";

function env() {
  return process.env;
}

export function anedotWebhookSecret(): string | null {
  const secret = env().ANEDOT_WEBHOOK_SECRET?.trim();
  return secret || null;
}

export function anedotActionPageUrl(): string | null {
  return anedotHostedPageUrl(env().ANEDOT_ACTION_PAGE_URL);
}

export function anedotIntentSigningSecret(): string | null {
  const dedicated = env().ANEDOT_INTENT_SIGNING_SECRET?.trim();
  if (dedicated) return dedicated;
  return anedotWebhookSecret();
}

export function anedotAccountUid(): string | null {
  const uid = env().ANEDOT_ACCOUNT_UID?.trim();
  return uid || null;
}

export function anedotWebhookMaxBytes(): number {
  const raw = Number(env().ANEDOT_WEBHOOK_MAX_BYTES ?? 262144);
  return Number.isFinite(raw) && raw > 0 ? Math.min(raw, 1_048_576) : 262_144;
}

/** Finance-controlled JSON map: Anedot fund identifier or name → Shanah GivingFund slug. */
export function parseAnedotFundAllowlist(): Record<string, string> {
  const raw = env().ANEDOT_FUND_MAP?.trim();
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw) as Record<string, string>;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

export function anedotPublicCheckoutAvailable(): boolean {
  return anedotActivationReady({
    ANEDOT_ACCOUNT_APPROVED: env().ANEDOT_ACCOUNT_APPROVED,
    ANEDOT_GIVING_ENABLED: env().ANEDOT_GIVING_ENABLED,
    ANEDOT_ACTION_PAGE_URL: env().ANEDOT_ACTION_PAGE_URL,
    ANEDOT_WEBHOOK_SECRET: env().ANEDOT_WEBHOOK_SECRET,
    ANEDOT_LEDGER_INTEGRATION_READY: env().ANEDOT_LEDGER_INTEGRATION_READY,
  });
}

/** Accept verified webhooks once ledger integration is ready (UI may still be off). */
export function anedotWebhookAccepting(): boolean {
  return (
    env().ANEDOT_ACCOUNT_APPROVED === "true" &&
    env().ANEDOT_LEDGER_INTEGRATION_READY === "true" &&
    Boolean(anedotWebhookSecret())
  );
}
