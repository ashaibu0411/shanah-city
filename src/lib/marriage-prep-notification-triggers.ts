import { MARRIAGE_CONSENT_VERSION } from "@/lib/marriage-counseling-curriculum";
import type {
  MarriageCounselingJourneyRecord,
  MarriageCounselorAssignmentRequestRecord,
} from "@/lib/marriage-counseling-types";
import { computeFinalCertificateBlockers } from "@/lib/marriage-certificate-eligibility";
import {
  deliverMarriagePrepNotifications,
  getSeniorPastorUserId,
  journeyPartnerUserIds,
} from "@/lib/marriage-prep-notifications-server";
import { PREMARITAL_PROGRAM_SESSIONS } from "@/lib/marriage-premarital-eight-session-program";
import { getUserByEmail } from "@/lib/auth-server";
import { marriageStore } from "@/lib/stores/marriage-counseling-store";

const store = () => marriageStore();

function otherPartnerUserId(journey: MarriageCounselingJourneyRecord, userId: string) {
  const ids = journeyPartnerUserIds(journey);
  return ids.find((id) => id !== userId) ?? null;
}

function counselorJourneyPath(journeyId: string) {
  return `/marriage/counselor/journey/${journeyId}`;
}

export async function notifySeniorPastorAssignmentPending(
  journey: MarriageCounselingJourneyRecord,
  request: MarriageCounselorAssignmentRequestRecord,
) {
  const spId = await getSeniorPastorUserId();
  if (!spId) return { created: 0 };

  const kind =
    request.requestType === "reassign"
      ? ("sp_assignment_reassign_pending" as const)
      : ("sp_assignment_pending" as const);

  return deliverMarriagePrepNotifications({
    journey,
    userIds: [spId],
    audience: "senior_pastor",
    kind,
    referenceKey: request.id,
    title: "Counselor assignment approval",
    body: "A Marriage Prep counselor assignment is awaiting your Senior Pastor approval.",
    actionPath: "/marriage/admin/counselor-assignments",
    pushTitle: "Marriage Prep approval",
    pushBody: "A counselor assignment needs your review in Marriage Prep administration.",
  });
}

export async function notifyAssignmentAdminPendingOnJourney(
  journey: MarriageCounselingJourneyRecord,
  requestId: string,
) {
  const row = await store().getJourneyAdministrativeCoordinator(journey.id);
  const coordinatorId = row?.coordinatorUserId?.trim();
  if (!coordinatorId) return { created: 0 };

  return deliverMarriagePrepNotifications({
    journey,
    userIds: [coordinatorId],
    audience: "assignment_admin",
    kind: "admin_assignment_pending_on_journey",
    referenceKey: requestId,
    title: "Assignment awaiting approval",
    body: "A counselor assignment for your coordinated couple is pending Senior Pastor approval.",
    actionPath: "/marriage/admin/counselor-assignments",
    pushTitle: "Marriage Prep assignment",
    pushBody: "A counselor assignment is pending approval for a couple you coordinate.",
  });
}

export async function notifyCounselorAssignmentProposed(counselorUserId: string, journeyId: string) {
  const journey = await store().getJourneyById(journeyId);
  if (!journey || !counselorUserId.trim()) return { created: 0 };

  const proposedId = counselorUserId.trim();
  const pending = await store().getPendingCounselorAssignmentRequestForJourney(journeyId);
  const approved = await store().getApprovedCounselorAssignmentRequestAwaitingExecution(journeyId);
  const target =
    pending?.requestedCounselorUserId ?? approved?.requestedCounselorUserId ?? null;
  if (target !== proposedId) return { created: 0 };

  return deliverMarriagePrepNotifications({
    journey,
    userIds: [proposedId],
    audience: "counselor_proposed",
    kind: "counselor_assignment_proposed",
    referenceKey: journeyId,
    title: "Premarital assignment proposed",
    body: "A premarital journey lists you as the proposed counselor pending Senior Pastor approval.",
    actionPath: "/marriage/admin/counselor-assignments",
    pushTitle: "Premarital counselor assignment",
    pushBody: "A premarital journey was submitted for Senior Pastor approval with you as the proposed counselor.",
  });
}

