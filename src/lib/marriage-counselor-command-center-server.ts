import type { PublicMember } from "@/lib/auth-types";
import {
  assertMarriageCounselorRole,
  viewerHasClinicalCounselorAccess,
} from "@/lib/marriage-counseling-access";
import type { MarriageCounselingJourneyRecord } from "@/lib/marriage-counseling-types";
import {
  canSubmitCounselorAssignmentRequest,
  isSeniorPastor,
} from "@/lib/marriage-counselor-assignment-authority";
import { marriageHubShowsCounselorAssignmentsNav } from "@/lib/marriage-counselor-assignment-ui";
import { resolveCoupleDisplayNames } from "@/lib/marriage-counselor-journey-names";
import { listMarriageCounselorDashboardJourneys } from "@/lib/marriage-counselor-dashboard";
import type {
  MarriageCounselorCommandCenterAction,
  MarriageCounselorCommandCenterAppointment,
  MarriageCounselorCommandCenterCouple,
  MarriageCounselorCommandCenterView,
} from "@/lib/marriage-counselor-command-center-types";
import { listCounselorHomeworkForJourney } from "@/lib/marriage-homework-server";
import type { MarriageCounselorHomeworkListItem } from "@/lib/marriage-homework-types";
import { PREMARITAL_PROGRAM_SESSIONS } from "@/lib/marriage-premarital-eight-session-program";
import { listAllJourneySessions } from "@/lib/marriage-premarital-operations-server";
import { buildModuleProgressOverview } from "@/lib/marriage-counselor-admin-overview";
import {
  MARRIAGE_COUNSELING_SCHEDULING_TIMEZONE,
  marriageSessionInstantMs,
} from "@/lib/marriage-session-scheduling";
import { marriageStore } from "@/lib/stores/marriage-counseling-store";

const store = () => marriageStore();

const PREP_WINDOW_MS = 48 * 60 * 60 * 1000;

function homeworkAwaitingReviewCount(
  items: MarriageCounselorHomeworkListItem[],
  feedbackByHomeworkId: Map<string, Record<string, string> | undefined>,
): number {
  let count = 0;
  for (const item of items) {
    if (item.status !== "released") continue;
    const feedback = feedbackByHomeworkId.get(item.id);
    for (const partner of [item.partnerA, item.partnerB]) {
      if (partner.status === "submitted" && partner.userId && !feedback?.[partner.userId]?.trim()) {
        count += 1;
      }
    }
  }
  return count;
}

function homeworkSummaryLabel(
  items: MarriageCounselorHomeworkListItem[],
  awaitingReview: number,
): string {
  const released = items.filter((i) => i.status === "released");
  if (released.length === 0) return "No released homework";
  if (awaitingReview > 0) return `${awaitingReview} submission(s) to review`;
  const overdue = released.filter(
    (i) => i.partnerA.status === "overdue" || i.partnerB.status === "overdue",
  ).length;
  if (overdue > 0) return `${overdue} with overdue partner work`;
  return "Up to date";
}

async function premaritalProgress(journeyId: string) {
  const records = await store().listPremaritalProgramSessionsForJourney(journeyId);
  const meta = await store().getPremaritalProgramMeta(journeyId);
  const byKey = new Map(records.map((r) => [r.sessionKey, r]));
  let completed = 0;
  let currentTitle: string | null = null;
  for (const def of PREMARITAL_PROGRAM_SESSIONS) {
    const row = byKey.get(def.sessionKey);
    if (row?.status === "completed") completed += 1;
    else if (!currentTitle) currentTitle = def.title;
  }
  if (!currentTitle && PREMARITAL_PROGRAM_SESSIONS.length > 0) {
    currentTitle =
      PREMARITAL_PROGRAM_SESSIONS[PREMARITAL_PROGRAM_SESSIONS.length - 1]?.title ?? null;
  }
  return {
    paused: Boolean(meta?.pausedAt),
    currentSessionTitle: currentTitle,
    completed,
    total: PREMARITAL_PROGRAM_SESSIONS.length,
  };
}

