import type { MarriageCounselingJourneyRecord } from "@/lib/marriage-counseling-types";
import {
  deliverMarriagePrepNotifications,
  journeyPartnerUserIds,
} from "@/lib/marriage-prep-notifications-server";
import { sendPushToUsersWithPushEnabled } from "@/lib/push-server";

export function notifyMarriagePartnerJoined(partnerId: string) {
  void sendPushToUsersWithPushEnabled([partnerId], {
    title: "Marriage journey",
    body: "Your partner joined your counseling journey.",
    url: "/marriage",
  });
}

export function notifyMarriageComparisonReady(userIds: string[], moduleTitle: string) {
  void sendPushToUsersWithPushEnabled(userIds, {
    title: "Comparison ready",
    body: `You can compare answers for “${moduleTitle}”.`,
    url: "/marriage",
  });
}

export function notifyMarriagePartnerSubmitted(partnerId: string) {
  void sendPushToUsersWithPushEnabled([partnerId], {
    title: "Assessment update",
    body: "Your partner submitted their module assessment.",
    url: "/marriage",
  });
}

export function notifyMarriageDefaultCounselorAssignmentQueued(counselorUserId: string) {
  void sendPushToUsersWithPushEnabled([counselorUserId], {
    title: "Premarital counselor assignment",
    body: "A premarital journey was submitted for Senior Pastor approval with you as the proposed counselor.",
    url: "/marriage/admin/counselor-assignments",
  });
}

export async function notifyMarriageAppointmentUpcoming(
  journey: MarriageCounselingJourneyRecord,
  sessionId: string,
  options?: { sessionTitle?: string; referenceKey?: string },
) {
  return deliverMarriagePrepNotifications({
    journey,
    userIds: journeyPartnerUserIds(journey),
    kind: "appointment_upcoming",
    referenceKey: options?.referenceKey ?? sessionId,
    title: "Upcoming counseling appointment",
    body: options?.sessionTitle
      ? `You have an upcoming session on your Marriage Prep schedule.`
      : "You have an upcoming premarital counseling appointment on your Marriage Prep schedule.",
    actionPath: "/marriage",
    pushTitle: "Counseling appointment",
    pushBody: options?.sessionTitle
      ? "Upcoming Marriage Prep session — open the app for time and location."
      : "You have an upcoming Marriage Prep appointment. Open the app for details.",
  });
}

export async function notifyMarriageAppointmentRescheduled(
  journey: MarriageCounselingJourneyRecord,
  sessionId: string,
  sessionTitle?: string,
) {
  return deliverMarriagePrepNotifications({
    journey,
    userIds: journeyPartnerUserIds(journey),
    kind: "appointment_rescheduled",
    referenceKey: `${sessionId}:rescheduled`,
    title: "Appointment updated",
    body: "A counseling appointment on your Marriage Prep schedule was rescheduled.",
    actionPath: "/marriage",
    pushTitle: "Appointment updated",
    pushBody: sessionTitle
      ? "A Marriage Prep session was rescheduled. Open the app for the new time."
      : "A Marriage Prep appointment was rescheduled. Open the app for the new time.",
  });
}

export async function notifyMarriageAppointmentCancelled(
  journey: MarriageCounselingJourneyRecord,
  sessionId: string,
  sessionTitle?: string,
) {
  return deliverMarriagePrepNotifications({
    journey,
    userIds: journeyPartnerUserIds(journey),
    kind: "appointment_cancelled",
    referenceKey: `${sessionId}:cancelled`,
    title: "Appointment cancelled",
    body: "A counseling appointment was cancelled. Your counselor will follow up in Marriage Prep.",
    actionPath: "/marriage",
    pushTitle: "Appointment cancelled",
    pushBody: sessionTitle
      ? "A Marriage Prep session was cancelled. Your counselor will follow up."
      : "A Marriage Prep appointment was cancelled. Your counselor will follow up.",
  });
}

export async function notifyMarriageHomeworkDue(
  journey: MarriageCounselingJourneyRecord,
  userId: string,
  homeworkId: string,
) {
  return deliverMarriagePrepNotifications({
    journey,
    userIds: [userId],
    kind: "homework_due",
    referenceKey: `${homeworkId}:due`,
    title: "Homework due soon",
    body: "You have Marriage Prep homework due soon. Open your assignments to continue.",
    actionPath: "/marriage/homework",
    pushTitle: "Marriage Prep homework",
    pushBody: "You have homework due soon. Open Marriage Prep to continue.",
  });
}

export async function notifyMarriageHomeworkReleased(
  journey: MarriageCounselingJourneyRecord,
  homeworkId: string,
) {
  return deliverMarriagePrepNotifications({
    journey,
    userIds: journeyPartnerUserIds(journey),
    kind: "homework_released",
    referenceKey: homeworkId,
    title: "Homework available",
    body: "Your counselor released new Marriage Prep homework. Individual answers stay private.",
    actionPath: `/marriage/homework/${homeworkId}`,
    pushTitle: "Marriage Prep homework",
    pushBody: "Your counselor released new homework. Open Marriage Prep when you are ready.",
  });
}

export async function notifyMarriageCounselorFeedbackAvailable(
  journey: MarriageCounselingJourneyRecord,
  userId: string,
  homeworkId: string,
) {
  return deliverMarriagePrepNotifications({
    journey,
    userIds: [userId],
    kind: "counselor_feedback",
    referenceKey: `${homeworkId}:${userId}`,
    title: "Counselor feedback",
    body: "Your counselor shared feedback on your homework. Open Marriage Prep to read it.",
    actionPath: `/marriage/homework/${homeworkId}`,
    pushTitle: "Counselor feedback",
    pushBody: "New Marriage Prep feedback is available. Open the app to read it.",
  });
}

export async function notifyMarriageSessionCompleted(
  journey: MarriageCounselingJourneyRecord,
  sessionKey: string,
) {
  return deliverMarriagePrepNotifications({
    journey,
    userIds: journeyPartnerUserIds(journey),
    kind: "session_completed",
    referenceKey: sessionKey,
    title: "Session milestone",
    body: "Your counselor marked a Marriage Prep session complete. View your progress and certificates in the hub.",
    actionPath: "/marriage",
    pushTitle: "Marriage Prep session",
    pushBody: "A counseling session was marked complete. Open Marriage Prep to see your progress.",
  });
}

export async function notifyMarriageFinalCertificateIssued(journey: MarriageCounselingJourneyRecord) {
  return deliverMarriagePrepNotifications({
    journey,
    userIds: journeyPartnerUserIds(journey),
    kind: "final_certificate_issued",
    referenceKey: journey.id,
    title: "Program certificate",
    body: "Your Marriage Prep completion certificate is available when your pastor has formally issued it. Open Marriage Prep to download authorized certificates.",
    actionPath: "/marriage",
    pushTitle: "Marriage Prep certificate",
    pushBody: "Your completion certificate is ready to download in Marriage Prep.",
  });
}

export async function notifyMarriageFollowUpReleased(
  journey: MarriageCounselingJourneyRecord,
  sessionKey: string,
) {
  return deliverMarriagePrepNotifications({
    journey,
    userIds: journeyPartnerUserIds(journey),
    kind: "follow_up_released",
    referenceKey: sessionKey,
    title: "Counselor follow-up",
    body: "Your counselor shared follow-up steps for your Marriage Prep journey. Open the hub for details.",
    actionPath: "/marriage",
    pushTitle: "Marriage Prep follow-up",
    pushBody: "Your counselor shared follow-up steps. Open Marriage Prep to view them.",
  });
}
