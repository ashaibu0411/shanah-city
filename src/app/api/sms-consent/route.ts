import { NextResponse } from "next/server";
import { subscribeSmsFromPublicForm } from "@/lib/sms-server";

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const record = body as { name?: string; phone?: string; consent?: boolean; website?: string };
  if (record.website) {
    return NextResponse.json({ error: "Could not process request." }, { status: 400 });
  }

  const result = await subscribeSmsFromPublicForm({
    name: String(record.name ?? ""),
    phone: String(record.phone ?? ""),
    consent: record.consent === true,
    source: "sms-consent-page",
  });

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  return NextResponse.json({
    message: result.alreadySubscribed
      ? "This number is already subscribed to Shanah City SMS updates."
      : "Thank you. Your SMS consent has been recorded.",
    alreadySubscribed: result.alreadySubscribed,
  });
}