export async function notifyCoupleAndCounselorAssignmentActivated(
  journey: MarriageCounselingJourneyRecord,
  requestId: string,
) {
  const counselorId = journey.counselorUserId?.trim();
  const partnerResults = await deliverMarriagePrepNotifications({
    journey,
    userIds: journeyPartnerUserIds(journey),
    audience: "couple",
    kind: "counselor_assigned",
    referenceKey: requestId,
    title: "Counselor assigned",
    body: "Your Marriage Prep counselor assignment is approved. Open the hub to continue your journey.",
    actionPath: "/marriage",
    pushTitle: "Marriage Prep counselor",
    pushBody: "Your counselor assignment is approved. Open Marriage Prep to continue.",
  });

  let counselorCreated = 0;
  if (counselorId) {
    const counselorResult = await deliverMarriagePrepNotifications({
      journey,
      userIds: [counselorId],
      audience: "counselor",
      kind: "counselor_new_assignment",
      referenceKey: requestId,
      title: "New couple assigned",
      body: "A premarital couple was assigned to you after required approval. Open your command center to begin.",
      actionPath: counselorJourneyPath(journey.id),
      pushTitle: "New Marriage Prep couple",
      pushBody: "A premarital couple was assigned to you. Open the counselor command center.",
    });
    counselorCreated = counselorResult.created;
  }

  return { partnerCreated: partnerResults.created, counselorCreated };
}

export async function notifyCounselorPartnersConsentReady(journey: MarriageCounselingJourneyRecord) {
  const counselorId = journey.counselorUserId?.trim();
  if (!counselorId) return { created: 0 };

  return deliverMarriagePrepNotifications({
    journey,
    userIds: [counselorId],
    audience: "counselor",
    kind: "counselor_partners_consent_ready",
    referenceKey: journey.id,
    title: "Partners ready to proceed",
    body: "Both partners recorded consent and are ready for the next Marriage Prep counseling steps.",
    actionPath: counselorJourneyPath(journey.id),
    pushTitle: "Marriage Prep consent",
    pushBody: "Both partners completed consent and are ready for counseling.",
  });
}

export async function notifyIntendedPartnerInviteActive(
  journey: MarriageCounselingJourneyRecord,
  inviteId: string,
  intendedEmail?: string | null,
) {
  const email = intendedEmail?.trim().toLowerCase();
  if (!email) return { created: 0 };
  const member = await getUserByEmail(email);
  if (!member?.id) return { created: 0 };

  return deliverMarriagePrepNotifications({
    journey,
    userIds: [member.id],
    audience: "pending_invitee",
    kind: "partner_invite_active",
    referenceKey: inviteId,
    title: "Marriage Prep invitation",
    body: "Your partner invited you to join a Marriage Prep journey. Open the hub to accept with your invitation code.",
    actionPath: "/marriage/join",
    pushTitle: "Marriage Prep invitation",
    pushBody: "Your partner invited you to Marriage Prep. Open the app to join.",
  });
}

export async function notifyHostPartnerJoined(
  journey: MarriageCounselingJourneyRecord,
  joinedUserId: string,
) {
  const hostId = journey.participantAId ?? journey.createdBy;
  if (!hostId || hostId === joinedUserId) return { created: 0 };

  return deliverMarriagePrepNotifications({
    journey,
    userIds: [hostId],
    audience: "couple",
    kind: "partner_joined",
    referenceKey: joinedUserId,
    title: "Partner joined",
    body: "Your partner joined your Marriage Prep journey. Complete consent when you are ready to continue together.",
    actionPath: "/marriage/consent",
    pushTitle: "Marriage journey",
    pushBody: "Your partner joined your counseling journey.",
  });
}

