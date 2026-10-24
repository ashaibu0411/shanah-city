export type MarriageSessionHomeworkStatus = "draft" | "released";

export type MarriageHomeworkParticipantStatus = "not_started" | "in_progress" | "submitted" | "overdue";

export type MarriageHomeworkQuestionVisibility = "private" | "shared_with_partner";

export type MarriageHomeworkActivityKind =
  | "individual_writing"
  | "joint_discussion"
  | "scripture_reflection"
  | "curriculum_link";

export type MarriageHomeworkQuestionDef = {
  id: string;
  prompt: string;
  responseKind: "long_text";
  visibility: MarriageHomeworkQuestionVisibility;
  explanation?: string;
  writingExamples?: string[];
};

export type MarriageHomeworkActivityDef = {
  id: string;
  kind: MarriageHomeworkActivityKind;
  title: string;
  instructions?: string;
  discussionPrompt?: string;
  scriptureRefs?: string[];
  moduleIds?: string[];
  optionalModuleIds?: string[];
  questions: MarriageHomeworkQuestionDef[];
};

export type MarriageSessionHomeworkRecord = {
  id: string;
  journeyId: string;
  counselorUserId: string;
  sessionId?: string;
  templateKey?: string;
  title: string;
  instructions?: string;
  status: MarriageSessionHomeworkStatus;
  dueAt?: string;
  dueAtTimeZone?: string;
  activities: MarriageHomeworkActivityDef[];
  counselorPrivateNotes?: string;
  /** Feedback visible only to the partner it is addressed to. */
  partnerFeedback?: Record<string, string>;
  releasedAt?: string;
  reopenedAt?: string;
  createdAt: string;
  updatedAt: string;
};

export type MarriageSessionHomeworkResponseRecord = {
  homeworkId: string;
  userId: string;
  answers: Record<string, string>;
  lastSavedAt: string;
  submittedAt?: string;
};

export type MarriageHomeworkTemplateSummary = {
  key: string;
  title: string;
  description: string;
  activityCount: number;
  timingLabel?: string;
  assignedAfterLabel?: string;
  preparingForLabel?: string | null;
  postProgramNote?: string;
  estimatedMinutes?: number;
};

export type MarriageCounselorHomeworkListItem = {
  id: string;
  title: string;
  status: MarriageSessionHomeworkStatus;
  templateKey?: string;
  dueAt?: string;
  dueAtTimeZone?: string;
  releasedAt?: string;
  partnerA: { userId: string; name: string; status: MarriageHomeworkParticipantStatus };
  partnerB: { userId: string; name: string; status: MarriageHomeworkParticipantStatus };
};

/** Stable key for persisted answers: activityId:questionId */
export function homeworkAnswerKey(activityId: string, questionId: string): string {
  return `${activityId}:${questionId}`;
}
