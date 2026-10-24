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

export function notifyMarriageAppointmentUpcoming(userIds: string[], sessionTitle?: string) {
  void sendPushToUsersWithPushEnabled(userIds, {
    title: "Counseling appointment",
    body: sessionTitle
      ? `Upcoming session: ${sessionTitle}. Open Marriage Prep for time and location.`
      : "You have an upcoming premarital counseling appointment. Open Marriage Prep for details.",
    url: "/marriage",
  });
}

export function notifyMarriageAppointmentRescheduled(userIds: string[], sessionTitle?: string) {
  void sendPushToUsersWithPushEnabled(userIds, {
    title: "Appointment updated",
    body: sessionTitle
      ? `${sessionTitle} was rescheduled. Check Marriage Prep for the new time.`
      : "A counseling appointment was rescheduled. Check Marriage Prep for the new time.",
    url: "/marriage",
  });
}

export function notifyMarriageAppointmentCancelled(userIds: string[], sessionTitle?: string) {
  void sendPushToUsersWithPushEnabled(userIds, {
    title: "Appointment cancelled",
    body: sessionTitle
      ? `${sessionTitle} was cancelled. Your counselor will follow up in Marriage Prep.`
      : "A counseling appointment was cancelled. Your counselor will follow up in Marriage Prep.",
    url: "/marriage",
  });
}

export function notifyMarriageHomeworkDue(userIds: string[]) {
  void sendPushToUsersWithPushEnabled(userIds, {
    title: "Marriage Prep homework",
    body: "You have homework due soon. Open Marriage Prep to continue.",
    url: "/marriage/homework",
  });
}