export async function notifyPartnerIndividualConsentRecorded(
  journey: MarriageCounselingJourneyRecord,
  consenterUserId: string,
) {
  const partnerId = otherPartnerUserId(journey, consenterUserId);
  if (!partnerId) return { created: 0 };

  return deliverMarriagePrepNotifications({
    journey,
    userIds: [partnerId],
    audience: "couple",
    kind: "partner_consent_recorded",
    referenceKey: consenterUserId,
    title: "Partner consent recorded",
    body: "Your partner recorded Marriage Prep consent. Record yours when ready so you can continue assessments and counseling together.",
    actionPath: "/marriage/consent",
    pushTitle: "Marriage Prep consent",
    pushBody: "Your partner completed consent. Open Marriage Prep to record yours.",
  });
}

export async function notifyCoupleBothConsented(journey: MarriageCounselingJourneyRecord) {
  const partnerIds = journeyPartnerUserIds(journey);
  if (partnerIds.length < 2) return { created: 0 };

  return deliverMarriagePrepNotifications({
    journey,
    userIds: partnerIds,
    audience: "couple",
    kind: "couple_both_consented",
    referenceKey: journey.id,
    title: "Consent complete",
    body: "Both partners recorded consent. Continue assessments, comparisons, and counseling sessions from your Marriage Prep hub.",
    actionPath: "/marriage",
    pushTitle: "Marriage Prep ready",
    pushBody: "Both partners completed consent. Open Marriage Prep to continue.",
  });
}

export async function checkBothPartnersConsentedAndNotifyCounselor(journeyId: string) {
  const journey = await store().getJourneyById(journeyId);
  if (!journey) return;

  const partnerIds = journeyPartnerUserIds(journey);
  if (partnerIds.length < 2) return;

  const consents = await store().getConsentsForJourney(journeyId);
  const consented = new Set(
    consents.filter((c) => c.consentVersion === MARRIAGE_CONSENT_VERSION).map((c) => c.userId),
  );
  if (!partnerIds.every((id) => consented.has(id))) return;

  void notifyCoupleBothConsented(journey);
  if (journey.counselorUserId?.trim()) {
    void notifyCounselorPartnersConsentReady(journey);
  }
}

export async function notifyCouplePastoralReadinessReady(journey: MarriageCounselingJourneyRecord) {
  return deliverMarriagePrepNotifications({
    journey,
    userIds: journeyPartnerUserIds(journey),
    audience: "couple",
    kind: "pastoral_readiness_ready",
    referenceKey: `${journey.id}:ready_to_proceed`,
    title: "Pastoral readiness approved",
    body: "Senior Pastor recorded a ready-to-proceed readiness decision. Certificate issuance may proceed when all requirements are met.",
    actionPath: "/marriage",
    pushTitle: "Marriage Prep readiness",
    pushBody: "Pastoral readiness review is complete. Open Marriage Prep for next steps.",
  });
}

export async function notifyCounselorAssessmentSubmitted(
  journey: MarriageCounselingJourneyRecord,
  moduleId: string,
  submitterUserId: string,
) {
  const counselorId = journey.counselorUserId?.trim();
  if (!counselorId) return { created: 0 };

  return deliverMarriagePrepNotifications({
    journey,
    userIds: [counselorId],
    audience: "counselor",
    kind: "counselor_assessment_submitted",
    referenceKey: `${moduleId}:${submitterUserId}`,
    title: "Assessment submitted",
    body: "A partner submitted a module assessment that may need your review. Private answers are not included in this alert.",
    actionPath: counselorJourneyPath(journey.id),
    pushTitle: "Marriage Prep assessment",
    pushBody: "A partner submitted an assessment for your review.",
  });
}

