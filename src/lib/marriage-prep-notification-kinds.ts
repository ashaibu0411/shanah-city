import type { MarriagePrepNotificationKind } from "@/lib/marriage-prep-notification-types";

export type MarriagePrepNotificationAudience =
  | "couple"
  | "counselor"
  | "counselor_proposed"
  | "senior_pastor"
  | "assignment_admin";

const COUPLE_KINDS = new Set<MarriagePrepNotificationKind>([
  "homework_released",
  "homework_due",
  "appointment_upcoming",
  "appointment_scheduled",
  "appointment_rescheduled",
  "appointment_cancelled",
  "counselor_feedback",
  "session_completed",
  "final_certificate_issued",
  "follow_up_released",
  "counselor_assigned",
]);

const COUNSELOR_KINDS = new Set<MarriagePrepNotificationKind>([
  "counselor_new_assignment",
  "counselor_partners_consent_ready",
  "counselor_assessment_submitted",
  "counselor_homework_submitted",
  "counselor_homework_both_submitted",
  "counselor_appointment_scheduled",
  "counselor_appointment_rescheduled",
  "counselor_appointment_cancelled",
  "counselor_appointment_upcoming",
  "counselor_attendance_missing",
  "counselor_homework_review_pending",
  "counselor_eight_session_closeout",
]);

const COUNSELOR_PROPOSED_KINDS = new Set<MarriagePrepNotificationKind>([
  "counselor_assignment_proposed",
]);

const SENIOR_PASTOR_KINDS = new Set<MarriagePrepNotificationKind>([
  "sp_assignment_pending",
  "sp_assignment_reassign_pending",
  "sp_readiness_review_eligible",
  "sp_counselor_readiness_submitted",
  "sp_certificate_eligible",
  "sp_certificate_revoked",
  "sp_certificate_replaced",
]);

const ASSIGNMENT_ADMIN_KINDS = new Set<MarriagePrepNotificationKind>([
  "admin_coordinator_assigned",
  "admin_assignment_pending_on_journey",
]);

export function audienceForMarriagePrepNotificationKind(
  kind: MarriagePrepNotificationKind,
): MarriagePrepNotificationAudience {
  if (COUPLE_KINDS.has(kind)) return "couple";
  if (COUNSELOR_KINDS.has(kind)) return "counselor";
  if (COUNSELOR_PROPOSED_KINDS.has(kind)) return "counselor_proposed";
  if (SENIOR_PASTOR_KINDS.has(kind)) return "senior_pastor";
  if (ASSIGNMENT_ADMIN_KINDS.has(kind)) return "assignment_admin";
  return "couple";
}

export function isCoupleMarriagePrepNotificationKind(kind: MarriagePrepNotificationKind): boolean {
  return COUPLE_KINDS.has(kind);
}
