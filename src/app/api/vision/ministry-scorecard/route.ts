import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getVisionActor, canReadVision } from "@/lib/vision-center-access-server";
import { listMinistryReports } from "@/lib/ministry-report-server";
import { buildVisionMinistryScorecard, VISION_SCORE_CONFIG, type MinistryKey } from "@/lib/vision-ministry-scorecards";

export async function GET(request: Request) {
  const { user, isOwner } = await getVisionActor();
  if (!user) return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  const key = new URL(request.url).searchParams.get("ministry") || "";
  if (!(key in VISION_SCORE_CONFIG)) return NextResponse.json({ error: "Unknown ministry." }, { status: 400 });
  const ministry = key as MinistryKey;
  const plan = await prisma.visionPlan.findUnique({
    where: { year_ministryKey: { year: 2027, ministryKey: ministry } }, select: { id: true },
  });
  if (!plan || !(await canReadVision(plan.id, user.id, isOwner))) {
    return NextResponse.json({ error: "Not authorized." }, { status: 403 });
  }
  const reports = await listMinistryReports({
    groupId: VISION_SCORE_CONFIG[ministry].groupId,
    since: "2027-01", until: "2027-12",
  });
  return NextResponse.json({ scorecard: buildVisionMinistryScorecard(ministry, reports) },
    { headers: { "Cache-Control": "private, no-store" } });
}
