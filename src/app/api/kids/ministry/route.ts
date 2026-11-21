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
import { addKidCheckIn, getKidCheckIns, verifyCheckoutKid } from "@/lib/member-server";
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
    directory: Array.from(new Map([...checkins].filter((entry) => entry.parentName.trim() && entry.childName.trim()).map((entry) => [`${entry.childName.trim().toLowerCase()}|${entry.parentName.trim().toLowerCase()}`, { childName: entry.childName, parentName: entry.parentName, ageGroup: entry.ageGroup, parentUserId: entry.parentUserId, allergies: entry.allergies, medicalNotes: entry.medicalNotes, authorizedPickup: entry.authorizedPickup }])).values()).sort((a, b) => a.childName.localeCompare(b.childName)).slice(0, 300),
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

  if (action === "message-parent") {
    const id = String(body.id ?? "").trim();
    const message = String(body.message ?? "").trim().slice(0, 300);
    if (!id || !message) return NextResponse.json({ error: "Select a checked-in child and enter a message." }, { status: 400 });
    const entry = (await getKidCheckIns()).find((item) => item.id === id && !item.checkedOutAt);
    if (!entry) return NextResponse.json({ error: "Active check-in not found." }, { status: 404 });
    if (!entry.parentUserId) return NextResponse.json({ error: "This guardian is not linked to an app account. Call the verified pickup contact instead." }, { status: 409 });
    const { sendPushToUsers } = await import("@/lib/push-server");
    const delivery = await sendPushToUsers([entry.parentUserId], {
      title: "Shanah Kids — please contact your child's teacher",
      body: message,
      url: "/profile",
    }, "kids");
    return NextResponse.json({ delivery });
  }

  if (action === "escalate-to-lead") {
    const id = String(body.id ?? "").trim();
    const entry = (await getKidCheckIns()).find((item) => item.id === id && !item.checkedOutAt);
    if (!entry) return NextResponse.json({ error: "Active check-in not found." }, { status: 404 });
    const { getGroups } = await import("@/lib/group-server");
    const { isKidsMinistryGroup } = await import("@/lib/kids-types");
    const { isGroupAdmin } = await import("@/lib/group-admin-utils");
    const groups = await getGroups();
    const leaders = new Set<string>();
    for (const group of groups) {
      if (!isKidsMinistryGroup(group)) continue;
      for (const memberId of group.memberIds) {
        if (memberId !== user.id && isGroupAdmin(group, memberId)) leaders.add(memberId);
      }
    }
    if (leaders.size === 0) return NextResponse.json({ error: "No Kids Ministry leader is configured for private alerts. Contact church leadership directly." }, { status: 409 });
    const { sendPushToUsers } = await import("@/lib/push-server");
    const delivery = await sendPushToUsers([...leaders], {
      title: "Shanah Kids — staff assistance requested",
      body: "A teacher needs immediate assistance at the Kids Ministry check-in desk. Please contact the teacher directly.",
      url: "/kids-ministry",
    }, "kids");
    return NextResponse.json({ delivery });
  }

  if (action === "teacher-checkin") {
    const childName = String(body.childName ?? "").trim().slice(0, 100);
    const parentName = String(body.parentName ?? "").trim().slice(0, 100);
    const ageGroup = String(body.ageGroup ?? "").trim();
    const service = String(body.service ?? "").trim();
    const pickupName = String(body.pickupName ?? "").trim().slice(0, 100);
    const pickupPhone = String(body.pickupPhone ?? "").trim().slice(0, 40);
    const linkedParentUserId = String(body.parentUserId ?? "").trim();
    if (!childName || !parentName || !pickupName || !pickupPhone || !KIDS_AGE_GROUPS.some((group) => group === ageGroup) || !KIDS_SERVICES.some((item) => item === service)) {
      return NextResponse.json({ error: "Child, guardian, authorized pickup name and phone, valid room and service are required." }, { status: 400 });
    }
    const existing = (await getKidCheckIns()).find((entry) =>
      !entry.checkedOutAt && entry.service === service &&
      entry.childName.toLowerCase() === childName.toLowerCase() &&
      entry.parentName.toLowerCase() === parentName.toLowerCase());
    if (existing) {
      return NextResponse.json({ error: "This child is already checked in for this service.", checkin: existing }, { status: 409 });
    }
    const linked = linkedParentUserId ? (await getKidCheckIns()).some((item) =>
      item.parentUserId === linkedParentUserId &&
      item.childName.trim().toLowerCase() === childName.toLowerCase() &&
      item.parentName.trim().toLowerCase() === parentName.toLowerCase()) : false;
    if (linkedParentUserId && !linked) return NextResponse.json({ error: "Guardian account linkage could not be verified." }, { status: 403 });
    const { randomInt, randomUUID } = await import("node:crypto");
    const entry = await addKidCheckIn({
      id: `kid-${randomUUID()}`,
      childName, parentName, ageGroup, service,
      parentUserId: linked ? linkedParentUserId : undefined,
      notes: String(body.notes ?? "").trim().slice(0, 500) || undefined,
      allergies: String(body.allergies ?? "").trim().slice(0, 300) || undefined,
      medicalNotes: String(body.medicalNotes ?? "").trim().slice(0, 300) || undefined,
      authorizedPickup: [{ name: pickupName, phone: pickupPhone }],
      securityCode: String(randomInt(100000, 1000000)),
      checkedInAt: new Date().toISOString(),
    });
    return NextResponse.json({ checkin: entry }, { status: 201 });
  }

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
