import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getUserFromSession, SESSION_COOKIE } from "@/lib/auth-server";
import { canAccessFollowUp, canManageFollowUp, getConfiguredFollowUpGroupId } from "@/lib/follow-up-access-server";
import { getGroupDetail, getGroups } from "@/lib/group-server";
import { isFollowUpGroup } from "@/lib/follow-up-types";
import { memberHasFullGroupAccess } from "@/lib/ministry-readiness-server";

async function viewer() {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  const user = await getUserFromSession(token);
  return user && await canAccessFollowUp(user) ? user : null;
}

async function workers() {
  const groups = await getGroups();
  const group = groups.find(g => g.id === getConfiguredFollowUpGroupId()) ?? groups.find(isFollowUpGroup);
  if (!group) return [];
  const detail = await getGroupDetail(group.id);
  const candidates = detail?.members ?? [];
  const allowed = await Promise.all(candidates.map(async m => ({
    id: m.id, name: m.name,
    allowed: (await memberHasFullGroupAccess(m.id, group.id)).allowed,
  })));
  const eligible = allowed.filter(m => m.allowed).map(({ id, name }) => ({ id, name }));
  const availability = await prisma.followUpWorkerAvailability.findMany({where:{userId:{in:eligible.map(w=>w.id)}}});
  const unavailable = new Set(availability.filter(a=>!a.available).map(a=>a.userId));
  return eligible.filter(w=>!unavailable.has(w.id));
}

export async function GET() {
  const user = await viewer();
  if (!user) return NextResponse.json({ error: "Follow-up access required." }, { status: 403 });
  const isLeader = await canManageFollowUp(user);
  const assignments = await prisma.guestFollowUpAssignment.findMany({
    where: isLeader ? undefined : { workerId: user.id },
    orderBy: { dueAt: "asc" }, take: 500,
  });
  return NextResponse.json({ assignments, workers: isLeader ? await workers() : [], isLeader, viewerId: user.id });
}

export async function POST(request: Request) {
  const user = await viewer();
  if (!user || !(await canManageFollowUp(user))) return NextResponse.json({ error: "Leader access required." }, { status: 403 });
  const body = await request.json().catch(() => null);
  const guestId = typeof body?.guestId === "string" ? body.guestId.trim() : "";
  const workerId = typeof body?.workerId === "string" ? body.workerId.trim() : "";
  if (!guestId || guestId.length > 120 || !workerId || workerId.length > 120) return NextResponse.json({ error: "Guest and worker required." }, { status: 400 });
  const eligible = (await workers()).find(w => w.id === workerId);
  if (!eligible) return NextResponse.json({ error: "Select an active Follow-Up Ministry worker." }, { status: 400 });
  const guest = await prisma.guestSubmission.findUnique({ where: { id: guestId }, select: { id: true, status: true, submittedAt: true } });
  if (!guest) return NextResponse.json({ error: "Guest not found." }, { status: 404 });
  if (guest.status === "archived") return NextResponse.json({ error: "Archived guests cannot be assigned." }, { status: 400 });
  const dueAt = new Date(Math.max(Date.now(), guest.submittedAt.getTime()) + 24 * 60 * 60 * 1000);
  const assignment = await prisma.guestFollowUpAssignment.upsert({
    where: { guestId },
    create: { guestId, workerId, workerName: eligible.name, assignedById: user.id, dueAt, completedAt: guest.status === "contacted" ? new Date() : null },
    update: { workerId, workerName: eligible.name, assignedById: user.id, assignedAt: new Date(), dueAt, completedAt: guest.status === "contacted" ? new Date() : null },
  });
  await prisma.pushInboxItem.upsert({
    where: { userId_dedupeKey: { userId: workerId, dedupeKey: `follow-up-assigned:${guestId}:${assignment.assignedAt.toISOString()}` } },
    create: { userId: workerId, dedupeKey: `follow-up-assigned:${guestId}:${assignment.assignedAt.toISOString()}`, title: "New guest follow-up assigned", body: `A guest has been assigned to you. Please make contact by ${dueAt.toLocaleDateString("en-US")}.`, href: "/follow-up/guests" },
    update: {},
  });
  return NextResponse.json({ assignment });
}
