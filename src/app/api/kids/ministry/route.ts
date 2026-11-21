import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import type { FamilyMember } from "@/lib/auth-types";
import { getUserById, getUserFromSession, SESSION_COOKIE } from "@/lib/auth-server";
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
import { notifyKidsCheckIn, notifyKidsIncident, notifyKidsLessonPublished } from "@/lib/kids-notify-server";
import { addKidCheckIn, getKidCheckIns, verifyCheckoutKid } from "@/lib/member-server";
import type { KidsLessonCurriculum } from "@/lib/kids-workspace-types";
import {
  buildKidsLeaderSnapshot,
  findTodayAssignments,
  getServiceDateLabel,
  listKidsAnnouncements,
  listKidsAssignments,
  listKidsLessonCompletions,
  listKidsVolunteerProfiles,
  pickLessonForRoom,
  resolveVolunteerName,
  saveKidsAnnouncement,
  saveKidsAssignment,
  saveKidsLessonCompletion,
  saveKidsVolunteerProfile,
  searchRegisteredChildren,
} from "@/lib/kids-workspace-server";
import {
  enforceRateLimit,
  getClientIp,
  rateLimitResponse,
} from "@/lib/rate-limit-server";

function parseCurriculum(body: Record<string, unknown>): KidsLessonCurriculum | undefined {
  const raw = body.curriculum;
  if (!raw || typeof raw !== "object") return undefined;
  const source = raw as Record<string, unknown>;
  return {
    bibleStory: source.bibleStory ? String(source.bibleStory).trim() : undefined,
    teachingObjectives: source.teachingObjectives ? String(source.teachingObjectives).trim() : undefined,
    discussionQuestions: Array.isArray(source.discussionQuestions)
      ? source.discussionQuestions.map((item) => String(item).trim()).filter(Boolean)
      : undefined,
    games: source.games ? String(source.games).trim() : undefined,
    crafts: source.crafts ? String(source.crafts).trim() : undefined,
    activities: source.activities ? String(source.activities).trim() : undefined,
    preparationChecklist: Array.isArray(source.preparationChecklist)
      ? source.preparationChecklist.map((item) => String(item).trim()).filter(Boolean)
      : undefined,
    downloadableMaterials: source.downloadableMaterials
      ? String(source.downloadableMaterials).trim()
      : undefined,
  };
}

