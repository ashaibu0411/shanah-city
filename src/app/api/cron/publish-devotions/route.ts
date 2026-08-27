import { NextResponse } from "next/server";
import { authorizeCronRequest } from "@/lib/cron-auth";
import { processScheduledDevotionNotifications } from "@/lib/devotion-notify-server";

async function handleCron(request: Request) {
  const authError = authorizeCronRequest(request);
  if (authError) return authError;

  const result = await processScheduledDevotionNotifications();
  return NextResponse.json(result);
}

export async function GET(request: Request) {
  return handleCron(request);
}

export async function POST(request: Request) {
  return handleCron(request);
}
