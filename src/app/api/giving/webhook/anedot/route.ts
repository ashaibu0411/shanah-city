import { NextResponse } from "next/server";
import { anedotWebhookAccepting, anedotWebhookMaxBytes, anedotWebhookSecret } from "@/lib/anedot-env";
import { processAnedotWebhook } from "@/lib/anedot-webhook-server";

export const runtime = "nodejs";

export async function POST(request: Request) {
  if (!anedotWebhookAccepting()) {
    return NextResponse.json({ error: "Anedot webhook is not configured." }, { status: 503 });
  }

  const secret = anedotWebhookSecret();
  if (!secret) {
    return NextResponse.json({ error: "Anedot webhook is not configured." }, { status: 503 });
  }

  const contentLength = Number(request.headers.get("content-length") ?? "0");
  const maxBytes = anedotWebhookMaxBytes();
  if (contentLength > maxBytes) {
    return NextResponse.json({ error: "Payload too large." }, { status: 413 });
  }

  const rawBody = await request.text();
  if (Buffer.byteLength(rawBody, "utf8") > maxBytes) {
    return NextResponse.json({ error: "Payload too large." }, { status: 413 });
  }

  const signature = request.headers.get("x-request-signature");
  const requestId = request.headers.get("x-request-id");

  const result = await processAnedotWebhook({
    rawBody,
    signature,
    requestId,
    secret,
  });

  return NextResponse.json(
    { ok: result.status < 400, outcome: result.outcome },
    { status: result.status },
  );
}
