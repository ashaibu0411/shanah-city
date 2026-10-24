import { randomUUID } from "crypto";
import type { PublicMember } from "@/lib/auth-types";
import {
  assertClinicalCounselorForJourney,
  assertJourneyParticipant,
} from "@/lib/marriage-counseling-access";
import { logMarriageAudit } from "@/lib/marriage-counseling-audit";
import type {
  MarriageCounselingSessionRecord,
  MarriageCounselorPremaritalOperationsView,
  MarriageCoupleAppointmentView,
  MarriageMeetingMode,
  MarriagePremaritalReadinessReviewRecord,
  MarriagePremaritalReadinessStatus,
  MarriagePremaritalSessionClinicalOutcome,
  MarriagePremaritalSessionClinicalRecord,
} from "@/lib/marriage-counseling-types";
import { assertSeniorPastor, isSeniorPastor } from "@/lib/marriage-counselor-assignment-authority";
import {
  PREMARITAL_PROGRAM_SESSIONS,
  getPremaritalSessionDefinition,
} from "@/lib/marriage-premarital-eight-session-program";
import {
  normalizeNewSessionScheduledAtInput,
  parseDateTimeLocalInTimeZone,
} from "@/lib/marriage-session-scheduling";
import {
  notifyMarriageAppointmentCancelled,
  notifyMarriageAppointmentRescheduled,
  notifyMarriageAppointmentUpcoming,
} from "@/lib/marriage-counseling-notify";
import { marriageStore } from "@/lib/stores/marriage-counseling-store";

const store = () => marriageStore();

function sessionTitle(sessionKey?: string) {
  if (!sessionKey) return undefined;
  return getPremaritalSessionDefinition(sessionKey)?.title;
}

function normalizeEndAt(input: {
  scheduledEndAtLocal?: string;
  schedulingTimeZone: string;
}): string | undefined {
  if (!input.scheduledEndAtLocal?.trim()) return undefined;
  const parsed = parseDateTimeLocalInTimeZone(input.scheduledEndAtLocal.trim(), input.schedulingTimeZone);
  if (!parsed.ok) throw new Error(parsed.error);
  return parsed.iso;
}

export async function listAllJourneySessions(journeyId: string) {
  if (typeof store().listAllSessionsForJourney === "function") {
    return store().listAllSessionsForJourney(journeyId);
  }
  return store().listSessions(journeyId);
}

export async function schedulePremaritalAppointment(
  viewer: PublicMember,
  input: {
    journeyId: string;
    premaritalSessionKey: string;
    scheduledAtLocal: string;
    scheduledEndAtLocal?: string;
    schedulingTimeZone?: string;
    meetingMode: MarriageMeetingMode;
    locationOrLink?: string;
    topic?: string;
  },
) {
  const journey = await store().getJourneyById(input.journeyId);
  if (!journey) throw new Error("Journey not found.");
  await assertClinicalCounselorForJourney(viewer, journey);
  if (!getPremaritalSessionDefinition(input.premaritalSessionKey)) {
    throw new Error("Unknown counseling session.");
  }
  const scheduling = normalizeNewSessionScheduledAtInput({
    scheduledAtLocal: input.scheduledAtLocal,
    schedulingTimeZone: input.schedulingTimeZone,
  });
  const scheduledEndAt = normalizeEndAt({
    scheduledEndAtLocal: input.scheduledEndAtLocal,
    schedulingTimeZone: scheduling.schedulingTimeZone,
  });
  const now = new Date().toISOString();
  const mode = input.meetingMode;
  const locationOrLink = input.locationOrLink?.trim() || undefined;
  const session: MarriageCounselingSessionRecord = {
    id: randomUUID(),
    journeyId: journey.id,
    scheduledAt: scheduling.scheduledAt,
    schedulingTimeZone: scheduling.schedulingTimeZone,
    scheduledEndAt,
    premaritalSessionKey: input.premaritalSessionKey,
    meetingMode: mode,
    locationOrLink,
    zoomUrl: mode === "video" ? locationOrLink : undefined,
    topic: input.topic?.trim() || sessionTitle(input.premaritalSessionKey),
    status: "scheduled",
    createdBy: viewer.id,
    createdAt: now,
    updatedAt: now,
  };
  await store().saveSession(session);
  await logMarriageAudit({
    actorUserId: viewer.id,
    action: "premarital_appointment_scheduled",
    journeyId: journey.id,
    meta: { sessionId: session.id, premaritalSessionKey: input.premaritalSessionKey },
  });
  return session;
}

