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
import { notifyKidsCheckIn, notifyKidsIncident, notifyKidsLessonPublished, notifyGuardianKidsCheckIn, notifyGuardianKidsCheckOut } from "@/lib/kids-notify-server";
import { addKidCheckIn, getKidCheckIns } from "@/lib/member-server";
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
  assertAllowedAgeGroupValue,
  assertAllowedService,
  assertActiveCheckInScope,
  buildRegisteredCheckInPayload,
  canViewSensitiveChildData,
  executeAuthorizedKidCheckout,
  filterAnnouncementsForUser,
  filterRosterByScope,
  getKidsVolunteerProfile,
  hasConfirmedAssignmentForAgeGroup,
  kidsWorkspaceStorageError,
  kidsWorkspaceStorageReady,
  resolveIncidentFromCheckIn,
  resolveKidsMinistryScope,
  sanitizeRosterEntry,
  searchKidsMinistryMembers,
  verifyRegisteredChildForCheckIn,
  volunteerEligibleForAssignment,
} from "@/lib/kids-ministry-policy-server";
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
  const ip = getClientIp(request);

  if (url.searchParams.has("memberSearch")) {
    if (!(await canManageKidsMinistry(user))) {
      return NextResponse.json({ error: "Kids ministry admin access required." }, { status: 403 });
    }
  const query = String(url.searchParams.get("memberSearch") ?? "").trim();
    if (query.length < 2) return NextResponse.json({ members: [] });
    return NextResponse.json({ members: await searchKidsMinistryMembers(query, 30) });
  }

  const childSearch = url.searchParams.get("childSearch");
  if (childSearch) {
    const service = url.searchParams.get("service") ?? KIDS_SERVICES[1];
    const serviceDate = url.searchParams.get("date") ?? getServiceDateLabel();
    const scope = await resolveKidsMinistryScope(user, service, serviceDate);
    if (!scope.canManage && !scope.canCheckIn) {
      return NextResponse.json({ error: "Confirmed classroom assignment required for child search." }, { status: 403 });
    }
    const searchLimited = await enforceRateLimit(`kids:child-search:${user.id}:${ip}`, {
      limit: 20,
      windowSeconds: 5 * 60,
    });
    if (!searchLimited.allowed) return rateLimitResponse(searchLimited.retryAfterSeconds);
    return NextResponse.json({ children: await searchRegisteredChildren(childSearch, 20) });
  }

  const service = url.searchParams.get("service") ?? KIDS_SERVICES[1];
  const weekStarting = url.searchParams.get("week") ?? getWeekStarting();
  const serviceDate = url.searchParams.get("date") ?? getServiceDateLabel();
  assertAllowedService(service);

  const scope = await resolveKidsMinistryScope(user, service, serviceDate);
  const checkins = await getKidCheckIns();
  const active = filterActiveCheckIns(checkins, { service });
  const allRoster = active.map(toRosterEntry);
  const scopedEntries = filterRosterByScope(allRoster, scope);
  const scopedRoster = await Promise.all(
    scopedEntries.map(async (entry) =>
      sanitizeRosterEntry(entry, await canViewSensitiveChildData(user.id, scope, entry.ageGroup)),
    ),
  );

  const lessonsAll = await listKidsLessons({ weekStarting });
  const lessons = scope.canManage
    ? lessonsAll
  : lessonsAll.filter(
        (lesson) =>
          lesson.status === "published" && scope.confirmedAgeGroups.includes(lesson.ageGroup),
    );

  const myAssignments = scope.canManage
    ? await listKidsAssignments({ serviceDate, service })
    : scope.myAssignments;
  const todayAssignment = scope.canManage
    ? null
    : scope.myAssignments.find((row) => row.status === "confirmed") ?? null;
  const myLesson = todayAssignment
    ? pickLessonForRoom(lessonsAll, todayAssignment.ageGroup, user.id)
    : null;
  const rosterForRoom = todayAssignment
    ? scopedRoster.filter((entry) => entry.ageGroup === todayAssignment.ageGroup)
    : scopedRoster;

  const incidents = scope.canManage
    ? await listKidsIncidents({ service, limit: 25 })
    : (await listKidsIncidents({ service, limit: 25 })).filter((entry) =>
        scope.confirmedAgeGroups.includes(entry.ageGroup),
      );

  const announcements = filterAnnouncementsForUser(await listKidsAnnouncements(20), scope.canManage);

  return NextResponse.json({
    roster: scopedRoster,
    rosterForRoom,
    directory: scope.canManage ? buildDirectory(checkins) : [],
    headcount: buildHeadcount(active),
    lessons,
    incidents,
    weekStarting,
    serviceDate,
    services: KIDS_SERVICES,
    ageGroups: KIDS_AGE_GROUPS,
    canManageKidsMinistry: scope.canManage,
    workspaceDatabaseReady: kidsWorkspaceStorageReady(),
    myAssignments: scope.canManage ? [] : myAssignments,
    myLesson,
    todayAssignment,
    assignments: scope.canManage ? await listKidsAssignments({ serviceDate, service }) : myAssignments,
    volunteers: scope.canManage ? await listKidsVolunteerProfiles() : [],
    completions: scope.canManage
      ? await listKidsLessonCompletions({ weekStarting, service })
      : (await listKidsLessonCompletions({ weekStarting, service })).filter((row) =>
          scope.confirmedAgeGroups.includes(row.ageGroup),
        ),
    announcements,
    leaderSnapshot: scope.canManage
      ? await buildKidsLeaderSnapshot({ checkins, service, serviceDate, weekStarting })
      : null,
    myVolunteerProfile: await getKidsVolunteerProfile(user.id),
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

  const service = String(body.service ?? KIDS_SERVICES[1]).trim();
  const serviceDate = String(body.serviceDate ?? getServiceDateLabel()).trim();
  const scope = await resolveKidsMinistryScope(user, service, serviceDate);

  if (action === "message-parent") {
    const id = String(body.id ?? "").trim();
    const message = String(body.message ?? "").trim().slice(0, 300);
    if (!id || !message) return NextResponse.json({ error: "Select a checked-in child and enter a message." }, { status: 400 });
    const entry = (await getKidCheckIns()).find((item) => item.id === id && !item.checkedOutAt);
    if (!entry) return NextResponse.json({ error: "Active check-in not found." }, { status: 404 });
    try {
      await assertActiveCheckInScope(user, entry, scope);
    } catch (e) {
      return NextResponse.json({ error: e instanceof Error ? e.message : "Not authorized." }, { status: 403 });
    }
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
    try {
      await assertActiveCheckInScope(user, entry, scope);
    } catch (e) {
      return NextResponse.json({ error: e instanceof Error ? e.message : "Not authorized." }, { status: 403 });
    }
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
    if (!scope.canManage && !scope.canCheckIn) {
      return NextResponse.json({ error: "Confirmed classroom assignment required for check-in." }, { status: 403 });
    }
    const ageGroup = String(body.ageGroup ?? "").trim();
    try {
      assertAllowedService(service);
      assertAllowedAgeGroupValue(ageGroup);
    } catch (e) {
      return NextResponse.json({ error: e instanceof Error ? e.message : "Invalid service or room." }, { status: 400 });
    }
    if (!hasConfirmedAssignmentForAgeGroup(scope, ageGroup)) {
      return NextResponse.json({ error: "Confirmed assignment required for this classroom." }, { status: 403 });
    }

    const linkedParentUserId = String(body.parentUserId ?? "").trim();
    const familyMemberId = String(body.familyMemberId ?? "").trim();
    const guestMode = !linkedParentUserId && !familyMemberId;
    const { randomInt, randomUUID } = await import("node:crypto");

    if (!guestMode) {
      if (!linkedParentUserId || !familyMemberId) {
        return NextResponse.json({
          error: "Registered check-in requires both guardian account and child profile id.",
        }, { status: 400 });
      }
      const verified = await verifyRegisteredChildForCheckIn(linkedParentUserId, familyMemberId);
      if (!verified) {
        return NextResponse.json({ error: "Child does not match guardian records." }, { status: 403 });
      }
      const duplicate = (await getKidCheckIns()).find(
        (entry) =>
          !entry.checkedOutAt &&
          entry.service === service &&
          entry.familyMemberId === familyMemberId,
      );
      if (duplicate) {
        return NextResponse.json({ error: "This child is already checked in for this service.", checkin: duplicate }, { status: 409 });
      }
      const payload = buildRegisteredCheckInPayload({
        parent: verified.parent,
        child: verified.child,
        ageGroup,
        service,
        notes: String(body.notes ?? "").trim().slice(0, 500) || undefined,
        securityCode: String(randomInt(100000, 1000000)),
      });
      const entry = await addKidCheckIn({ id: `kid-${randomUUID()}`, ...payload });
      void notifyKidsCheckIn(entry);
      void notifyGuardianKidsCheckIn(entry);
      return NextResponse.json({ checkin: entry }, { status: 201 });
    }

    const childName = String(body.childName ?? "").trim().slice(0, 100);
    const parentName = String(body.parentName ?? "").trim().slice(0, 100);
    const pickupName = String(body.pickupName ?? "").trim().slice(0, 100);
    const pickupPhone = String(body.pickupPhone ?? "").trim().slice(0, 40);
    if (!childName || !parentName || !pickupName || !pickupPhone) {
      return NextResponse.json({
        error: "Guest check-in requires child, guardian, authorized pickup name and phone.",
      }, { status: 400 });
    }
    const duplicate = (await getKidCheckIns()).find(
      (entry) =>
        !entry.checkedOutAt &&
        entry.service === service &&
        entry.childName.toLowerCase() === childName.toLowerCase() &&
        entry.parentName.toLowerCase() === parentName.toLowerCase(),
    );
    if (duplicate) {
      return NextResponse.json({ error: "This child is already checked in for this service.", checkin: duplicate }, { status: 409 });
    }
    const entry = await addKidCheckIn({
      id: `kid-${randomUUID()}`,
      childName,
      parentName,
      ageGroup,
      service,
      notes: String(body.notes ?? "").trim().slice(0, 500) || undefined,
      allergies: String(body.allergies ?? "").trim().slice(0, 300) || undefined,
      medicalNotes: String(body.medicalNotes ?? "").trim().slice(0, 300) || undefined,
      authorizedPickup: [{ name: pickupName, phone: pickupPhone }],
      securityCode: String(randomInt(100000, 1000000)),
      checkedInAt: new Date().toISOString(),
    });
    void notifyKidsCheckIn(entry);
    // Guest check-ins have no verified linked app guardian to notify.
    return NextResponse.json({ checkin: entry }, { status: 201 });
  }

  if (action === "verify-checkout") {
    const id = String(body.id ?? "").trim();
    const securityCode = String(body.securityCode ?? "").trim();
    if (!id || !securityCode) {
      return NextResponse.json({ error: "Check-in id and security code are required." }, { status: 400 });
    }

    const checkout = await executeAuthorizedKidCheckout(id, securityCode, user.id, user, scope);
    if (!checkout.ok) {
      return NextResponse.json({ error: checkout.error }, { status: checkout.status });
    }
    void notifyGuardianKidsCheckOut(checkout.checkin);
    return NextResponse.json({ checkin: checkout.checkin });
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
    const checkInId = String(body.checkInId ?? "").trim();
    let childName = String(body.childName ?? "").trim();
    let ageGroup = String(body.ageGroup ?? "").trim();
    let incidentService = String(body.service ?? service).trim();
    const summary = String(body.summary ?? "").trim();
    const severity = body.severity === "moderate" || body.severity === "urgent" ? body.severity : "minor";
    let parentUserId: string | undefined;

    if (checkInId) {
      const activeCheckIn = (await getKidCheckIns()).find(
        (entry) => entry.id === checkInId && !entry.checkedOutAt,
      );
      if (!activeCheckIn) {
        return NextResponse.json({ error: "Active check-in not found for this incident." }, { status: 404 });
      }
      if (!hasConfirmedAssignmentForAgeGroup(scope, activeCheckIn.ageGroup) && !scope.canManage) {
        return NextResponse.json({ error: "Confirmed classroom assignment required to report incidents." }, { status: 403 });
      }
      const resolved = resolveIncidentFromCheckIn(activeCheckIn, {
        childName: body.childName ? String(body.childName) : undefined,
        ageGroup: body.ageGroup ? String(body.ageGroup) : undefined,
        service: body.service ? String(body.service) : undefined,
        parentUserId: body.parentUserId ? String(body.parentUserId) : undefined,
      });
      if (resolved.childNameMismatch) {
        return NextResponse.json({ error: "Child name does not match the active check-in record." }, { status: 400 });
      }
      childName = resolved.childName;
      ageGroup = resolved.ageGroup;
      incidentService = resolved.service;
      parentUserId = resolved.parentUserId;
    } else {
      if (!childName || !ageGroup || !incidentService || !summary) {
        return NextResponse.json(
          { error: "Child, room, service, and summary are required." },
          { status: 400 },
        );
      }
      if (!hasConfirmedAssignmentForAgeGroup(scope, ageGroup) && !scope.canManage) {
        return NextResponse.json({ error: "Confirmed classroom assignment required to report incidents." }, { status: 403 });
      }
      if (body.parentUserId) {
        return NextResponse.json(
          { error: "Link the active check-in instead of submitting a guardian user id." },
          { status: 400 },
        );
      }
    }

    if (!childName || !ageGroup || !incidentService || !summary) {
      return NextResponse.json(
        { error: "Child, room, service, and summary are required." },
        { status: 400 },
      );
    }

    const incident = await addKidsIncident({
      id: `kids-inc-${Date.now()}`,
      checkInId: checkInId || undefined,
      childName,
      parentUserId,
      ageGroup,
      service: incidentService,
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
    if (!(await canManageKidsMinistry(user))) {
      if (!scope.confirmedAgeGroups.includes(incident.ageGroup)) {
        return NextResponse.json({ error: "Not authorized for incidents in this classroom." }, { status: 403 });
      }
    }
    if (!incident.parentUserId) {
      return NextResponse.json(
        { error: "No linked parent account for this incident." },
        { status: 400 },
      );
    }

    const result = await notifyKidsIncident(incident);
    if (!result || result.sent < 1) {
      return NextResponse.json({
        error: "Push delivery was not confirmed. Call the guardian directly and log follow-up in the incident notes.",
        notify: result,
      }, { status: 502 });
    }
    const updated = await markKidsIncidentNotified(incidentId);

    return NextResponse.json({ incident: updated, notify: result, parentNotified: true });
  }

  if (action === "complete-lesson") {
    const weekStarting = String(body.weekStarting ?? getWeekStarting()).trim();
    const ageGroup = String(body.ageGroup ?? "").trim();
    const lessonId = String(body.lessonId ?? "").trim();
    if (!weekStarting || !ageGroup || !service || !lessonId) {
      return NextResponse.json({ error: "Lesson, room, and service are required." }, { status: 400 });
    }
    if (!scope.canManage && !scope.myAssignments.some((row) => row.ageGroup === ageGroup && row.status === "confirmed")) {
      return NextResponse.json({ error: "Confirmed assignment required for this classroom." }, { status: 403 });
    }
    const lesson = (await listKidsLessons({ weekStarting })).find((row) => row.id === lessonId);
    if (!lesson || lesson.status !== "published" || lesson.ageGroup !== ageGroup) {
      return NextResponse.json({ error: "Published lesson not found for this classroom." }, { status: 400 });
    }
    try {
      if (!kidsWorkspaceStorageReady()) {
        return NextResponse.json({ error: kidsWorkspaceStorageError() }, { status: 503 });
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
    } catch (e) {
      return NextResponse.json(
        { error: e instanceof Error ? e.message : kidsWorkspaceStorageError() },
        { status: 503 },
      );
    }
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
    if (!kidsWorkspaceStorageReady()) {
      return NextResponse.json({ error: kidsWorkspaceStorageError() }, { status: 503 });
    }
    const userId = String(body.userId ?? "").trim();
    const ageGroup = String(body.ageGroup ?? "").trim();
    const serviceDate = String(body.serviceDate ?? getServiceDateLabel()).trim();
    const role = body.role === "assistant" || body.role === "substitute" ? body.role : "teacher";
    if (!userId || !ageGroup || !service) {
      return NextResponse.json({ error: "Teacher, room, and service are required." }, { status: 400 });
    }
    try {
      assertAllowedService(service);
      assertAllowedAgeGroupValue(ageGroup);
    } catch (e) {
      return NextResponse.json({ error: e instanceof Error ? e.message : "Invalid assignment." }, { status: 400 });
    }
    if (!(await volunteerEligibleForAssignment(userId, role))) {
      return NextResponse.json({
        error:
          role === "teacher"
            ? "Lead teachers must complete leader-verified safeguarding before assignment."
            : "Volunteer must complete leader-verified safeguarding before assignment.",
      }, { status: 400 });
    }
    const current = await listKidsAssignments({ serviceDate, service, ageGroup });
    if (current.some((row) => row.userId === userId && row.status !== "declined")) {
      return NextResponse.json({ error: "This volunteer already has an assignment for this classroom." }, { status: 409 });
    }
    if (
      role === "teacher" &&
      current.some((row) => row.role === "teacher" && row.status === "confirmed")
    ) {
      return NextResponse.json({ error: "A confirmed lead teacher is already assigned to this room." }, { status: 409 });
    }
    const userName = await resolveVolunteerName(userId);
    const now = new Date().toISOString();
    try {
      const assignment = await saveKidsAssignment({
        id: `kids-assign-${userId}-${serviceDate}-${ageGroup.replace(/\W+/g, "-")}-${role}`,
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
    } catch (e) {
      return NextResponse.json({ error: e instanceof Error ? e.message : kidsWorkspaceStorageError() }, { status: 503 });
    }
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
    if (action === "confirm-assignment") {
      const role = existing.role === "assistant" || existing.role === "substitute" ? existing.role : "teacher";
      if (!(await volunteerEligibleForAssignment(existing.userId, role))) {
        return NextResponse.json({
          error: "Leader-verified safeguarding is required before confirming this assignment.",
        }, { status: 400 });
      }
    }
    const updated = await saveKidsAssignment({
      ...existing,
      status: action === "confirm-assignment" ? "confirmed" : "needs_replacement",
      updatedAt: new Date().toISOString(),
    });
    return NextResponse.json({ assignment: updated });
  }

  if (action === "save-volunteer") {
    if (!kidsWorkspaceStorageReady()) {
      return NextResponse.json({ error: kidsWorkspaceStorageError() }, { status: 503 });
    }
    const userId = String(body.userId ?? "").trim();
    if (!userId) return NextResponse.json({ error: "Volunteer user id required." }, { status: 400 });
    const existing = await getKidsVolunteerProfile(userId);
    const userName = await resolveVolunteerName(userId);
    try {
    const profile = await saveKidsVolunteerProfile({
      userId,
      userName,
      roles: Array.isArray(body.roles)
        ? body.roles.map((item: unknown) => String(item).trim()).filter(Boolean)
        : (existing?.roles ?? []),
      onboardingComplete: existing?.onboardingComplete ?? false,
      safeguardingSelfAttestedAt: existing?.safeguardingSelfAttestedAt,
      safeguardingLeaderVerifiedAt: existing?.safeguardingLeaderVerifiedAt,
      availabilityNotes: body.availabilityNotes
        ? String(body.availabilityNotes).trim()
        : existing?.availabilityNotes,
      updatedAt: new Date().toISOString(),
    });
    return NextResponse.json({ profile });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : kidsWorkspaceStorageError() }, { status: 503 });
  }
  }

  if (action === "attest-safeguarding-training") {
    if (!kidsWorkspaceStorageReady()) {
      return NextResponse.json({ error: kidsWorkspaceStorageError() }, { status: 503 });
    }
    const targetUserId = String(body.userId ?? user.id).trim();
    if (targetUserId !== user.id) {
      return NextResponse.json({ error: "You can only attest training for your own account." }, { status: 403 });
    }
    const existing = await getKidsVolunteerProfile(targetUserId);
    const userName = await resolveVolunteerName(targetUserId);
    const now = new Date().toISOString();
    try {
      const profile = await saveKidsVolunteerProfile({
        userId: targetUserId,
        userName,
        roles: existing?.roles ?? [],
        onboardingComplete: existing?.onboardingComplete ?? false,
        safeguardingSelfAttestedAt: now,
        safeguardingLeaderVerifiedAt: existing?.safeguardingLeaderVerifiedAt,
        updatedAt: now,
      });
      return NextResponse.json({ profile });
    } catch (e) {
      return NextResponse.json({ error: e instanceof Error ? e.message : kidsWorkspaceStorageError() }, { status: 503 });
    }
  }

  if (action === "verify-volunteer-safeguarding") {
    if (!(await canManageKidsMinistry(user))) {
      return NextResponse.json({ error: "Kids ministry admin access required." }, { status: 403 });
    }
    if (!kidsWorkspaceStorageReady()) {
      return NextResponse.json({ error: kidsWorkspaceStorageError() }, { status: 503 });
    }
    const targetUserId = String(body.userId ?? "").trim();
    if (!targetUserId) return NextResponse.json({ error: "Volunteer user id required." }, { status: 400 });
    const existing = await getKidsVolunteerProfile(targetUserId);
    const userName = await resolveVolunteerName(targetUserId);
    const now = new Date().toISOString();
    try {
      const profile = await saveKidsVolunteerProfile({
        userId: targetUserId,
        userName,
        roles: existing?.roles ?? [],
        onboardingComplete: true,
        safeguardingSelfAttestedAt: existing?.safeguardingSelfAttestedAt ?? now,
        safeguardingLeaderVerifiedAt: now,
        updatedAt: now,
      });
      return NextResponse.json({ profile });
    } catch (e) {
      return NextResponse.json({ error: e instanceof Error ? e.message : kidsWorkspaceStorageError() }, { status: 503 });
    }
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
