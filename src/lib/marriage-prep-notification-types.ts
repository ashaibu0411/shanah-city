export type MarriagePrepNotificationKind =
  | "homework_released"
  | "homework_due"
  | "appointment_upcoming"
  | "appointment_scheduled"
  | "appointment_rescheduled"
  | "appointment_cancelled"
  | "counselor_feedback"
  | "session_completed"
  | "final_certificate_issued"
  | "follow_up_released"
  | "counselor_assigned"
  | "partner_invite_active"
  | "partner_joined"
  | "partner_consent_recorded"
  | "couple_both_consented"
  | "pastoral_readiness_ready"
  | "counselor_new_assignment"
  | "counselor_partners_consent_ready"
  | "counselor_assessment_submitted"
  | "counselor_homework_submitted"
  | "counselor_homework_both_submitted"
  | "counselor_appointment_scheduled"
  | "counselor_appointment_rescheduled"
  | "counselor_appointment_cancelled"
  | "counselor_appointment_upcoming"
  | "counselor_attendance_missing"
  | "counselor_homework_review_pending"
  | "counselor_homework_resubmitted"
  | "couple_homework_revision_requested"
  | "counselor_eight_session_closeout"
  | "counselor_self_paced_ready"
  | "couple_self_paced_feedback"
  | "counselor_assignment_proposed"
  | "sp_assignment_pending"
  | "sp_assignment_reassign_pending"
  | "sp_readiness_review_eligible"
  | "sp_counselor_readiness_submitted"
  | "sp_certificate_eligible"
  | "sp_certificate_revoked"
  | "sp_certificate_replaced"
  | "admin_coordinator_assigned"
  | "admin_assignment_pending_on_journey";

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
