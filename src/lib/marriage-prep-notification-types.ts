export type MarriagePrepNotificationKind =
  | "homework_released"
  | "homework_due"
  | "appointment_upcoming"
  | "appointment_rescheduled"
  | "appointment_cancelled"
  | "counselor_feedback"
  | "session_completed"
  | "final_certificate_issued"
  | "follow_up_released";

export type MarriagePrepUserNotificationRecord = {
  id: string;
  userId: string;
  journeyId: string;
  kind: MarriagePrepNotificationKind;
  referenceKey: string;
  title: string;
  body: string;
  actionPath: string;
  readAt: string | null;
  createdAt: string;
};

export type MarriagePrepNotificationListView = {
  unreadCount: number;
  items: MarriagePrepUserNotificationRecord[];
};
