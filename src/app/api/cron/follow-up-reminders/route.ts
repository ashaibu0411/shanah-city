import { NextResponse } from "next/server";
import { authorizeCronRequest } from "@/lib/cron-auth";
import { processFollowUpReminders } from "@/lib/follow-up-reminders-server";
export async function GET(request:Request) {
 const error=authorizeCronRequest(request);
 if(error)return error;
 return NextResponse.json(await processFollowUpReminders());
}
