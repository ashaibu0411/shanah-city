import type { MarriageMeetingMode } from "@/lib/marriage-counseling-types";

export type MarriageCounselorCommandCenterOverview = {
  activeAssignedCouples: number;
  upcomingAppointments: number;
  homeworkAwaitingReview: number;
  sessionsNeedingAttendance: number;
  approachingFinalReview: number;
  pausedJourneys: number;
};

export type MarriageCounselorCoupleCardStatus =
  | "active"
  | "paused"
  | "completed"
  | "approaching_review";

export type MarriageCounselorCommandCenterCouple = {
  journeyId: string;
  coupleNames: string;
  programType: string;
  journeyStatus: string;
  cardStatus: MarriageCounselorCoupleCardStatus;
  currentSessionTitle: string | null;
  progressLabel: string;
  progressRatio: number;
  nextAppointmentAt: string | null;
  nextAppointmentTimeZone?: string;
  nextAppointmentTitle: string | null;
  homeworkSummary: string;
  homeworkAwaitingReviewCount: number;
  lastActivityAt: string | null;
  hasUpcomingAppointment: boolean;
};

export type MarriageCounselorCommandCenterAppointment = {
  sessionId: string;
  journeyId: string;
  coupleNames: string;
  scheduledAt: string;
  scheduledEndAt?: string;
  schedulingTimeZone?: string;
  sessionTitle: string;
  meetingMode?: MarriageMeetingMode;
  premaritalSessionKey?: string;
};

export type MarriageCounselorCommandCenterActionKind =
  | "homework_review"
  | "attendance_missing"
  | "assignment_overdue"
  | "session_preparation"
  | "revision_pending"
  | "pastoral_readiness_pending";

export type MarriageCounselorCommandCenterAction = {
  id: string;
  kind: MarriageCounselorCommandCenterActionKind;
  journeyId: string;
  coupleNames: string;
  title: string;
  detail?: string;
  dueAt?: string;
  href: string;
  priority: number;
};

export type MarriageCounselorCommandCenterView = {
  counselorId: string;
  schedulingTimeZone: string;
  overview: MarriageCounselorCommandCenterOverview;
  couples: MarriageCounselorCommandCenterCouple[];
  upcomingAppointments: MarriageCounselorCommandCenterAppointment[];
  actions: MarriageCounselorCommandCenterAction[];
  flags: {
    isMarriageCounselor: boolean;
    hasAssignedClinicalCouples: boolean;
    canOpenAssignmentAdmin: boolean;
  };
};
