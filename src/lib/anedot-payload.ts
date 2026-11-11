export type AnedotWebhookEnvelope = {
  event?: string;
  payload?: Record<string, unknown>;
};

export type AnedotDonationObject = {
  id?: string;
  fees?: {
    anedot_fees?: { amount?: string };
    vendor_fees?: unknown[];
  };
  fund?: { id?: string; name?: string; identifier?: string };
  settlement_date?: string;
};

const DONATION_EVENTS = new Set([
  "donation_completed",
  "donation_settled",
  "donation_ach_returned",
  "donation_refunded",
  "donation_partially_refunded",
  "donation_chargeback",
  "donation_chargeback_reversed",
  "donation_voided",
]);

export function parseAnedotWebhookJson(raw: string): AnedotWebhookEnvelope | null {
  try {
    const parsed = JSON.parse(raw) as AnedotWebhookEnvelope;
    if (!parsed || typeof parsed !== "object") return null;
    return parsed;
  } catch {
    return null;
  }
}

export function anedotEventType(envelope: AnedotWebhookEnvelope): string | null {
  const event = envelope.event;
  return typeof event === "string" && event.trim() ? event.trim() : null;
}

export function anedotDonationFromPayload(
  envelope: AnedotWebhookEnvelope,
): AnedotDonationObject | null {
  const payload = envelope.payload;
  if (!payload || typeof payload !== "object") return null;
  const donation = payload.donation;
  if (!donation || typeof donation !== "object") return null;
  return donation as AnedotDonationObject;
}

export function anedotDonationIdFromEnvelope(envelope: AnedotWebhookEnvelope): string | null {
  const donation = anedotDonationFromPayload(envelope);
  const id = donation?.id;
  return typeof id === "string" && id.trim() ? id.trim() : null;
}

export function anedotPaymentSource(envelope: AnedotWebhookEnvelope): string | null {
  const payload = envelope.payload;
  if (!payload || typeof payload !== "object") return null;
  const source = payload.source;
  return typeof source === "string" ? source : null;
}

export function anedotGrossAmountDollars(envelope: AnedotWebhookEnvelope): number | null {
  const payload = envelope.payload;
  if (!payload || typeof payload !== "object") return null;
  for (const key of ["amount_in_dollars", "event_amount", "donation_amount"] as const) {
    const value = payload[key];
    const amount = parseMoneyString(value);
    if (amount !== null) return amount;
  }
  return null;
}

export function anedotNetAmountDollars(envelope: AnedotWebhookEnvelope): number | null {
  const payload = envelope.payload;
  if (!payload || typeof payload !== "object") return null;
  return parseMoneyString(payload.net_amount);
}

export function anedotFeeAmountDollars(donation: AnedotDonationObject | null): number | null {
  const raw = donation?.fees?.anedot_fees?.amount;
  return parseMoneyString(raw);
}

function parseMoneyString(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;
  const amount = Number(String(value).replace(/,/g, ""));
  return Number.isFinite(amount) ? amount : null;
}

export function anedotIntentReferenceFromPayload(envelope: AnedotWebhookEnvelope): string | null {
  const payload = envelope.payload;
  if (!payload || typeof payload !== "object") return null;
  const utm = payload.utm_content;
  if (typeof utm === "string" && utm.trim()) return utm.trim();
  const responses = payload.custom_field_responses;
  if (Array.isArray(responses)) {
    for (const row of responses) {
      if (!row || typeof row !== "object") continue;
      const label = String((row as { label?: string }).label ?? "").toLowerCase();
      if (label.includes("shanah") && label.includes("intent")) {
        const value = (row as { value?: string }).value;
        if (typeof value === "string" && value.trim()) return value.trim();
      }
    }
  }
  return null;
}

export function anedotDonorName(envelope: AnedotWebhookEnvelope): string {
  const payload = envelope.payload;
  if (!payload || typeof payload !== "object") return "Anedot donor";
  if (typeof payload.name === "string" && payload.name.trim()) return payload.name.trim();
  const first = typeof payload.first_name === "string" ? payload.first_name.trim() : "";
  const last = typeof payload.last_name === "string" ? payload.last_name.trim() : "";
  const combined = `${first} ${last}`.trim();
  return combined || "Anedot donor";
}

export function anedotDonorEmail(envelope: AnedotWebhookEnvelope): string | undefined {
  const payload = envelope.payload;
  if (!payload || typeof payload !== "object") return undefined;
  const email = payload.email;
  return typeof email === "string" && email.trim() ? email.trim() : undefined;
}

export function anedotGivenOnDateKey(envelope: AnedotWebhookEnvelope): string {
  const payload = envelope.payload;
  if (payload && typeof payload === "object") {
    const iso = payload.date_iso8601;
    if (typeof iso === "string" && iso.length >= 10) return iso.slice(0, 10);
    const date = payload.date;
    if (typeof date === "string" && date.length >= 10) {
      const parts = date.slice(0, 10);
      if (/^\d{4}-\d{2}-\d{2}$/.test(parts)) return parts;
      const parsed = new Date(date);
      if (!Number.isNaN(parsed.getTime())) return parsed.toISOString().slice(0, 10);
    }
    const created = payload.created_at;
    if (typeof created === "string" && created.length >= 10) {
      const parsed = new Date(created);
      if (!Number.isNaN(parsed.getTime())) return parsed.toISOString().slice(0, 10);
    }
  }
  return new Date().toISOString().slice(0, 10);
}

export function anedotAccountUid(envelope: AnedotWebhookEnvelope): string | null {
  const payload = envelope.payload;
  if (!payload || typeof payload !== "object") return null;
  const uid = payload.account_uid;
  return typeof uid === "string" && uid.trim() ? uid.trim() : null;
}

export function isKnownAnedotDonationEvent(eventType: string): boolean {
  return DONATION_EVENTS.has(eventType);
}

export type AnedotConfirmPolicy = "confirm_now" | "wait_settlement" | "reverse" | "ignore";

export function anedotConfirmPolicyForEvent(
  eventType: string,
  paymentSource: string | null,
): AnedotConfirmPolicy {
  switch (eventType) {
    case "donation_completed":
      if (paymentSource === "bank_account") return "wait_settlement";
      return "confirm_now";
    case "donation_settled":
      return "confirm_now";
    case "donation_chargeback_reversed":
      return "confirm_now";
    case "donation_ach_returned":
    case "donation_refunded":
    case "donation_partially_refunded":
    case "donation_chargeback":
    case "donation_voided":
      return "reverse";
    default:
      return "ignore";
  }
}

export function anedotLifecycleStatusForEvent(eventType: string): string {
  switch (eventType) {
    case "donation_completed":
      return "completed";
    case "donation_settled":
      return "settled";
    case "donation_ach_returned":
      return "ach_returned";
    case "donation_refunded":
      return "refunded";
    case "donation_partially_refunded":
      return "partially_refunded";
    case "donation_chargeback":
      return "chargeback";
    case "donation_chargeback_reversed":
      return "chargeback_reversed";
    case "donation_voided":
      return "voided";
    default:
      return "unknown";
  }
}