export async function notifyCounselorHomeworkSubmitted(
  journey: MarriageCounselingJourneyRecord,
  homeworkId: string,
  submitterUserId: string,
) {
  const counselorId = journey.counselorUserId?.trim();
  if (!counselorId) return { created: 0 };

  await deliverMarriagePrepNotifications({
    journey,
    userIds: [counselorId],
    audience: "counselor",
    kind: "counselor_homework_submitted",
    referenceKey: `${homeworkId}:${submitterUserId}`,
    title: "Homework submitted",
    body: "A partner submitted Marriage Prep homework. Open the homework workspace to review when ready.",
    actionPath: `${counselorJourneyPath(journey.id)}/homework`,
    pushTitle: "Marriage Prep homework",
    pushBody: "A partner submitted homework for your review.",
  });

  const hw = await store().getSessionHomeworkById(homeworkId);
  if (!hw) return { created: 0 };

  const responses = await store().listSessionHomeworkResponses(homeworkId);
  const partnerIds = journeyPartnerUserIds(journey);
  const bothSubmitted =
    partnerIds.length >= 2 &&
    partnerIds.every((id) => responses.some((r) => r.userId === id && r.submittedAt));

  if (!bothSubmitted) return { created: 0 };

  return deliverMarriagePrepNotifications({
    journey,
    userIds: [counselorId],
    audience: "counselor",
    kind: "counselor_homework_both_submitted",
    referenceKey: homeworkId,
    title: "Both partners submitted homework",
    body: "Both partners submitted the same homework assignment. You can review and release feedback when ready.",
    actionPath: `${counselorJourneyPath(journey.id)}/homework`,
    pushTitle: "Marriage Prep homework",
    pushBody: "Both partners submitted homework on the same assignment.",
  });
}

export async function notifyCounselorHomeworkReviewPending(
  journey: MarriageCounselingJourneyRecord,
  homeworkId: string,
  partnerUserId: string,
) {
  const counselorId = journey.counselorUserId?.trim();
  if (!counselorId) return { created: 0 };

  return deliverMarriagePrepNotifications({
    journey,
    userIds: [counselorId],
    audience: "counselor",
    kind: "counselor_homework_review_pending",
    referenceKey: `${homeworkId}:${partnerUserId}`,
    title: "Homework awaiting review",
    body: "Submitted homework is waiting for counselor review and feedback.",
    actionPath: `${counselorJourneyPath(journey.id)}/homework`,
    pushTitle: "Homework review",
    pushBody: "Homework is waiting for your review in Marriage Prep.",
  });
}

export async function notifyCoupleAppointmentScheduled(
  journey: MarriageCounselingJourneyRecord,
  sessionId: string,
  sessionTitle?: string,
) {
  return deliverMarriagePrepNotifications({
    journey,
    userIds: journeyPartnerUserIds(journey),
    audience: "couple",
    kind: "appointment_scheduled",
    referenceKey: sessionId,
    title: "Appointment scheduled",
    body: "A new Marriage Prep counseling appointment was scheduled. Open the hub for time and location.",
    actionPath: "/marriage",
    pushTitle: "Counseling appointment",
    pushBody: sessionTitle
      ? "A Marriage Prep session was scheduled. Open the app for details."
      : "A Marriage Prep appointment was scheduled. Open the app for details.",
  });
}

export async function notifyCounselorAppointmentEvent(
  journey: MarriageCounselingJourneyRecord,
  sessionId: string,
  kind:
    | "counselor_appointment_scheduled"
    | "counselor_appointment_rescheduled"
    | "counselor_appointment_cancelled",
  referenceSuffix: string,
) {
  const counselorId = journey.counselorUserId?.trim();
  if (!counselorId) return { created: 0 };

  const copy =
    kind === "counselor_appointment_scheduled"
      ? {
          title: "Appointment scheduled",
          body: "You scheduled a Marriage Prep counseling appointment for your assigned couple.",
        }
      : kind === "counselor_appointment_rescheduled"
        ? {
            title: "Appointment rescheduled",
            body: "A Marriage Prep counseling appointment was rescheduled on your calendar.",
          }
        : {
            title: "Appointment cancelled",
            body: "A Marriage Prep counseling appointment was cancelled.",
          };

  return deliverMarriagePrepNotifications({
    journey,
    userIds: [counselorId],
    audience: "counselor",
    kind,
    referenceKey: `${sessionId}:${referenceSuffix}`,
    title: copy.title,
    body: copy.body,
    actionPath: `${counselorJourneyPath(journey.id)}#premarital-ops-appointments`,
    pushTitle: "Marriage Prep schedule",
    pushBody: copy.body,
  });
}