export async function reschedulePremaritalAppointment(
  viewer: PublicMember,
  sessionId: string,
  input: {
    scheduledAtLocal?: string;
    scheduledEndAtLocal?: string;
    schedulingTimeZone?: string;
    meetingMode?: MarriageMeetingMode;
    locationOrLink?: string;
    reason?: string;
  },
) {
  const existing = await store().getSessionById(sessionId);
  if (!existing) throw new Error("Appointment not found.");
  const journey = await store().getJourneyById(existing.journeyId);
  if (!journey) throw new Error("Journey not found.");
  await assertClinicalCounselorForJourney(viewer, journey);

  const tz =
    input.schedulingTimeZone?.trim() || existing.schedulingTimeZone || "America/Denver";
  let scheduledAt = existing.scheduledAt;
  if (input.scheduledAtLocal?.trim()) {
    const scheduling = normalizeNewSessionScheduledAtInput({
      scheduledAtLocal: input.scheduledAtLocal,
      schedulingTimeZone: tz,
    });
    scheduledAt = scheduling.scheduledAt;
  }
  const scheduledEndAt =
    input.scheduledEndAtLocal !== undefined
      ? normalizeEndAt({ scheduledEndAtLocal: input.scheduledEndAtLocal, schedulingTimeZone: tz })
      : existing.scheduledEndAt;

  const meetingMode = input.meetingMode ?? existing.meetingMode;
  const locationOrLink =
    input.locationOrLink !== undefined ? input.locationOrLink.trim() || undefined : existing.locationOrLink;

  const now = new Date().toISOString();
  const updated: MarriageCounselingSessionRecord = {
    ...existing,
    scheduledAt,
    schedulingTimeZone: tz,
    scheduledEndAt,
    meetingMode,
    locationOrLink,
    zoomUrl: meetingMode === "video" ? locationOrLink : existing.zoomUrl,
    notes: input.reason?.trim()
      ? [existing.notes, `Reschedule note: ${input.reason.trim()}`].filter(Boolean).join("\n")
      : existing.notes,
    status: "scheduled",
    updatedAt: now,
    cancelledAt: undefined,
  };
  await store().saveSession(updated);

  const partnerIds = [journey.participantAId, journey.participantBId].filter(Boolean) as string[];
  notifyMarriageAppointmentRescheduled(partnerIds, sessionTitle(existing.premaritalSessionKey));

  await logMarriageAudit({
    actorUserId: viewer.id,
    action: "premarital_appointment_rescheduled",
    journeyId: journey.id,
    meta: { sessionId },
  });
  return updated;
}

export async function cancelPremaritalAppointment(
  viewer: PublicMember,
  sessionId: string,
  cancelReason: string,
) {
  const existing = await store().getSessionById(sessionId);
  if (!existing) throw new Error("Appointment not found.");
  const journey = await store().getJourneyById(existing.journeyId);
  if (!journey) throw new Error("Journey not found.");
  await assertClinicalCounselorForJourney(viewer, journey);

  const now = new Date().toISOString();
  const updated: MarriageCounselingSessionRecord = {
    ...existing,
    status: "cancelled",
    cancelReason: cancelReason.trim() || undefined,
    cancelledAt: now,
    updatedAt: now,
  };
  await store().saveSession(updated);

  const partnerIds = [journey.participantAId, journey.participantBId].filter(Boolean) as string[];
  notifyMarriageAppointmentCancelled(partnerIds, sessionTitle(existing.premaritalSessionKey));

  await logMarriageAudit({
    actorUserId: viewer.id,
    action: "premarital_appointment_cancelled",
    journeyId: journey.id,
    meta: { sessionId },
  });
  return updated;
}

export async function savePremaritalSessionClinicalRecord(
  viewer: PublicMember,
  input: {
    journeyId: string;
    sessionKey: string;
    sessionDateLocal?: string;
    schedulingTimeZone?: string;
    partnerAAttended?: boolean | null;
    partnerBAttended?: boolean | null;
    outcome?: MarriagePremaritalSessionClinicalOutcome | null;
    topicsCovered?: string;
    followUpActions?: string;
    privateObservations?: string;
    linkedAppointmentId?: string;
  },
) {
  const journey = await store().getJourneyById(input.journeyId);
  if (!journey) throw new Error("Journey not found.");
  await assertClinicalCounselorForJourney(viewer, journey);
  if (!getPremaritalSessionDefinition(input.sessionKey)) throw new Error("Unknown session.");

  let sessionDate: string | null = null;
  if (input.sessionDateLocal?.trim()) {
    const tz = input.schedulingTimeZone?.trim() || "America/Denver";
    const parsed = parseDateTimeLocalInTimeZone(input.sessionDateLocal.trim().slice(0, 10) + "T12:00", tz);
    if (!parsed.ok) throw new Error(parsed.error);
    sessionDate = parsed.iso;
  }

  const now = new Date().toISOString();
  const record: MarriagePremaritalSessionClinicalRecord = {
    journeyId: input.journeyId,
    sessionKey: input.sessionKey,
    sessionDate,
    partnerAAttended: input.partnerAAttended ?? null,
    partnerBAttended: input.partnerBAttended ?? null,
    outcome: input.outcome ?? null,
    topicsCovered: input.topicsCovered?.trim() || null,
    followUpActions: input.followUpActions?.trim() || null,
    privateObservations: input.privateObservations?.trim() || null,
    linkedAppointmentId: input.linkedAppointmentId?.trim() || null,
    updatedAt: now,
    updatedByUserId: viewer.id,
  };
  await store().savePremaritalSessionClinical(record);
  await logMarriageAudit({
    actorUserId: viewer.id,
    action: "premarital_clinical_record_saved",
    journeyId: input.journeyId,
    meta: { sessionKey: input.sessionKey },
  });
  return record;
}

