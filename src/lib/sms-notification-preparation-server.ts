import { canSendSms, normalizeUsPhone, safeKidsSmsBody } from "@/lib/sms-server";

/**
 * Server-side SMS preparation only. Never sends an SMS.
 * Campaign approval and a separate audited transport are required before delivery.
 */
export type ShanahSmsKind =
  | "announcement"
  | "event_reminder"
  | "visitor_followup"
  | "kids_checkin"
  | "kids_checkout"
  | "kids_contact";

type SmsDraft = {
  kind: ShanahSmsKind;
  phone: string;
  body: string;
  purpose: "marketing" | "transactional";
};

function safePlainText(value: string, max: number): string {
  return value.replace(/[\r\n\t]+/g, " ").replace(/\s+/g, " ").trim().slice(0, max);
}

export function buildShanahSmsDraft(input: {
  kind: ShanahSmsKind;
  phone: string;
  title?: string;
  detail?: string;
}): SmsDraft {
  const phone = normalizeUsPhone(input.phone);
  if (!phone) throw new Error("Valid US mobile number required.");
  const title = safePlainText(input.title ?? "", 70);
  const detail = safePlainText(input.detail ?? "", 240);
  if (input.kind.startsWith("kids_")) {
    // Do not include child names, medical details, incident details or pickup credentials.
    const type = input.kind === "kids_checkin" ? "checkin" : input.kind === "kids_checkout" ? "checkout" : "contact";
    return { kind: input.kind, phone, body: safeKidsSmsBody(type), purpose: "transactional" };
  }
  if (!title || !detail) throw new Error("Title and message are required.");
  const category = input.kind === "announcement" ? "Church update" : input.kind === "event_reminder" ? "Event reminder" : "Welcome follow-up";
  return {
    kind: input.kind,
    phone,
    purpose: "marketing",
    body: `Shanah City — ${category}: ${title}. ${detail} Reply STOP to opt out or HELP for help.`,
  };
}

export async function prepareShanahSms(input: Parameters<typeof buildShanahSmsDraft>[0]) {
  const draft = buildShanahSmsDraft(input);
  const eligible = await canSendSms(draft.phone, draft.purpose);
  return {
    ...draft,
    eligible,
    // Hard stop: preparing a draft never calls Twilio, even if the sending flag is enabled.
    deliveryStatus: "not_sent" as const,
    requiresCampaignApproval: true as const,
  };
}