export async function notifyCounselorAppointmentUpcoming(
  journey: MarriageCounselingJourneyRecord,
  sessionId: string,
  scheduledAt: string,
) {
  const counselorId = journey.counselorUserId?.trim();
  if (!counselorId) return { created: 0 };

  return deliverMarriagePrepNotifications({
    journey,
    userIds: [counselorId],
    audience: "counselor",
    kind: "counselor_appointment_upcoming",
    referenceKey: `${sessionId}:${scheduledAt}`,
    title: "Upcoming counseling session",
    body: "You have an upcoming Marriage Prep counseling appointment with your assigned couple.",
    actionPath: `${counselorJourneyPath(journey.id)}#premarital-ops-appointments`,
    pushTitle: "Counseling appointment",
    pushBody: "Upcoming Marriage Prep session — open the counselor command center for details.",
  });
}

export async function notifyCounselorAttendanceMissing(
  journey: MarriageCounselingJourneyRecord,
  sessionId: string,
  scheduledAt: string,
) {
  const counselorId = journey.counselorUserId?.trim();
  if (!counselorId) return { created: 0 };

  return deliverMarriagePrepNotifications({
    journey,
    userIds: [counselorId],
    audience: "counselor",
    kind: "counselor_attendance_missing",
    referenceKey: `${sessionId}:${scheduledAt}`,
    title: "Record session attendance",
    body: "A scheduled Marriage Prep session passed without attendance recorded. Open clinical operations to document the session.",
    actionPath: `${counselorJourneyPath(journey.id)}#premarital-ops-attendance`,
    pushTitle: "Attendance needed",
    pushBody: "Record attendance for a recent Marriage Prep session.",
  });
}

export async function notifyCounselorEightSessionCloseout(journey: MarriageCounselingJourneyRecord) {
  const counselorId = journey.counselorUserId?.trim();
  if (!counselorId) return { created: 0 };

  return deliverMarriagePrepNotifications({
    journey,
    userIds: [counselorId],
    audience: "counselor",
    kind: "counselor_eight_session_closeout",
    referenceKey: journey.id,
    title: "Eight-session completion",
    body: "Your assigned couple completed all eight Marriage Prep sessions. Complete counselor closeout and readiness steps.",
    actionPath: `${counselorJourneyPath(journey.id)}#premarital-ops-readiness`,
    pushTitle: "Marriage Prep closeout",
    pushBody: "Complete counselor closeout after eight-session completion.",
  });
}

export async function notifySeniorPastorReadinessEligible(journey: MarriageCounselingJourneyRecord) {
  const spId = await getSeniorPastorUserId();
  if (!spId) return { created: 0 };

  return deliverMarriagePrepNotifications({
    journey,
    userIds: [spId],
    audience: "senior_pastor",
    kind: "sp_readiness_review_eligible",
    referenceKey: journey.id,
    title: "Final readiness review",
    body: "A premarital couple reached eligibility for final pastoral readiness review.",
    actionPath: `/marriage/counselor/journey/${journey.id}#premarital-ops-readiness`,
    pushTitle: "Marriage Prep readiness",
    pushBody: "A couple is eligible for final pastoral readiness review.",
  });
}

export async function notifySeniorPastorCertificateEligible(journey: MarriageCounselingJourneyRecord) {
  const spId = await getSeniorPastorUserId();
  if (!spId) return { created: 0 };

  return deliverMarriagePrepNotifications({
    journey,
    userIds: [spId],
    audience: "senior_pastor",
    kind: "sp_certificate_eligible",
    referenceKey: journey.id,
    title: "Certificate ready to issue",
    body: "A premarital couple met requirements for final certificate issuance.",
    actionPath: `/marriage/counselor/journey/${journey.id}`,
    pushTitle: "Marriage Prep certificate",
    pushBody: "A couple is eligible for final certificate issuance.",
  });
}

