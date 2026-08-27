import { NextResponse } from "next/server";
import { authorizeCronRequest } from "@/lib/cron-auth";
import { processScheduledMeetingReminders } from "@/lib/morning-prayer-notify-server";

async function handleCron(request: Request) {
  const authError = authorizeCronRequest(request);
  if (authError) return authError;

  const result = await processScheduledMeetingReminders();
  return NextResponse.json(result);
}

export async function GET(request: Request) {
  return handleCron(request);
}

export async function POST(request: Request) {
  return handleCron(request);
}
