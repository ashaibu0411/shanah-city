import { prisma } from "@/lib/db";
import { normalizeUsPhone } from "@/lib/sms-server";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getUserFromSession, SESSION_COOKIE } from "@/lib/auth-server";
import { canManageAsAdmin } from "@/lib/admin-access-server";
import { prepareShanahSms, type ShanahSmsKind } from "@/lib/sms-notification-preparation-server";
import { enforceRateLimit, getClientIp, rateLimitResponse } from "@/lib/rate-limit-server";

const kinds: ShanahSmsKind[] = ["announcement", "event_reminder", "visitor_followup", "kids_checkin", "kids_checkout", "kids_contact"];

export async function POST(request: Request) {
  const user = await getUserFromSession((await cookies()).get(SESSION_COOKIE)?.value);
  if (!user || !(await canManageAsAdmin(user))) {
    return NextResponse.json({ error: "Administrator access required." }, { status: 403 });
  }
  const limit = await enforceRateLimit(`sms:preview:${user.id}:${getClientIp(request)}`, { limit: 30, windowSeconds: 15 * 60 });
  if (!limit.allowed) return rateLimitResponse(limit.retryAfterSeconds);
  const body = await request.json().catch(() => null);
  if (!body || !kinds.includes(body.kind)) return NextResponse.json({ error: "Invalid message category." }, { status: 400 });
  try {
    const draft = await prepareShanahSms({
      kind: body.kind,
      phone: String(body.phone ?? ""),
      title: String(body.title ?? ""),
      detail: String(body.detail ?? ""),
    });
    if (body.channel === "whatsapp") {
      const phone = normalizeUsPhone(String(body.phone ?? ""));
      const consent = phone ? await prisma.whatsAppContactState.findUnique({ where: { phone } }) : null;
      const configured = Boolean(process.env.TWILIO_WHATSAPP_SENDER && process.env.TWILIO_ACCOUNT_SID);
      return NextResponse.json({
        ...draft,
        channel: "whatsapp",
        eligible: false,
        whatsAppOptedIn: consent?.optedIn === true,
        senderConfigured: configured,
        notice: "WhatsApp preview only. No message sent. Approved WhatsApp sender and templates are required before launch.",
      }, { headers: { "Cache-Control": "no-store" } });
    }
    return NextResponse.json({ ...draft, notice: "Preview only. No text message was sent." }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to prepare message." }, { status: 400 });
  }
}
