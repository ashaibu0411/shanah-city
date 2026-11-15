import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getVisionActor, canReadVision } from "@/lib/vision-center-access-server";
import { listMinistryReports } from "@/lib/ministry-report-server";
import { buildMenVisionScorecard } from "@/lib/men-vision-scorecard";

export async function GET() {
  const { user, isOwner } = await getVisionActor();
  if (!user) return NextResponse.json({ error: "Sign in required." }, { status: 401 });

  const plan = await prisma.visionPlan.findUnique({
    where: { year_ministryKey: { year: 2027, ministryKey: "men" } },
    select: { id: true },
  });
  if (!plan || !(await canReadVision(plan.id, user.id, isOwner))) {
    return NextResponse.json({ error: "Not authorized." }, { status: 403 });
  }

  const reports = await listMinistryReports({ groupId: "group-men-legacy", since: "2027-01", until: "2027-12" });
  return NextResponse.json({ scorecard: buildMenVisionScorecard(reports) }, {
    headers: { "Cache-Control": "private, no-store" },
  });
}
