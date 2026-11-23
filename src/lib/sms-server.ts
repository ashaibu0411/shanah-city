import { createHmac, timingSafeEqual } from "node:crypto";
import { prisma } from "@/lib/db";

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

export async function recordSmsConsent(phoneInput: string, source: string, disclosureVersion = "2026-11-23") {
  const phone = normalizeUsPhone(phoneInput);
  if (!phone) throw new Error("Invalid US mobile number");
  // A web checkbox cannot reverse a carrier STOP. Only a verified carrier opt-in can.
  await prisma.smsConsentEvent.create({ data: { phone, eventType: "web_opt_in", source, disclosureVersion } });
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
