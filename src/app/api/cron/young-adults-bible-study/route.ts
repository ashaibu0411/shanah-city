import { NextResponse } from "next/server";
import { authorizeCronRequest } from "@/lib/cron-auth";
import { processMondayBibleStudyReminders } from "@/lib/group-ministry-hub-program-server";

async function handleCron(request: Request) {
  const authError = authorizeCronRequest(request);
  if (authError) return authError;

  const result = await processMondayBibleStudyReminders();
  return NextResponse.json(result);
}

export async function GET(request: Request) {
  return handleCron(request);
}

export async function POST(request: Request) {
  return handleCron(request);
}
