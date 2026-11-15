import { NextResponse } from "next/server";
import { authorizeCronRequest } from "@/lib/cron-auth";
import { processVisionReminders } from "@/lib/vision-reminder-cron";

export async function GET(request: Request) {
  const error = authorizeCronRequest(request);
  if (error) return error;
  return NextResponse.json(await processVisionReminders());
}
