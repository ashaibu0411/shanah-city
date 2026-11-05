export const SELF_PACED_WORKFLOW_STATUSES = [
  "assigned",
  "awaiting_partners",
  "ready_for_review",
  "feedback_draft",
  "feedback_published",
  "homework_review",
  "clarification_open",
  "pastoral_follow_up",
  "approved",
] as const;

export type SelfPacedWorkflowStatus = (typeof SELF_PACED_WORKFLOW_STATUSES)[number];

export type MarriageCounselorStructuredFeedback = {
  strengths?: string;
  concerns?: string;
  discussionTopics?: string;
  biblicalGuidance?: string;
  practicalExercises?: string;
  individualRecommendations?: string;
  jointRecommendations?: string;
  homeworkNotes?: string;
  finalComments?: string;
  /** Visible to both partners when published. */
  sharedFeedback?: string;
  /** Map of userId -> partner-specific feedback (never shown to other partner). */
  partnerSpecific?: Record<string, string>;
  /** Counselor-only internal notes — never published to couples. */
  counselorInternalNotes?: string;
  optionalMeetingRecommended?: boolean;
};

export type MarriageSelfPacedSessionReviewRecord = {
  id: string;
  journeyId: string;
  sessionKey: string;
  assignedModuleIds: string[];
  workflowStatus: SelfPacedWorkflowStatus;
  assignedByUserId: string;
  assignedAt: string;
  readyForReviewAt: string | null;
  feedbackDraft: MarriageCounselorStructuredFeedback | null;
  feedbackPublished: MarriageCounselorStructuredFeedback | null;
  feedbackPublishedAt: string | null;
  approvedAt: string | null;
  approvedByUserId: string | null;
  pastoralFollowUpAt: string | null;
  updatedAt: string;
};

export type MarriageSessionClarificationMessageRecord = {
  id: string;
  journeyId: string;
  sessionKey: string;
  authorUserId: string;
  authorRole: "counselor" | "partner";
  body: string;
  createdAt: string;
};
