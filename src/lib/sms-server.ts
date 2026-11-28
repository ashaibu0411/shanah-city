import { createHmac, timingSafeEqual } from "node:crypto";
import { prisma } from "@/lib/db";
import { SMS_CONSENT_DISCLOSURE_VERSION } from "@/lib/sms-consent-copy";

export function normalizeUsPhone(value: string): string | null {
  const digits = value.replace(/\D/g, "");
  if (digits.length === 10) return "+1" + digits;
  if (digits.length === 11 && digits.startsWith("1")) return "+" + digits;
  return null;
}

/** Twilio signs the public webhook URL and sorted form parameters. */
export function verifyTwilioWebhook(url: string, params: Record<string, string>, signature: string): boolean {
  const token = process.env.TWILIO_AUTH_TOKEN;
  if (!token || !signature) return false;
  const payload = url + Object.keys(params).sort().map(key => key + params[key]).join("");
  const expected = createHmac("sha1", token).update(payload).digest("base64");
  const left = Buffer.from(expected);
  const right = Buffer.from(signature);
  return left.length === right.length && timingSafeEqual(left, right);
}

export async function recordSmsConsent(
  phoneInput: string,
  source: string,
  disclosureVersion = SMS_CONSENT_DISCLOSURE_VERSION,
  subscriberName?: string | null,
) {
  const phone = normalizeUsPhone(phoneInput);
  if (!phone) throw new Error("Invalid US mobile number");
  const trimmedName = subscriberName?.trim().slice(0, 120) || null;

  await prisma.$transaction(async (tx) => {
    await tx.smsConsentEvent.create({
      data: {
        phone,
        eventType: "web_opt_in",
        source,
        disclosureVersion,
        subscriberName: trimmedName,
      },
    });
    await tx.smsContactState.upsert({
      where: { phone },
      create: { phone, optedOut: false },
      update: { optedOut: false, optedOutAt: null },
    });
  });
}

/** Dedicated /sms-consent page — does not create guest records or follow-up tasks. */
export async function subscribeSmsFromPublicForm(input: {
  name: string;
  phone: string;
  consent: boolean;
  source?: string;
}) {
  if (input.consent !== true) {
    return { ok: false as const, error: "SMS consent checkbox is required.", status: 400 };
  }
  const phone = normalizeUsPhone(input.phone);
  if (!phone) {
    return { ok: false as const, error: "Enter a valid US mobile phone number.", status: 400 };
  }
  const name = input.name.trim();
  if (name.length < 2) {
    return { ok: false as const, error: "Enter your name.", status: 400 };
  }

  const source = input.source?.trim() || "sms-consent-page";
  const existing = await prisma.smsConsentEvent.findFirst({
    where: { phone, eventType: "web_opt_in" },
    orderBy: { createdAt: "desc" },
  });
  const stopped = await prisma.smsConsentEvent.findFirst({
    where: { phone, eventType: "carrier_stop" },
    orderBy: { createdAt: "desc" },
  });
  if (
    existing &&
    (!stopped || existing.createdAt > stopped.createdAt) &&
    existing.disclosureVersion === SMS_CONSENT_DISCLOSURE_VERSION
  ) {
    return { ok: true as const, alreadySubscribed: true };
  }

  await recordSmsConsent(phone, source, SMS_CONSENT_DISCLOSURE_VERSION, name);
  return { ok: true as const, alreadySubscribed: false };
}

export async function recordSmsKeyword(phoneInput: string, keywordInput: string) {
  const phone = normalizeUsPhone(phoneInput);
  if (!phone) return "invalid" as const;
  const keyword = keywordInput.trim().split(/\s+/)[0]?.toUpperCase() ?? "";
  const stop = ["STOP", "STOPALL", "UNSUBSCRIBE", "CANCEL", "END", "QUIT"].includes(keyword);
  const start = ["START", "UNSTOP"].includes(keyword);
  const help = keyword === "HELP" || keyword === "INFO";
  if (!stop && !start && !help) return "ignored" as const;
  await prisma.$transaction(async tx => {
    if (stop || start) {
      await tx.smsContactState.upsert({
        where: { phone },
        create: { phone, optedOut: stop, optedOutAt: stop ? new Date() : null, lastKeyword: keyword },
        update: { optedOut: stop, optedOutAt: stop ? new Date() : null, lastKeyword: keyword },
      });
    }
    await tx.smsConsentEvent.create({ data: { phone, eventType: stop ? "carrier_stop" : start ? "carrier_start" : "carrier_help", source: "twilio_inbound" } });
  });
  return stop ? "stop" as const : start ? "start" as const : "help" as const;
}

export async function canSendSms(phoneInput: string, purpose: "marketing" | "transactional") {
  const phone = normalizeUsPhone(phoneInput);
  if (!phone || process.env.SMS_SENDING_ENABLED !== "true" || !process.env.TWILIO_MESSAGING_SERVICE_SID) return false;
  const state = await prisma.smsContactState.findUnique({ where: { phone } });
  if (state?.optedOut) return false;
  if (purpose === "marketing") {
    const consent = await prisma.smsConsentEvent.findFirst({ where: { phone, eventType: { in: ["web_opt_in", "carrier_start"] } }, orderBy: { createdAt: "desc" } });
    if (!consent) return false;
    const lastStop = await prisma.smsConsentEvent.findFirst({ where: { phone, eventType: "carrier_stop" }, orderBy: { createdAt: "desc" } });
    if (lastStop && lastStop.createdAt >= consent.createdAt) return false;
  }
  return true;
}

/** No outbound transport is enabled here; the sending pipeline must be separately reviewed. */
export function safeKidsSmsBody(kind: "checkin" | "checkout" | "contact") {
  if (kind === "checkin") return "Shanah Kids: Your child's check-in is confirmed. Contact the Kids Ministry desk for your private pickup instructions. Reply STOP to opt out or HELP for help.";
  if (kind === "checkout") return "Shanah Kids: Your child's checkout has been completed. For questions, contact the Kids Ministry desk. Reply STOP to opt out or HELP for help.";
  return "Shanah Kids: Please contact the Kids Ministry desk regarding your child. Reply STOP to opt out or HELP for help.";
}