export async function savePremaritalReadinessReview(
  viewer: PublicMember,
  input: {
    journeyId: string;
    status: MarriagePremaritalReadinessStatus;
    strengths?: string;
    areasForDiscussion?: string;
    unresolvedConcerns?: string;
    recommendedNextSteps?: string;
    optionalAdditionalCounseling?: string;
    pastoralRecommendation?: string;
    sessionsOverviewNote?: string;
    homeworkOverviewNote?: string;
    assessmentOverviewNote?: string;
  },
) {
  await assertSeniorPastor(viewer);
  const journey = await store().getJourneyById(input.journeyId);
  if (!journey) throw new Error("Journey not found.");
  if (journey.programType !== "premarital") throw new Error("Premarital journey required.");

  const previous = await store().getPremaritalReadinessReview(input.journeyId);
  const now = new Date().toISOString();
  const record: MarriagePremaritalReadinessReviewRecord = {
    journeyId: input.journeyId,
    status: input.status,
    strengths: input.strengths?.trim() || null,
    areasForDiscussion: input.areasForDiscussion?.trim() || null,
    unresolvedConcerns: input.unresolvedConcerns?.trim() || null,
    recommendedNextSteps: input.recommendedNextSteps?.trim() || null,
    optionalAdditionalCounseling: input.optionalAdditionalCounseling?.trim() || null,
    pastoralRecommendation: input.pastoralRecommendation?.trim() || null,
    sessionsOverviewNote: input.sessionsOverviewNote?.trim() || null,
    homeworkOverviewNote: input.homeworkOverviewNote?.trim() || null,
    assessmentOverviewNote: input.assessmentOverviewNote?.trim() || null,
    updatedAt: now,
    updatedByUserId: viewer.id,
  };
  await store().savePremaritalReadinessReview(record);
  await store().savePremaritalReadinessReviewAudit({
    id: randomUUID(),
    journeyId: input.journeyId,
    previousStatus: previous?.status ?? null,
    newStatus: input.status,
    snapshotJson: JSON.stringify(record),
    revisedByUserId: viewer.id,
    revisedAt: now,
  });
  await logMarriageAudit({
    actorUserId: viewer.id,
    action: "premarital_readiness_review_saved",
    journeyId: input.journeyId,
    meta: { status: input.status },
  });
  return record;
}

export async function buildCounselorPremaritalOperationsView(
  viewer: PublicMember,
  journeyId: string,
): Promise<MarriageCounselorPremaritalOperationsView | null> {
  const journey = await store().getJourneyById(journeyId);
  if (!journey || journey.programType !== "premarital") return null;

  const canEditReadiness = await isSeniorPastor(viewer);
  let hasClinicalAccess = false;
  try {
    await assertClinicalCounselorForJourney(viewer, journey);
    hasClinicalAccess = true;
  } catch (error) {
    if (!canEditReadiness) throw error;
  }

  const sessions = hasClinicalAccess
    ? (await listAllJourneySessions(journeyId))
        .filter((s) => s.premaritalSessionKey)
        .map((s) => ({
          ...s,
          premaritalSessionTitle: sessionTitle(s.premaritalSessionKey),
        }))
    : [];

  const clinicalRecords = hasClinicalAccess
    ? await store().listPremaritalSessionClinicalForJourney(journeyId)
    : [];
  const readinessReview = canEditReadiness
    ? await store().getPremaritalReadinessReview(journeyId)
    : null;
  const readinessAudit = canEditReadiness
    ? await store().listPremaritalReadinessReviewAudit(journeyId)
    : [];

  return {
    appointments: sessions,
    clinicalRecords,
    readinessReview,
    readinessAudit,
    canEditReadiness,
  };
}

export async function buildCoupleAppointmentViews(
  viewer: PublicMember,
  journeyId: string,
): Promise<MarriageCoupleAppointmentView[]> {
  const journey = await store().getJourneyById(journeyId);
  if (!journey) throw new Error("Journey not found.");
  await assertJourneyParticipant(journey, viewer.id);

  const sessions = await listAllJourneySessions(journeyId);
  return sessions
    .filter((s) => s.premaritalSessionKey && s.status !== "cancelled")
    .map((s) => ({
      id: s.id,
      premaritalSessionKey: s.premaritalSessionKey,
      premaritalSessionTitle: sessionTitle(s.premaritalSessionKey),
      scheduledAt: s.scheduledAt,
      scheduledEndAt: s.scheduledEndAt,
      schedulingTimeZone: s.schedulingTimeZone,
      meetingMode: s.meetingMode,
      locationOrLink:
        s.meetingMode === "video" ? s.locationOrLink ?? s.zoomUrl : s.locationOrLink,
      status: s.status,
    }));
}

export function premaritalSessionOptionsForScheduling() {
  return PREMARITAL_PROGRAM_SESSIONS.map((s) => ({
    sessionKey: s.sessionKey,
    order: s.order,
    title: s.title,
  }));
}