async function buildCoupleCard(
  viewer: PublicMember,
  journey: MarriageCounselingJourneyRecord,
  nowMs: number,
): Promise<{
  couple: MarriageCounselorCommandCenterCouple;
  appointments: MarriageCounselorCommandCenterAppointment[];
  actions: MarriageCounselorCommandCenterAction[];
}> {
  const coupleNames = await resolveCoupleDisplayNames(journey);
  const sessions = (await listAllJourneySessions(journey.id)).filter((s) => s.status !== "cancelled");
  const upcoming = sessions
    .filter((s) => marriageSessionInstantMs(s.scheduledAt, s.schedulingTimeZone) >= nowMs)
    .sort(
      (a, b) =>
        marriageSessionInstantMs(a.scheduledAt, a.schedulingTimeZone) -
        marriageSessionInstantMs(b.scheduledAt, b.schedulingTimeZone),
    );
  const next = upcoming[0];
  const homeworkItems = await listCounselorHomeworkForJourney(viewer, journey.id);
  const feedbackMap = new Map<string, Record<string, string> | undefined>();
  for (const hw of await store().listSessionHomeworkForJourney(journey.id)) {
    feedbackMap.set(hw.id, hw.partnerFeedback);
  }
  const reviewCount = homeworkAwaitingReviewCount(homeworkItems, feedbackMap);

  let progressLabel = "";
  let progressRatio = 0;
  let currentSessionTitle: string | null = null;
  let paused = false;
  let approachingReview = false;

  if (journey.programType === "premarital") {
    const prog = await premaritalProgress(journey.id);
    paused = prog.paused;
    currentSessionTitle = prog.currentSessionTitle;
    progressLabel = `${prog.completed}/${prog.total} sessions`;
    progressRatio = prog.total > 0 ? prog.completed / prog.total : 0;
    approachingReview = prog.completed >= 7;
  } else {
    const modules = await buildModuleProgressOverview(journey);
    const done = modules.filter((m) => m.bothSubmitted).length;
    progressLabel = `${done}/${modules.length} modules`;
    progressRatio = modules.length > 0 ? done / modules.length : 0;
  }

  const readiness = await store().getPremaritalReadinessReview(journey.id);
  if (approachingReview && readiness?.status !== "ready_to_proceed") {
    approachingReview = true;
  } else if (readiness?.status === "ready_to_proceed") {
    approachingReview = false;
  }

  let cardStatus: MarriageCounselorCommandCenterCouple["cardStatus"] = "active";
  if (journey.status === "completed") cardStatus = "completed";
  else if (paused) cardStatus = "paused";
  else if (approachingReview) cardStatus = "approaching_review";

  const activityTimes: number[] = [];
  for (const s of sessions) activityTimes.push(new Date(s.updatedAt ?? s.scheduledAt).getTime());
  for (const hw of homeworkItems) {
    if (hw.releasedAt) activityTimes.push(new Date(hw.releasedAt).getTime());
  }
  const clinical = await store().listPremaritalSessionClinicalForJourney(journey.id);
  for (const c of clinical) activityTimes.push(new Date(c.updatedAt).getTime());
  const notes = (await store().listCounselorNotes(journey.id)).filter(
    (n) => n.counselorUserId === viewer.id,
  );
  for (const n of notes) activityTimes.push(new Date(n.updatedAt).getTime());

  const lastActivityAt =
    activityTimes.length > 0 ? new Date(Math.max(...activityTimes)).toISOString() : null;

  const couple: MarriageCounselorCommandCenterCouple = {
    journeyId: journey.id,
    coupleNames,
    programType: journey.programType,
    journeyStatus: journey.status,
    cardStatus,
    currentSessionTitle,
    progressLabel,
    progressRatio,
    nextAppointmentAt: next?.scheduledAt ?? null,
    nextAppointmentTimeZone: next?.schedulingTimeZone,
    nextAppointmentTitle: next?.topic ?? currentSessionTitle,
    homeworkSummary: homeworkSummaryLabel(homeworkItems, reviewCount),
    homeworkAwaitingReviewCount: reviewCount,
    lastActivityAt,
    hasUpcomingAppointment: upcoming.length > 0,
  };

  const appointmentRows: MarriageCounselorCommandCenterAppointment[] = upcoming.map((s) => ({
    sessionId: s.id,
    journeyId: journey.id,
    coupleNames,
    scheduledAt: s.scheduledAt,
    scheduledEndAt: s.scheduledEndAt,
    schedulingTimeZone: s.schedulingTimeZone,
    sessionTitle:
      (s.premaritalSessionKey
        ? PREMARITAL_PROGRAM_SESSIONS.find((p) => p.sessionKey === s.premaritalSessionKey)?.title
        : undefined) ??
      s.topic ??
      "Counseling session",
    meetingMode: s.meetingMode,
    premaritalSessionKey: s.premaritalSessionKey,
  }));

  const actions: MarriageCounselorCommandCenterAction[] = [];
  const journeyBase = `/marriage/counselor/journey/${journey.id}`;

  for (const item of homeworkItems) {
    if (item.status !== "released") continue;
    const feedback = feedbackMap.get(item.id);
    for (const partner of [item.partnerA, item.partnerB]) {
      if (partner.status === "submitted" && partner.userId && !feedback?.[partner.userId]?.trim()) {
        actions.push({
          id: `hw-review-${item.id}-${partner.userId}`,
          kind: "homework_review",
          journeyId: journey.id,
          coupleNames,
          title: `Review ${partner.name}'s homework`,
          detail: item.title,
          href: `${journeyBase}/homework`,
          priority: 10,
        });
      }
    }
  }

  if (journey.programType === "premarital") {
    const clinicalByKey = new Map(clinical.map((c) => [c.sessionKey, c]));
    const pastPremarital = sessions.filter(
      (s) =>
        s.premaritalSessionKey &&
        marriageSessionInstantMs(s.scheduledAt, s.schedulingTimeZone) < nowMs,
    );
    for (const appt of pastPremarital) {
      const key = appt.premaritalSessionKey!;
      const record = clinicalByKey.get(key);
      if (!record?.outcome) {
        const title =
          PREMARITAL_PROGRAM_SESSIONS.find((p) => p.sessionKey === key)?.title ?? appt.topic ?? key;
        actions.push({
          id: `attendance-${appt.id}`,
          kind: "attendance_missing",
          journeyId: journey.id,
          coupleNames,
          title: "Record session attendance",
          detail: title,
          href: `${journeyBase}#premarital-ops-attendance`,
          priority: 20,
        });
      }
    }
  }

  const assignments = await store().listAssignments(journey.id);
  for (const a of assignments) {
    if (!a.dueAt) continue;
    if (new Date(a.dueAt).getTime() >= nowMs) continue;
    const partnerIds = [journey.participantAId, journey.participantBId].filter(Boolean) as string[];
    const allDone = partnerIds.every((id) => a.completedByUserIds.includes(id));
    if (!allDone) {
      actions.push({
        id: `assign-overdue-${a.id}`,
        kind: "assignment_overdue",
        journeyId: journey.id,
        coupleNames,
        title: "Follow up on overdue activity",
        detail: a.title,
        dueAt: a.dueAt,
        href: journeyBase,
        priority: 30,
      });
    }
  }

  for (const appt of upcoming) {
    const ms = marriageSessionInstantMs(appt.scheduledAt, appt.schedulingTimeZone);
    if (ms - nowMs <= PREP_WINDOW_MS) {
      actions.push({
        id: `prep-${appt.id}`,
        kind: "session_preparation",
        journeyId: journey.id,
        coupleNames,
        title: "Prepare for upcoming session",
        detail: appt.topic ?? undefined,
        dueAt: appt.scheduledAt,
        href: `${journeyBase}#premarital-ops-appointments`,
        priority: 5,
      });
    }
  }

  const revisions = await store().listRevisionRequests(journey.id);
  for (const rev of revisions.filter((r) => r.status === "pending")) {
    actions.push({
      id: `revision-${rev.id}`,
      kind: "revision_pending",
      journeyId: journey.id,
      coupleNames,
      title: "Assessment revision request",
      detail: rev.moduleId,
      href: journeyBase,
      priority: 15,
    });
  }

  if (
    journey.programType === "premarital" &&
    approachingReview &&
    (!readiness || readiness.status === "in_progress")
  ) {
    actions.push({
      id: `readiness-${journey.id}`,
      kind: "pastoral_readiness_pending",
      journeyId: journey.id,
      coupleNames,
      title: "Approaching final pastoral review",
      detail: readiness?.status ?? "No readiness decision yet",
      href: `${journeyBase}#premarital-ops-readiness`,
      priority: 25,
    });
  }

  return { couple, appointments: appointmentRows, actions };
}

