import { NextResponse } from "next/server";
import { recordSmsKeyword, verifyTwilioWebhook } from "@/lib/sms-server";

export async function POST(request: Request) {
  const type = request.headers.get("content-type") ?? "";
  if (!type.includes("application/x-www-form-urlencoded")) return NextResponse.json({ error: "Unsupported request" }, { status: 415 });
  const body = await request.text();
  if (body.length > 8192) return NextResponse.json({ error: "Payload too large" }, { status: 413 });
  const params = Object.fromEntries(new URLSearchParams(body));
  const publicOrigin = process.env.TWILIO_WEBHOOK_BASE_URL;
  if (!publicOrigin) return NextResponse.json({ error: "Webhook not configured" }, { status: 503 });
  const url = publicOrigin.replace(/\/$/, "") + new URL(request.url).pathname;
  if (!verifyTwilioWebhook(url, params, request.headers.get("x-twilio-signature") ?? "")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }
  const result = await recordSmsKeyword(params.From ?? "", params.Body ?? "");
  // Twilio's Messaging Service can handle standard keyword replies; do not duplicate them.
  return new Response("<Response></Response>", { headers: { "Content-Type": "text/xml", "Cache-Control": "no-store", "X-SMS-Keyword-Result": result } });
}
