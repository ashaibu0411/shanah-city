import { NextResponse } from "next/server";
import { authorizeCronRequest } from "@/lib/cron-auth";
import { prisma } from "@/lib/db";
import { fastingGuideNotifyDue, FASTING_GUIDE_DAYS } from "@/lib/fasting-guide-2026";
import { sendPushToAllMembers, shouldMarkScheduledPushComplete } from "@/lib/push-server";

async function run(request: Request) {
  const authError = authorizeCronRequest(request);
  if (authError) return authError;
  const day = fastingGuideNotifyDue();
  if (!day) return NextResponse.json({ skipped: true, reason: "outside_daily_denver_window" });
  // Atomic insert: concurrent/repeated cron invocations cannot both send the same day.
  try {
    await prisma.fastingGuideNotification.create({ data: { day } });
  } catch (error) {
    // Unique-key collision is the expected already-claimed state.
    if (typeof error === "object" && error !== null && "code" in error && error.code === "P2002") {
      return NextResponse.json({ skipped: true, day, reason: "already_claimed" });
    }
    throw error;
  }
  try {
    const [focus] = FASTING_GUIDE_DAYS[day - 1];
    const result = await sendPushToAllMembers({
      title: `Day ${day} · 14 Days of Prayer`,
      body: `${focus}. Tap to read today's scriptures and prophetic prayers.`,
      url: `/fasting-prayer-2027/day/${day}`,
    }, "devotions");
    if (!shouldMarkScheduledPushComplete(result)) {
      await prisma.fastingGuideNotification.delete({ where: { day } });
      return NextResponse.json({ day, sent: result.sent, configured: result.configured, retry: true, reason: "delivery_not_complete" });
    }
    await prisma.fastingGuideNotification.update({ where: { day }, data: { deliveredAt: new Date(), sentCount: result.sent } });
    return NextResponse.json({ day, sent: result.sent, skipped: result.skipped, configured: result.configured });
  } catch (error) {
    // Release the claim for retry. A partial provider send may have occurred.
    await prisma.fastingGuideNotification.delete({ where: { day } }).catch(() => undefined);
    throw error;
  }
}
export async function GET(request: Request) { return run(request); }
export async function POST(request: Request) { return run(request); }