function buildDirectory(checkins: Awaited<ReturnType<typeof getKidCheckIns>>) {
  return Array.from(
    new Map(
      [...checkins]
        .filter((entry) => entry.parentName.trim() && entry.childName.trim())
        .map((entry) => [
          `${entry.childName.trim().toLowerCase()}|${entry.parentName.trim().toLowerCase()}`,
          {
            childName: entry.childName,
            parentName: entry.parentName,
            ageGroup: entry.ageGroup,
            parentUserId: entry.parentUserId,
            allergies: entry.allergies,
            medicalNotes: entry.medicalNotes,
            authorizedPickup: entry.authorizedPickup,
          },
        ]),
    ).values(),
  )
    .sort((a, b) => a.childName.localeCompare(b.childName))
    .slice(0, 300);
}

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
  const childSearch = url.searchParams.get("childSearch");
  if (childSearch) {
    return NextResponse.json({ children: await searchRegisteredChildren(childSearch, 30) });
  }

  const service = url.searchParams.get("service") ?? KIDS_SERVICES[1];
  const weekStarting = url.searchParams.get("week") ?? getWeekStarting();
  const serviceDate = url.searchParams.get("date") ?? getServiceDateLabel();

  const checkins = await getKidCheckIns();
  const active = filterActiveCheckIns(checkins, { service });
  const canManage = await canManageKidsMinistry(user);
  const lessons = await listKidsLessons({ weekStarting });
  const myAssignments = findTodayAssignments(
    await listKidsAssignments({ serviceDate }),
    user.id,
    serviceDate,
    service,
  );
  const todayAssignment = myAssignments[0] ?? null;
  const myLesson = todayAssignment
    ? pickLessonForRoom(lessons, todayAssignment.ageGroup, user.id)
    : lessons.find((lesson) => lesson.status === "published") ?? null;
  const rosterForRoom = todayAssignment
    ? active.filter((entry) => entry.ageGroup === todayAssignment.ageGroup).map(toRosterEntry)
    : active.map(toRosterEntry);

  return NextResponse.json({
    roster: active.map(toRosterEntry),
    rosterForRoom,
    directory: buildDirectory(checkins),
    headcount: buildHeadcount(active),
    lessons,
    incidents: await listKidsIncidents({ service, limit: 25 }),
    weekStarting,
    serviceDate,
    services: KIDS_SERVICES,
    ageGroups: KIDS_AGE_GROUPS,
    canManageKidsMinistry: canManage,
    myAssignments,
    myLesson,
    todayAssignment,
    assignments: await listKidsAssignments({ serviceDate, service }),
    volunteers: canManage ? await listKidsVolunteerProfiles() : [],
    completions: await listKidsLessonCompletions({ weekStarting, service }),
    announcements: await listKidsAnnouncements(20),
    leaderSnapshot: canManage
      ? await buildKidsLeaderSnapshot({ checkins, service, serviceDate, weekStarting })
      : null,
    safeguardingGuideUrl: "/training/kids-ministry-leader.html",
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
    let parentName = String(body.parentName ?? "").trim().slice(0, 100);
    const ageGroup = String(body.ageGroup ?? "").trim();
    const service = String(body.service ?? "").trim();
    let pickupName = String(body.pickupName ?? "").trim().slice(0, 100);
    let pickupPhone = String(body.pickupPhone ?? "").trim().slice(0, 40);
    const linkedParentUserId = String(body.parentUserId ?? "").trim();
    const profileCheckIn = Boolean(linkedParentUserId);
    if (
      !childName ||
      !KIDS_AGE_GROUPS.some((group) => group === ageGroup) ||
      !KIDS_SERVICES.some((item) => item === service) ||
      (!profileCheckIn && (!parentName || !pickupName || !pickupPhone))
    ) {
      return NextResponse.json({
        error: profileCheckIn
          ? "Child, registered guardian, room, and service are required."
          : "Child, guardian, authorized pickup name and phone, valid room and service are required.",
      }, { status: 400 });
    }
    const existing = (await getKidCheckIns()).find((entry) =>
      !entry.checkedOutAt && entry.service === service &&
      entry.childName.toLowerCase() === childName.toLowerCase() &&
      entry.parentName.toLowerCase() === parentName.toLowerCase());
    if (existing) {
      return NextResponse.json({ error: "This child is already checked in for this service.", checkin: existing }, { status: 409 });
    }
    const familyMemberId = body.familyMemberId ? String(body.familyMemberId).trim() : undefined;
    let parentUserId: string | undefined;
    let familyChild: FamilyMember | undefined;
    if (linkedParentUserId) {
      const parent = await getUserById(linkedParentUserId);
      if (!parent) return NextResponse.json({ error: "Guardian account not found." }, { status: 403 });
      parentUserId = parent.id;
      parentName = parent.name;
      familyChild = familyMemberId
        ? parent.family.find((member) => member.id === familyMemberId && member.relationship === "child")
        : parent.family.find(
            (member) =>
              member.relationship === "child" &&
              member.name.trim().toLowerCase() === childName.toLowerCase(),
          );
      if (!familyChild && !pickupName) {
        return NextResponse.json({ error: "Registered child not found on guardian profile." }, { status: 400 });
      }
    }
    const { randomInt, randomUUID } = await import("node:crypto");
    const entry = await addKidCheckIn({
      id: `kid-${randomUUID()}`,
      childName,
      parentName,
      ageGroup,
      service,
      parentUserId,
      familyMemberId: familyChild?.id,
      notes: String(body.notes ?? "").trim().slice(0, 500) || undefined,
      allergies: familyChild?.allergies ?? (String(body.allergies ?? "").trim().slice(0, 300) || undefined),
      medicalNotes: familyChild?.medicalNotes ?? (String(body.medicalNotes ?? "").trim().slice(0, 300) || undefined),
      authorizedPickup: familyChild?.authorizedPickup?.length
        ? familyChild.authorizedPickup
        : [{ name: pickupName, phone: pickupPhone }],
      securityCode: String(randomInt(100000, 1000000)),
      checkedInAt: new Date().toISOString(),
    });
    void notifyKidsCheckIn(entry);
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
      memoryVerse: body.memoryVerse ? String(body.memoryVerse).trim() : undefined,
      curriculum: parseCurriculum(body),
      materialsUrl: body.materialsUrl ? String(body.materialsUrl).trim() : undefined,
      assignedToUserId: body.assignedToUserId ? String(body.assignedToUserId).trim() : undefined,
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

  if (action === "complete-lesson") {
    const weekStarting = String(body.weekStarting ?? getWeekStarting()).trim();
    const ageGroup = String(body.ageGroup ?? "").trim();
    const service = String(body.service ?? "").trim();
    const serviceDate = String(body.serviceDate ?? getServiceDateLabel()).trim();
    const lessonId = String(body.lessonId ?? "").trim();
    if (!weekStarting || !ageGroup || !service || !lessonId) {
      return NextResponse.json({ error: "Lesson, room, and service are required." }, { status: 400 });
    }
    const completion = await saveKidsLessonCompletion({
      id: `kids-complete-${weekStarting}-${ageGroup}-${serviceDate}`,
      lessonId,
      weekStarting,
      ageGroup,
      service,
      serviceDate,
      completedBy: user.id,
      completedByName: user.name,
      notes: body.notes ? String(body.notes).trim() : undefined,
      completedAt: new Date().toISOString(),
    });
    return NextResponse.json({ completion });
  }

  const manageRequired = [
    "assign-teacher",
    "remove-assignment",
    "save-volunteer",
    "publish-announcement",
  ];
  if (manageRequired.includes(action) && !(await canManageKidsMinistry(user))) {
    return NextResponse.json({ error: "Kids ministry admin access required." }, { status: 403 });
  }

  if (action === "assign-teacher") {
    const userId = String(body.userId ?? "").trim();
    const ageGroup = String(body.ageGroup ?? "").trim();
    const service = String(body.service ?? "").trim();
    const serviceDate = String(body.serviceDate ?? getServiceDateLabel()).trim();
    const role = body.role === "assistant" || body.role === "substitute" ? body.role : "teacher";
    if (!userId || !ageGroup || !service) {
      return NextResponse.json({ error: "Teacher, room, and service are required." }, { status: 400 });
    }
    const userName = await resolveVolunteerName(userId);
    const now = new Date().toISOString();
    const assignment = await saveKidsAssignment({
      id: `kids-assign-${userId}-${serviceDate}-${ageGroup.replace(/\W+/g, "-")}`,
      userId,
      userName,
      role,
      ageGroup,
      service,
      serviceDate,
      status: "pending",
      assignedBy: user.id,
      createdAt: now,
      updatedAt: now,
    });
    return NextResponse.json({ assignment });
  }

  if (action === "remove-assignment") {
    const id = String(body.id ?? "").trim();
    if (!id) return NextResponse.json({ error: "Assignment id required." }, { status: 400 });
    await import("@/lib/kids-workspace-server").then((m) => m.deleteKidsAssignment(id));
    return NextResponse.json({ ok: true });
  }

  if (action === "confirm-assignment" || action === "request-replacement") {
    const id = String(body.id ?? "").trim();
    if (!id) return NextResponse.json({ error: "Assignment id required." }, { status: 400 });
    const rows = await listKidsAssignments();
    const existing = rows.find((row) => row.id === id);
    if (!existing) return NextResponse.json({ error: "Assignment not found." }, { status: 404 });
    if (existing.userId !== user.id && !(await canManageKidsMinistry(user))) {
      return NextResponse.json({ error: "Not authorized for this assignment." }, { status: 403 });
    }
    const updated = await saveKidsAssignment({
      ...existing,
      status: action === "confirm-assignment" ? "confirmed" : "needs_replacement",
      updatedAt: new Date().toISOString(),
    });
    return NextResponse.json({ assignment: updated });
  }

  if (action === "save-volunteer") {
    const userId = String(body.userId ?? "").trim();
    if (!userId) return NextResponse.json({ error: "Volunteer user id required." }, { status: 400 });
    const userName = await resolveVolunteerName(userId);
    const profile = await saveKidsVolunteerProfile({
      userId,
      userName,
      roles: Array.isArray(body.roles)
        ? body.roles.map((item: unknown) => String(item).trim()).filter(Boolean)
        : [],
      onboardingComplete: Boolean(body.onboardingComplete),
      safeguardingCompletedAt: body.safeguardingCompletedAt
        ? String(body.safeguardingCompletedAt)
        : undefined,
      availabilityNotes: body.availabilityNotes ? String(body.availabilityNotes).trim() : undefined,
      updatedAt: new Date().toISOString(),
    });
    return NextResponse.json({ profile });
  }

  if (action === "mark-safeguarding-complete") {
    const targetUserId = String(body.userId ?? user.id).trim();
  if (targetUserId !== user.id && !(await canManageKidsMinistry(user))) {
      return NextResponse.json({ error: "Not authorized." }, { status: 403 });
    }
    const userName = await resolveVolunteerName(targetUserId);
    const profile = await saveKidsVolunteerProfile({
      userId: targetUserId,
      userName,
      roles: [],
      onboardingComplete: true,
      safeguardingCompletedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    return NextResponse.json({ profile });
  }

  if (action === "publish-announcement") {
    const title = String(body.title ?? "").trim();
    const announcementBody = String(body.body ?? "").trim();
    if (!title || !announcementBody) {
      return NextResponse.json({ error: "Title and message are required." }, { status: 400 });
    }
    const now = new Date().toISOString();
    const announcement = await saveKidsAnnouncement({
      id: `kids-ann-${Date.now()}`,
      title,
      body: announcementBody,
      audience: body.audience === "leaders_only" ? "leaders_only" : "all_teachers",
      createdBy: user.id,
      createdByName: user.name,
      publishedAt: now,
      createdAt: now,
    });
    return NextResponse.json({ announcement });
  }

  return NextResponse.json({ error: "Unknown action." }, { status: 400 });
}
