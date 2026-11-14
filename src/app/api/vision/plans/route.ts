import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { VISION_2027_DRAFTS } from "@/lib/vision-2027-drafts";
import { getUserById } from "@/lib/auth-server";
import { getGroups } from "@/lib/group-server";
import { getVisionActor, canReadVision, safeVisionString, VISION_MINISTRIES } from "@/lib/vision-center-access-server";

function deny(code = 403) { return NextResponse.json({ error: code === 401 ? "Sign in required." : "Not authorized." }, { status: code }); }
function invalid(message: string) { return NextResponse.json({ error: message }, { status: 400 }); }
function audit(planId: string, actorId: string, action: string, detail?: string) {
  return prisma.visionAuditEvent.create({ data: { planId, actorId, action, detail } });
}

export async function GET(request: Request) {
  const { user, isOwner } = await getVisionActor();
  if (!user) return deny(401);
  const planId = new URL(request.url).searchParams.get("planId");
  if (planId) {
    if (!(await canReadVision(planId, user.id, isOwner))) return deny();
    const plan = await prisma.visionPlan.findUnique({
      where: { id: planId },
      include: { assignments: isOwner ? true : { where: { userId: user.id } }, comments: { orderBy: { createdAt: "asc" }, take: 250 } },
    });
    return plan ? NextResponse.json({ plan, isOwner }) : NextResponse.json({ error: "Not found." }, { status: 404 });
  }
  const plans = await prisma.visionPlan.findMany({
    where: isOwner ? { year: 2027 } : { year: 2027, assignments: { some: { userId: user.id } } },
    include: { assignments: isOwner ? true : { where: { userId: user.id } }, _count: { select: { comments: true } } },
    orderBy: { title: "asc" },
  });
  const leaders = isOwner ? await (async () => {
    const groups = await getGroups();
    const ids = [...new Set(groups.flatMap(g => [...g.adminIds, ...(g.assistantAdminIds || [])]))];
    const users = await Promise.all(ids.map(getUserById));
    return users.filter((u): u is NonNullable<typeof u> => Boolean(u))
      .map(u => ({ id: u.id, name: u.name }))
      .sort((a, b) => a.name.localeCompare(b.name));
  })() : [];
  return NextResponse.json({ plans, isOwner, ministries: isOwner ? VISION_MINISTRIES : [], leaders });
}

export async function POST(request: Request) {
  const { user, isOwner } = await getVisionActor();
  if (!user) return deny(401);
  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object") return invalid("Invalid request.");
  const action = safeVisionString(body.action, 32);
  if (action === "comment") {
    const planId = safeVisionString(body.planId, 100);
    if (!(await canReadVision(planId, user.id, isOwner))) return deny();
    const currentPlan = await prisma.visionPlan.findUnique({ where: { id: planId }, select: { status: true } });
    if (!currentPlan || currentPlan.status === "approved") return invalid("Discussion is closed for approved plans.");
    const text = safeVisionString(body.body, 3000);
    if (!text) return invalid("Enter a question or suggestion.");
    const kind = body.kind === "idea" ? "idea" : "question";
    const sectionKey = safeVisionString(body.sectionKey, 100) || "general";
    const comment = await prisma.visionComment.create({ data: { planId, authorId: user.id, authorName: user.name, body: text, kind, sectionKey } });
    await audit(planId, user.id, "comment", kind);
    return NextResponse.json({ comment }, { status: 201 });
  }
  if (!isOwner) return deny();
  if (action === "initialize-2027") {
    let created = 0;
    for (const draft of VISION_2027_DRAFTS) {
      const existing = await prisma.visionPlan.findUnique({ where: { year_ministryKey: { year: 2027, ministryKey: draft.ministryKey } } });
      if (existing) continue;
      const plan = await prisma.visionPlan.create({
        data: { year: 2027, ministryKey: draft.ministryKey, title: draft.title, summary: draft.summary, content: draft.content, createdById: user.id },
      });
      await audit(plan.id, user.id, "initialized-working-draft");
      created++;
    }
    return NextResponse.json({ created });
  }
  if (action === "create") {
    const ministryKey = safeVisionString(body.ministryKey, 50);
    const ministry = VISION_MINISTRIES.find(x => x.key === ministryKey);
    if (!ministry) return invalid("Choose a ministry.");
    const summary = safeVisionString(body.summary, 1000);
    const content = safeVisionString(body.content, 20000);
    if (!content) return invalid("Enter the pastoral direction.");
    const plan = await prisma.visionPlan.create({
      data: { year: 2027, ministryKey, title: ministry.title, summary, content, createdById: user.id },
    }).catch(() => null);
    if (!plan) return invalid("A plan for this ministry may already exist.");
    await audit(plan.id, user.id, "created");
    return NextResponse.json({ plan }, { status: 201 });
  }
  if (action === "assign") {
    const planId = safeVisionString(body.planId, 100);
    const userId = safeVisionString(body.userId, 120);
    if (!userId || !(await getUserById(userId))) return invalid("Choose a valid Shanah City member account.");
    const plan = await prisma.visionPlan.findUnique({ where: { id: planId } });
    if (!plan || plan.status === "approved") return invalid("Assignment is unavailable.");
    const deadline = body.deadline && /^\d{4}-\d{2}-\d{2}$/.test(body.deadline)
      ? new Date(body.deadline + "T23:59:59.000Z") : null;
    const assignment = await prisma.visionAssignment.upsert({
      where: { planId_userId: { planId, userId } },
      create: { planId, userId, deadline },
      update: { deadline },
    });
    await audit(planId, user.id, "assigned", userId);
    return NextResponse.json({ assignment });
  }
  return invalid("Unknown action.");
}

