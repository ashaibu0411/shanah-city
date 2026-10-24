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
