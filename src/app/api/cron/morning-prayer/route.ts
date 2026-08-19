import { NextResponse } from "next/server";
import { processScheduledMeetingReminders } from "@/lib/morning-prayer-notify-server";

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret) {
    return NextResponse.json({ error: "Cron not configured." }, { status: 503 });
  }

  const auth = request.headers.get("authorization");
  if (auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const result = await processScheduledMeetingReminders();
  return NextResponse.json(result);
}
