import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getUserFromSession, SESSION_COOKIE } from "@/lib/auth-server";
import {
  canAccessKidsMinistry,
  canManageKidsMinistry,
} from "@/lib/kids-access-server";
import {
  addKidsIncident,
  buildHeadcount,
  filterActiveCheckIns,
  listKidsIncidents,
  listKidsLessons,
  markKidsIncidentNotified,
  publishKidsLesson,
  saveKidsLesson,
  toRosterEntry,
} from "@/lib/kids-server";
import { KIDS_AGE_GROUPS, KIDS_SERVICES, getWeekStarting } from "@/lib/kids-types";
import { notifyKidsIncident, notifyKidsLessonPublished } from "@/lib/kids-notify-server";
import { getKidCheckIns, verifyCheckoutKid } from "@/lib/member-server";
import {
  enforceRateLimit,
  getClientIp,
  rateLimitResponse,
} from "@/lib/rate-limit-server";

export async function GET(request: Request) {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  const user = await getUserFromSession(token);

  if (!user) {
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  }

  if (!(await canAccessKidsMinistry(user))) {
    return NextResponse.json({ error: "Kids ministry access required." }, { status: 403 });
  }

  const url = new URL(request.url);
  const service = url.searchParams.get("service") ?? undefined;
  const weekStarting = url.searchParams.get("week") ?? getWeekStarting();

  const checkins = await getKidCheckIns();
  const active = filterActiveCheckIns(checkins, { service });
  const canManage = await canManageKidsMinistry(user);

  return NextResponse.json({
    roster: active.map(toRosterEntry),
    headcount: buildHeadcount(active),
    lessons: await listKidsLessons({ weekStarting }),
    incidents: await listKidsIncidents({ service, limit: 25 }),
    weekStarting,
    services: KIDS_SERVICES,
    ageGroups: KIDS_AGE_GROUPS,
    canManageKidsMinistry: canManage,
  });
}

export async function POST(request: Request) {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  const user = await getUserFromSession(token);

  if (!user) {
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  }

  if (!(await canAccessKidsMinistry(user))) {
    return NextResponse.json({ error: "Kids ministry access required." }, { status: 403 });
  }

  const ip = getClientIp(request);
  const rateLimited = await enforceRateLimit(`kids:ministry:${user.id}:${ip}`, {
    limit: 40,
    windowSeconds: 15 * 60,
  });
  if (!rateLimited.allowed) {
    return rateLimitResponse(rateLimited.retryAfterSeconds);
  }

  const body = await request.json();
  const action = String(body.action ?? "");

  if (action === "verify-checkout") {
    const id = String(body.id ?? "").trim();
    const securityCode = String(body.securityCode ?? "").trim();
    if (!id || !securityCode) {
      return NextResponse.json({ error: "Check-in id and security code are required." }, { status: 400 });
    }

    const result = await verifyCheckoutKid(id, {
      securityCode,
      checkedOutBy: user.id,
    });

    if (!result) {
      return NextResponse.json({ error: "Check-in not found or already checked out." }, { status: 404 });
    }
    if ("error" in result) {
      return NextResponse.json({ error: "Security code does not match." }, { status: 403 });
    }

    return NextResponse.json({ checkin: result.checkin });
  }

  if (action === "save-lesson" || action === "publish-lesson") {
    if (!(await canManageKidsMinistry(user))) {
      return NextResponse.json({ error: "Kids ministry admin access required." }, { status: 403 });
    }

    const weekStarting = String(body.weekStarting ?? getWeekStarting()).trim();
    const ageGroup = String(body.ageGroup ?? "").trim();
    const title = String(body.title ?? "").trim();
    const content = String(body.content ?? "").trim();

    if (!weekStarting || !ageGroup || !title) {
      return NextResponse.json({ error: "Week, age group, and title are required." }, { status: 400 });
    }

    const base = {
      id: `kids-lesson-${weekStarting}-${ageGroup.replace(/\W+/g, "-").toLowerCase()}`,
      weekStarting,
      ageGroup,
      title,
      content,
      status: "draft" as const,
      createdBy: user.id,
      createdByName: user.name,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const lesson =
      action === "publish-lesson"
        ? await saveKidsLesson(publishKidsLesson(base))
        : await saveKidsLesson(base);

    if (action === "publish-lesson") {
      await notifyKidsLessonPublished(lesson);
    }

    return NextResponse.json({ lesson });
  }

  if (action === "report-incident") {
    const childName = String(body.childName ?? "").trim();
    const ageGroup = String(body.ageGroup ?? "").trim();
    const service = String(body.service ?? "").trim();
    const summary = String(body.summary ?? "").trim();
    const severity = body.severity === "moderate" || body.severity === "urgent" ? body.severity : "minor";

    if (!childName || !ageGroup || !service || !summary) {
      return NextResponse.json(
        { error: "Child, room, service, and summary are required." },
        { status: 400 },
      );
    }

    const incident = await addKidsIncident({
      id: `kids-inc-${Date.now()}`,
      checkInId: body.checkInId ? String(body.checkInId) : undefined,
      childName,
      parentUserId: body.parentUserId ? String(body.parentUserId) : undefined,
      ageGroup,
      service,
      severity,
      summary,
      details: body.details ? String(body.details).trim() : undefined,
      actionTaken: body.actionTaken ? String(body.actionTaken).trim() : undefined,
      reportedBy: user.id,
      reportedByName: user.name,
      parentNotified: false,
      createdAt: new Date().toISOString(),
    });

    return NextResponse.json({ incident });
  }

  if (action === "notify-parent") {
    const incidentId = String(body.incidentId ?? "").trim();
    if (!incidentId) {
      return NextResponse.json({ error: "Incident id is required." }, { status: 400 });
    }

    const incidents = await listKidsIncidents({ limit: 100 });
    const incident = incidents.find((entry) => entry.id === incidentId);
    if (!incident) {
      return NextResponse.json({ error: "Incident not found." }, { status: 404 });
    }
    if (!incident.parentUserId) {
      return NextResponse.json(
        { error: "No linked parent account for this incident." },
        { status: 400 },
      );
    }

    const result = await notifyKidsIncident(incident);
    const updated = await markKidsIncidentNotified(incidentId);

    return NextResponse.json({ incident: updated, notify: result });
  }

  return NextResponse.json({ error: "Unknown action." }, { status: 400 });
}