export async function checkFinalCertificateEligibilityAndNotifySeniorPastor(
  journey: MarriageCounselingJourneyRecord,
) {
  const blockers = await computeFinalCertificateBlockers(journey);
  if (blockers.length > 0) return;

  void notifySeniorPastorCertificateEligible(journey);
}

export async function notifySeniorPastorReadinessReviewSaved(
  journey: MarriageCounselingJourneyRecord,
  status: string,
) {
  const spId = await getSeniorPastorUserId();
  if (!spId) return { created: 0 };

  return deliverMarriagePrepNotifications({
    journey,
    userIds: [spId],
    audience: "senior_pastor",
    kind: "sp_counselor_readiness_submitted",
    referenceKey: `${journey.id}:${status}`,
    title: "Readiness review updated",
    body: "A Marriage Prep readiness review record was updated for pastoral oversight.",
    actionPath: `/marriage/counselor/journey/${journey.id}#premarital-ops-readiness`,
    pushTitle: "Marriage Prep readiness",
    pushBody: "Readiness review was updated for a premarital couple.",
  });
}

export async function notifySeniorPastorCertificateRevoked(
  journey: MarriageCounselingJourneyRecord,
  certificateId: string,
) {
  const spId = await getSeniorPastorUserId();
  if (!spId) return { created: 0 };

  return deliverMarriagePrepNotifications({
    journey,
    userIds: [spId],
    audience: "senior_pastor",
    kind: "sp_certificate_revoked",
    referenceKey: certificateId,
    title: "Certificate revoked",
    body: "A Marriage Prep final certificate was revoked. Details remain in pastoral certificate administration.",
    actionPath: `/marriage/counselor/journey/${journey.id}`,
    pushTitle: "Certificate revoked",
    pushBody: "A Marriage Prep certificate was revoked.",
  });
}

export async function notifySeniorPastorCertificateReplaced(
  journey: MarriageCounselingJourneyRecord,
  newCertificateId: string,
) {
  const spId = await getSeniorPastorUserId();
  if (!spId) return { created: 0 };

  return deliverMarriagePrepNotifications({
    journey,
    userIds: [spId],
    audience: "senior_pastor",
    kind: "sp_certificate_replaced",
    referenceKey: newCertificateId,
    title: "Certificate replaced",
    body: "A Marriage Prep final certificate was replaced with a new issued record.",
    actionPath: `/marriage/counselor/journey/${journey.id}`,
    pushTitle: "Certificate replaced",
    pushBody: "A Marriage Prep certificate was replaced.",
  });
}

export async function notifyAdministrativeCoordinatorAssigned(
  journey: MarriageCounselingJourneyRecord,
  coordinatorUserId: string,
) {
  return deliverMarriagePrepNotifications({
    journey,
    userIds: [coordinatorUserId],
    audience: "assignment_admin",
    kind: "admin_coordinator_assigned",
    referenceKey: journey.id,
    title: "Coordinator assignment",
    body: "You were assigned as the administrative coordinator for a Marriage Prep couple.",
    actionPath: "/marriage/admin/counselor-assignments",
    pushTitle: "Marriage Prep coordinator",
    pushBody: "You were assigned to coordinate a Marriage Prep couple.",
  });
}

export async function checkEightSessionCompletionAndNotify(
  journey: MarriageCounselingJourneyRecord,
) {
  if (journey.programType !== "premarital") return;

  const records = await store().listPremaritalProgramSessionsForJourney(journey.id);
  const allComplete = PREMARITAL_PROGRAM_SESSIONS.every((def) => {
    const row = records.find((r) => r.sessionKey === def.sessionKey);
    return row?.status === "completed";
  });
  if (!allComplete) return;

  void notifyCounselorEightSessionCloseout(journey);
  void notifySeniorPastorReadinessEligible(journey);
  void checkFinalCertificateEligibilityAndNotifySeniorPastor(journey);
}
