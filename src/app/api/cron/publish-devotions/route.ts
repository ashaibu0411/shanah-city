import { NextResponse } from "next/server";
import { authorizeCronRequest } from "@/lib/cron-auth";
import { processScheduledDevotionNotifications } from "@/lib/devotion-notify-server";

async function handleCron(request: Request) {
  const authError = authorizeCronRequest(request);
  if (authError) return authError;

  const result = await processScheduledDevotionNotifications();
  console.info("[devotion-cron] delivery", JSON.stringify({
    denverDate: result.denverDate,
    denverTime: result.denverTime,
    notified: result.notified,
    checked: result.checked,
    reason: result.reason,
    devotions: result.devotions,
    pushConfigured: result.pushConfigured,
    pushDiagnostics: result.pushDiagnostics,
  }));
  return NextResponse.json(result);
}

export async function GET(request: Request) {
  return handleCron(request);
}

export async function POST(request: Request) {
  return handleCron(request);
}
