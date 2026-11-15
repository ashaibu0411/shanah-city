import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getVisionActor, canReadVision, safeVisionString } from "@/lib/vision-center-access-server";
import { listMinistryReports } from "@/lib/ministry-report-server";

function deny(code = 403) { return NextResponse.json({ error: code === 401 ? "Sign in required." : "Not authorized." }, { status: code }); }
function validDay(day: string) {
  if (!/^20\d\d-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/.test(day)) return false;
  return new Date(day + "T00:00:00Z").toISOString().slice(0, 10) === day;
}

export async function GET(request: Request) {
  const { user, isOwner } = await getVisionActor();
  if (!user) return deny(401);
  const params = new URL(request.url).searchParams;
  const planId = params.get("planId");
  const overview = params.get("overview") === "1";

  if (overview) {
    if (!isOwner) return deny();
    const plans = await prisma.visionPlan.findMany({ where: { year: 2027 }, select: {
      id: true, title: true, ministryKey: true, status: true,
      assignments: { select: { userId: true, status: true, acknowledgedAt: true, submittedAt: true } },
      milestones: { select: { status: true, dueOn: true, assigneeId: true, kind: true } },
    } });
    const reports = await listMinistryReports({ since: "2027-01", until: "2027-12" });
    const groupByMinistry: Record<string, string> = {
      men: "group-men-legacy", women: "group-shanah-ladies", worship: "group-choir", "young-adults": "group-young-adults",
    };
    const overviewPlans = plans.map(plan => {
      const groupId = groupByMinistry[plan.ministryKey];
      const relevant = groupId ? reports.filter(report => report.groupId === groupId) : [];
      const latest = relevant.sort((a, b) => b.reportMonth.localeCompare(a.reportMonth))[0] ?? null;
      return {
        ...plan,
        latestReport: latest ? { month: latest.reportMonth, status: latest.status } : null,
        submittedReports: relevant.filter(report => report.status === "submitted" || report.status === "reviewed").length,
        reportIntegrated: Boolean(groupId),
      };
    });
    return NextResponse.json({ plans: overviewPlans }, { headers: { "Cache-Control": "private, no-store" } });
  }

  if (planId) {
    if (!(await canReadVision(planId, user.id, isOwner))) return deny();
    const milestones = await prisma.visionMilestone.findMany({
      where: { planId, ...(isOwner ? {} : { assigneeId: user.id }) },
      orderBy: [{ dueOn: "asc" }, { kind: "asc" }],
    });
    return NextResponse.json({ milestones }, { headers: { "Cache-Control": "private, no-store" } });
  }

  const milestones = await prisma.visionMilestone.findMany({
    where: { assigneeId: user.id, plan: { year: 2027 } },
    include: { plan: { select: { title: true, status: true } } },
    orderBy: { dueOn: "asc" },
    take: 240,
  });
  return NextResponse.json({ milestones }, { headers: { "Cache-Control": "private, no-store" } });
}

export async function POST(request: Request) {
  const { user, isOwner } = await getVisionActor();
  if (!user) return deny(401);
  const data = await request.json().catch(() => null);
  if (!data || typeof data !== "object") return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  const action = safeVisionString(data.action, 24);
  const planId = safeVisionString(data.planId, 100);
  if (!(await canReadVision(planId, user.id, isOwner))) return deny();
  const plan = await prisma.visionPlan.findUnique({ where: { id: planId }, select: { status: true, year: true } });
  if (!plan || plan.status !== "approved") return NextResponse.json({ error: "Milestones are activated after pastoral approval." }, { status: 409 });

  if (action === "create") {
    if (!isOwner) return deny();
    const assigneeId = safeVisionString(data.assigneeId, 130);
    const dueOn = safeVisionString(data.dueOn, 20);
    const title = safeVisionString(data.title, 180);
    const description = safeVisionString(data.description, 1600);
    if (!title || !validDay(dueOn) || !(await prisma.visionAssignment.findUnique({ where: { planId_userId: { planId, userId: assigneeId } } }))) {
      return NextResponse.json({ error: "Choose an assigned leader, valid date and title." }, { status: 400 });
    }
    const milestone = await prisma.visionMilestone.create({ data: {
      planId, assigneeId, kind: "custom", period: "custom-" + crypto.randomUUID(),
      title, description, dueOn,
    } });
    await prisma.visionAuditEvent.create({ data: { planId, actorId: user.id, action: "milestone-created", detail: milestone.id } });
    return NextResponse.json({ milestone }, { status: 201 });
  }

  if (action === "complete" || action === "reopen") {
    const id = safeVisionString(data.id, 100);
    const milestone = await prisma.visionMilestone.findFirst({ where: { id, planId } });
    if (!milestone || (!isOwner && milestone.assigneeId !== user.id)) return deny();
    const updated = await prisma.visionMilestone.update({ where: { id }, data: action === "complete" ? {
      status: "complete", completedAt: new Date(), completedById: user.id,
    } : { status: "pending", completedAt: null, completedById: null } });
    await prisma.visionAuditEvent.create({ data: { planId, actorId: user.id, action: "milestone-" + action, detail: id } });
    return NextResponse.json({ milestone: updated });
  }

  return NextResponse.json({ error: "Invalid action." }, { status: 400 });
}