export async function buildMarriageCounselorCommandCenter(
  viewer: PublicMember,
): Promise<MarriageCounselorCommandCenterView> {
  await assertMarriageCounselorRole(viewer);
  const nowMs = Date.now();
  const journeys = await listMarriageCounselorDashboardJourneys(viewer.id);
  const clinicalJourneys: MarriageCounselingJourneyRecord[] = [];
  for (const j of journeys) {
    if (await viewerHasClinicalCounselorAccess(viewer, j)) clinicalJourneys.push(j);
  }

  const canSubmit = await canSubmitCounselorAssignmentRequest(viewer);
  const isSp = await isSeniorPastor(viewer);
  const canOpenAssignmentAdmin = marriageHubShowsCounselorAssignmentsNav({
    canSubmitCounselorAssignment: canSubmit,
    isSeniorPastorCounselorApprover: isSp,
  });

  const couples: MarriageCounselorCommandCenterCouple[] = [];
  const upcomingAppointments: MarriageCounselorCommandCenterAppointment[] = [];
  const actions: MarriageCounselorCommandCenterAction[] = [];

  for (const journey of clinicalJourneys) {
    const built = await buildCoupleCard(viewer, journey, nowMs);
    couples.push(built.couple);
    upcomingAppointments.push(...built.appointments);
    actions.push(...built.actions);
  }

  upcomingAppointments.sort(
    (a, b) =>
      marriageSessionInstantMs(a.scheduledAt, a.schedulingTimeZone) -
      marriageSessionInstantMs(b.scheduledAt, b.schedulingTimeZone),
  );

  actions.sort((a, b) => a.priority - b.priority || a.title.localeCompare(b.title));

  const overview = {
    activeAssignedCouples: couples.filter((c) => c.cardStatus === "active").length,
    upcomingAppointments: upcomingAppointments.length,
    homeworkAwaitingReview: couples.reduce((n, c) => n + c.homeworkAwaitingReviewCount, 0),
    sessionsNeedingAttendance: actions.filter((a) => a.kind === "attendance_missing").length,
    approachingFinalReview: couples.filter((c) => c.cardStatus === "approaching_review").length,
    pausedJourneys: couples.filter((c) => c.cardStatus === "paused").length,
  };

  return {
    counselorId: viewer.id,
    schedulingTimeZone: MARRIAGE_COUNSELING_SCHEDULING_TIMEZONE,
    overview,
    couples,
    upcomingAppointments,
    actions,
    flags: {
      isMarriageCounselor: true,
      hasAssignedClinicalCouples: couples.length > 0,
      canOpenAssignmentAdmin,
    },
  };
}
