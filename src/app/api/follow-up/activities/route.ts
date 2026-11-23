import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getUserFromSession, SESSION_COOKIE } from "@/lib/auth-server";
import { canAccessFollowUp, canManageFollowUp } from "@/lib/follow-up-access-server";
import { canManageGuestSubmissions } from "@/lib/frontliners-access-server";
import { enforceRateLimit, getClientIp, rateLimitResponse } from "@/lib/rate-limit-server";

async function authorize() {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  const user = await getUserFromSession(token);
  if (!user || !(await canManageGuestSubmissions(user)) || !(await canAccessFollowUp(user))) return null;
  return user;
}

export async function GET(request: Request) {
  const user = await authorize();
  if (!user) return NextResponse.json({ error: "Follow-up access required." }, { status: 403 });
  const guestId = new URL(request.url).searchParams.get("guestId")?.trim();
  if (!guestId || guestId.length > 120) return NextResponse.json({ error: "Guest ID required." }, { status: 400 });
  const guest = await prisma.guestSubmission.findUnique({ where: { id: guestId }, select: { id: true } });
  if (!guest) return NextResponse.json({ error: "Guest not found." }, { status: 404 });
  const assignment = await prisma.guestFollowUpAssignment.findUnique({ where: { guestId } });
  if (!(await canManageFollowUp(user)) && assignment?.workerId !== user.id) return NextResponse.json({ error: "This guest is not assigned to you." }, { status: 403 });
  const activities = await prisma.guestFollowUpActivity.findMany({ where: { guestId }, orderBy: { createdAt: "desc" }, take: 100 });
  return NextResponse.json({ activities });
}

export async function POST(request: Request) {
  const user = await authorize();
  if (!user) return NextResponse.json({ error: "Follow-up access required." }, { status: 403 });
  const limit = await enforceRateLimit(`follow-up:activity:${user.id}:${getClientIp(request)}`, { limit: 40, windowSeconds: 3600 });
  if (!limit.allowed) return rateLimitResponse(limit.retryAfterSeconds);
  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object") return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  const guestId = String(body.guestId ?? "").trim();
  const kind = String(body.kind ?? "");
  const outcome = String(body.outcome ?? "");
  const note = String(body.note ?? "").trim();
  if (!guestId || guestId.length > 120 || !["call", "email", "text", "visit", "other"].includes(kind) || !["connected", "no_answer", "follow_up_needed"].includes(outcome) || note.length > 1500) {
    return NextResponse.json({ error: "Select a valid contact method and outcome. Notes must be under 1500 characters." }, { status: 400 });
  }
  const guest = await prisma.guestSubmission.findUnique({ where: { id: guestId }, select: { id: true } });
  if (!guest) return NextResponse.json({ error: "Guest not found." }, { status: 404 });
  const assignment = await prisma.guestFollowUpAssignment.findUnique({ where: { guestId } });
  if (!(await canManageFollowUp(user)) && assignment?.workerId !== user.id) return NextResponse.json({ error: "This guest is assigned to another worker." }, { status: 403 });
  const activity = await prisma.guestFollowUpActivity.create({
    data: { guestId, kind, outcome, note: note || null, actorId: user.id, actorName: user.name },
  });
  if (outcome === "connected") {
    await prisma.guestFollowUpAssignment.updateMany({ where: { guestId, workerId: user.id, completedAt: null }, data: { completedAt: new Date() } });
    await prisma.guestSubmission.updateMany({ where: { id: guestId, status: "new" }, data: { status: "contacted", reviewedAt: new Date(), reviewedBy: user.id, reviewedByName: user.name } });
  }
  return NextResponse.json({ activity }, { status: 201 });
}