export async function PATCH(request: Request) {
  const { user, isOwner } = await getVisionActor();
  if (!user) return deny(401);
  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object") return invalid("Invalid request.");
  const planId = safeVisionString(body.planId, 100);
  const action = safeVisionString(body.action, 40);
  if (!(await canReadVision(planId, user.id, isOwner))) return deny();
  const plan = await prisma.visionPlan.findUnique({ where: { id: planId } });
  if (!plan) return NextResponse.json({ error: "Not found." }, { status: 404 });
  if (action === "acknowledge" || action === "save-response" || action === "submit") {
    const assignment = await prisma.visionAssignment.findUnique({ where: { planId_userId: { planId, userId: user.id } } });
    if (!assignment) return deny();
    if (plan.status === "approved") return invalid("Approved plans are read-only.");
    const update = action === "acknowledge"
      ? { acknowledgedAt: new Date(), status: "acknowledged" }
      : { capacity: safeVisionString(body.capacity, 100), proposal: safeVisionString(body.proposal, 12000), supportNeeds: safeVisionString(body.supportNeeds, 5000), status: action === "submit" ? "submitted" : "in_review", ...(action === "submit" ? { submittedAt: new Date() } : {}) };
    if (action === "submit" && !safeVisionString(body.proposal, 12000)) return invalid("Enter your proposed contribution before submitting.");
    const result = await prisma.visionAssignment.update({ where: { id: assignment.id }, data: update });
    await audit(planId, user.id, action);
    return NextResponse.json({ assignment: result });
  }
  if (!isOwner) return deny();
  if (action === "update-plan") {
    if (plan.status === "approved") return invalid("An approved plan cannot be overwritten.");
    const content = safeVisionString(body.content, 20000);
    if (!content) return invalid("Vision content cannot be empty.");
    const updated = await prisma.visionPlan.update({ where: { id: planId }, data: { content, summary: safeVisionString(body.summary, 1000), version: { increment: 1 } } });
    await audit(planId, user.id, "revised", String(updated.version));
    return NextResponse.json({ plan: updated });
  }
  if (action === "approve" || action === "request-revision") {
    if (plan.status === "approved") return invalid("This plan is already approved.");
    if (action === "approve") {
      const submissions = await prisma.visionAssignment.count({ where: { planId, status: "submitted" } });
      if (submissions === 0) return invalid("At least one leader submission is required.");
    }
    const updated = await prisma.visionPlan.update({
      where: { id: planId },
      data: action === "approve" ? { status: "approved", approvedAt: new Date(), approvedById: user.id } : { status: "in_review" },
    });
    if (action === "request-revision") await prisma.visionAssignment.updateMany({ where: { planId, status: "submitted" }, data: { status: "revision_requested" } });
    await audit(planId, user.id, action, safeVisionString(body.note, 1000));
    return NextResponse.json({ plan: updated });
  }
  return invalid("Unknown action.");
}
