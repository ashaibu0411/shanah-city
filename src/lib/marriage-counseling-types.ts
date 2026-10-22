export type MarriageProgramType =
  | "premarital"
  | "enrichment"
  | "guided";

export type MarriageJourneyStatus = "active" | "completed" | "archived";

export type MarriageQuestionType =
  | "single_choice"
  | "multiple_choice"
  | "likert"
  | "agreement"
  | "ranking"
  | "short_answer"
  | "long_reflection"
  | "scenario"
  | "priorities"
  | "preferred_response"
  | "partner_prediction"
  | "budget_worksheet";

/** Standard Stage 2 module journey stages. */
export type MarriageModuleJourneyStage =
  | "learn"
  | "reflect"
  | "answer"
  | "compare"
  | "discuss"
  | "practice"
  | "agree"
  | "review";

export type MarriageStage2LessonDefinition = {
  id: string;
  title: string;
  summary: string;
  journeyStage: MarriageModuleJourneyStage;
  sortOrder: number;
  estimatedMinutes?: number;
  learnContent?: string;
};

export type MarriageAnswerVisibility =
  | "shared_after_both_submit"
  | "private_reflection"
  | "counselor_with_consent"
  /** Never shown to partner or in comparison; export includes owner only. */
  | "private_financial_disclosure"
  /** Both submit; each partner must grant share consent before comparison includes this answer. */
  | "explicit_consent_to_share";

export type MarriageStage2ActivityKind =
  | "assessment"
  | "scenario"
  | "prediction"
  | "conversation_card"
  | "budget_worksheet"
  | "agreement_builder"
  | "ranking"
  | "reflection";

/** Stage 2 partner comparison sharing — updates granted/updatedAt only; preserves counselor columns. */
export type MarriagePartnerSharingConsentPatch = {
  journeyId: string;
  moduleId: string;
  questionId: string;
  userId: string;
  granted: boolean;
  updatedAt: string;
};

export type MarriageSharingConsentRecord = {
  journeyId: string;
  moduleId: string;
  questionId: string;
  userId: string;
  /** Partner-to-partner comparison sharing (Stage 2). */
  granted: boolean;
  updatedAt: string;
  /** Spouse-controlled counselor answer disclosure; independent of `granted`. */
  counselorDisclosureGranted?: boolean;
  /** Assigned counselor at grant time; required for counselor answer disclosure (Phase 2+). */
  consentedCounselorUserId?: string | null;
  /** Answer change generation at grant time; must match current generation for disclosure. */
  generationAtGrant?: number | null;
  /** Optional secondary verification; not sufficient alone for disclosure. */
  answerFingerprint?: string | null;
  grantedAt?: string | null;
};

export type MarriageAnswerChangeGenerationRecord = {
  journeyId: string;
  moduleId: string;
  questionId: string;
  userId: string;
  generation: number;
};

export type MarriageAnswerChangeGenerationKey = Pick<
  MarriageAnswerChangeGenerationRecord,
  "journeyId" | "moduleId" | "questionId" | "userId"
>;

export type MarriageActivitySyncSessionRecord = {
  id: string;
  journeyId: string;
  moduleId: string;
  startedByUserId: string;
  status: "open" | "completed" | "cancelled";
  createdAt: string;
  updatedAt: string;
};

export type MarriageAssessmentResponseStatus = "draft" | "submitted";

export type MarriageJournalVisibility = "shared" | "private";

export type MarriageJournalKind =
  | "reflection"
  | "discussion_note"
  | "next_step"
  | "counselor_question"
  | "commitment";

export type MarriageJourneyPairingMode = "spouse_link" | "journey_invite";

export type MarriageCounselingJourneyRecord = {
  id: string;
  /** Legacy spouse-link journeys; empty for invite-only premarital pairs. */
  coupleLinkId: string;
  programType: MarriageProgramType;
  status: MarriageJourneyStatus;
  currentModuleId: string | null;
  counselorUserId: string | null;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
  pairingMode?: MarriageJourneyPairingMode;
  participantAId?: string;
  participantBId?: string | null;
  /** Guided counseling module sequence (module ids). */
  guidedModuleIds?: string[];
  /** Published curriculum version used for new work on this journey. */
  curriculumVersion?: string;
  counselorAccessRevokedAt?: string | null;
  deletionRequestedAt?: string | null;
};

export type MarriageJourneyInviteRecord = {
  id: string;
  code: string;
  journeyId: string;
  createdBy: string;
  intendedEmail?: string;
  expiresAt: string;
  revokedAt?: string;
  acceptedByUserId?: string;
  acceptedAt?: string;
  createdAt: string;
};

export type MarriageCurriculumVersionStatus = "draft" | "published" | "archived";

export type MarriageCurriculumModuleMeta = {
  biblicalReflection?: string;
  pastoralGuide?: string;
  estimatedMinutes?: number;
  scriptureRefs?: string[];
  /** Dashboard section id (journey, discover, talk, scenarios, agreements, growth, counselor). */
  stage2Section?: string;
  contentWarning?: string;
  activityKind?: MarriageStage2ActivityKind;
};

export type MarriageModuleDefinition = {
  id: string;
  title: string;
  summary: string;
  sortOrder: number;
  programTypes: MarriageProgramType[];
  questions: MarriageQuestionDefinition[];
  lessons?: MarriageStage2LessonDefinition[];
  meta?: MarriageCurriculumModuleMeta;
  archived?: boolean;
};

export type MarriageCurriculumVersionRecord = {
  id: string;
  version: string;
  status: MarriageCurriculumVersionStatus;
  modules: MarriageModuleDefinition[];
  createdBy: string;
  createdByName: string;
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
  basedOnVersion?: string;
};

export type MarriageProgramTrackEntry = {
  moduleId: string;
  required: boolean;
};

export type MarriageProgramTrackRecord = {
  programType: MarriageProgramType;
  entries: MarriageProgramTrackEntry[];
  updatedAt: string;
  updatedBy: string;
};

export type MarriageRevisionRequestRecord = {
  id: string;
  journeyId: string;
  moduleId: string;
  userId: string;
  reason?: string;
  status: "pending" | "approved" | "denied";
  requestedAt: string;
  resolvedAt?: string;
  resolvedBy?: string;
};

export type MarriageAuditLogRecord = {
  id: string;
  at: string;
  actorUserId: string;
  action: string;
  journeyId?: string;
  targetUserId?: string;
  meta?: Record<string, string | number | boolean>;
};

/** Pastoral workflow — clinical counselor on journey (not homework tasks). */
export type MarriageCounselorAssignmentRequestType = "assign" | "reassign" | "remove";

export type MarriageCounselorAssignmentRequestStatus =
  | "pending"
  | "approved"
  | "rejected"
  | "cancelled"
  | "superseded"
  | "executed";

export type MarriageCounselorAssignmentRequestRecord = {
  id: string;
  journeyId: string;
  requestType: MarriageCounselorAssignmentRequestType;
  /** Target counselor; null for remove. */
  requestedCounselorUserId: string | null;
  previousCounselorUserId: string | null;
  status: MarriageCounselorAssignmentRequestStatus;
  requestedByUserId: string;
  requestedAt: string;
  reviewedByUserId?: string | null;
  reviewedAt?: string | null;
  decisionNote?: string | null;
  executedAt?: string | null;
};

/** Participant authorizes restoration after revoke — not assessment disclosure consent. */
export type MarriageCounselorAssignmentAcknowledgmentRecord = {
  requestId: string;
  journeyId: string;
  userId: string;
  counselorUserId: string;
  acknowledgedAt: string;
};

export type MarriageCounselorParticipantRevocationRecord = {
  journeyId: string;
  userId: string;
  revokedAt: string;
};

/** Administrative coordination scope for assignment admins (not clinical access). */
export type MarriageJourneyAdministrativeCoordinatorRecord = {
  journeyId: string;
  coordinatorUserId: string;
  assignedByUserId: string;
  assignedAt: string;
};

export type MarriageSessionStatus = "scheduled" | "completed" | "cancelled";

export type MarriageCounselorAssignmentRecord = {
  id: string;
  journeyId: string;
  counselorUserId: string;
  title: string;
  description?: string;
  moduleId?: string;
  dueAt?: string;
  completedByUserIds: string[];
  createdAt: string;
  sessionId?: string;
};

export type MarriageJourneyConsentRecord = {
  journeyId: string;
  userId: string;
  consentVersion: string;
  consentedAt: string;
};

export type MarriageAssessmentResponseRecord = {
  id: string;
  journeyId: string;
  moduleId: string;
  contentVersion: string;
  userId: string;
  status: MarriageAssessmentResponseStatus;
  answers: Record<string, unknown>;
  lastSavedAt: string;
  submittedAt?: string;
  revisionGeneration?: number;
};

export type MarriageComparisonUnlockRecord = {
  journeyId: string;
  moduleId: string;
  contentVersion: string;
  unlockedAt: string;
};

export type MarriageJournalEntryRecord = {
  id: string;
  journeyId: string;
  authorId: string;
  authorName: string;
  visibility: MarriageJournalVisibility;
  kind: MarriageJournalKind;
  body: string;
  moduleId?: string;
  createdAt: string;
  updatedAt: string;
};

export type MarriageCounselingSessionRecord = {
  id: string;
  journeyId: string;
  scheduledAt: string;
  /** IANA timezone for interpreting legacy naive scheduledAt values and display (JSON store; DB column pending). */
  schedulingTimeZone?: string;
  zoomUrl?: string;
  notes?: string;
  topic?: string;
  status?: MarriageSessionStatus;
  prepModuleIds?: string[];
  homeworkAssignmentIds?: string[];
  createdBy: string;
  createdAt: string;
  updatedAt?: string;
  completedAt?: string;
  cancelledAt?: string;
};

export type MarriageCounselorNoteRecord = {
  id: string;
  journeyId: string;
  counselorUserId: string;
  body: string;
  createdAt: string;
  updatedAt: string;
};

export type MarriageDiscussionMarkRecord = {
  id: string;
  journeyId: string;
  moduleId: string;
  questionId: string;
  markedByUserId: string;
  sharedNote?: string;
  /** Note authorship / display time — preserved across reopen. */
  markedAt: string;
  /**
   * When this partner last marked the topic discussed.
   * `null` = explicitly reopened (note row kept). `undefined` = legacy row (treated as discussed).
   */
  discussedAt?: string | null;
};

export type MarriageQuestionOption = {
  id: string;
  label: string;
};

export type MarriageQuestionDefinition = {
  id: string;
  moduleId: string;
  prompt: string;
  type: MarriageQuestionType;
  options?: MarriageQuestionOption[];
  required: boolean;
  visibility: MarriageAnswerVisibility;
  sensitivity?: "normal" | "high";
  explanation?: string;
  discussionPrompt?: string;
  allowSkip?: boolean;
  min?: number;
  max?: number;
  lessonId?: string;
  journeyStage?: MarriageModuleJourneyStage;
  /** Temperament module: group likert items for couple summary charts. */
  temperamentDimension?: string;
  /** partner_prediction: question id whose options mirror the target self-report. */
  predictionTargetQuestionId?: string;
};

export type MarriageBudgetWorksheetAnswer = {
  mode: "hypothetical" | "actual";
  monthlyIncome: number;
  lines: Array<{ id: string; label: string; amount: number }>;
  notes?: string;
};

export type MarriageComparisonDiscussionState = {
  discussed: boolean;
  markedByUserId?: string;
  markedAt?: string;
  sharedNotes: Array<{
    authorUserId: string;
    body: string;
    markedAt: string;
  }>;
};

export type MarriageComparisonItem = {
  questionId: string;
  prompt: string;
  discussionPrompt?: string;
  myAnswer: unknown;
  partnerAnswer: unknown;
  category: "aligned" | "different" | "needs_conversation" | "not_yet_discussed";
  /** Couple discussion tracking — separate from answer-difference category. */
  discussion?: MarriageComparisonDiscussionState;
};

export type MarriageHubModuleProgress = {
  moduleId: string;
  title: string;
  summary: string;
  myStatus: "not_started" | "draft" | "submitted" | "locked";
  partnerStatus: "not_started" | "draft" | "submitted" | "waiting";
  comparisonReady: boolean;
  discussionAvailable: boolean;
};

export type MarriageHubAssignmentView = {
  id: string;
  title: string;
  dueAt?: string;
  completed: boolean;
  moduleId?: string;
};

export type MarriageStage2ActivityCategory =
  | "learning"
  | "temperament"
  | "financial"
  | "scenario";

export type MarriageStage2ActivityProgress = {
  activityId: string;
  moduleId: string;
  title: string;
  summary: string;
  category: MarriageStage2ActivityCategory;
  myStatus: MarriageHubModuleProgress["myStatus"];
  partnerStatus: MarriageHubModuleProgress["partnerStatus"];
  comparisonReady: boolean;
};

export type MarriageActionPlanItem = {
  id: string;
  text: string;
  ownerUserId?: string;
  done: boolean;
};

export type MarriageActionPlanRecord = {
  id: string;
  journeyId: string;
  moduleId?: string;
  title: string;
  createdByUserId: string;
  items: MarriageActionPlanItem[];
  status: "draft" | "proposed" | "agreed";
  agreedAt?: string;
  createdAt: string;
  updatedAt: string;
};

export type MarriageSharedGoalRecord = {
  id: string;
  journeyId: string;
  title: string;
  description?: string;
  category: "spiritual" | "financial" | "communication" | "family" | "other";
  createdByUserId: string;
  acknowledgedByUserIds: string[];
  targetDate?: string;
  createdAt: string;
  updatedAt: string;
};

export type MarriageLearningSectionId =
  | "journey"
  | "discover"
  | "talk"
  | "scenarios"
  | "agreements"
  | "growth"
  | "counselor";

export type MarriageLearningSectionView = {
  id: MarriageLearningSectionId;
  title: string;
  description: string;
  moduleIds: string[];
};

export type MarriageStage2Dashboard = {
  enabled: boolean;
  resumeModuleId: string | null;
  activities: MarriageStage2ActivityProgress[];
  actionPlans: MarriageActionPlanRecord[];
  sharedGoals: MarriageSharedGoalRecord[];
  assignmentsOpen: number;
  modulesCompleted: number;
  activitiesTotal: number;
  sections: MarriageLearningSectionView[];
  partnerName: string | null;
  programType: MarriageProgramType | null;
  nextSessionAt: string | null;
};

/** Participant-safe counseling session fields for the marriage hub. */
export type MarriageHubUpcomingSessionView = {
  id: string;
  topic?: string;
  scheduledAt: string;
  schedulingTimeZone?: string;
  zoomUrl?: string;
};

export type MarriageHubSummary = {
  viewerId: string;
  journey: MarriageCounselingJourneyRecord | null;
  programType: MarriageProgramType | null;
  partnerName: string | null;
  coupleLinkActive: boolean;
  pendingPartnerLink: boolean;
  myConsent: boolean;
  partnerConsent: boolean;
  partnerJoined: boolean;
  modules: MarriageHubModuleProgress[];
  nextSession: MarriageCounselingSessionRecord | null;
  upcomingSessions: MarriageHubUpcomingSessionView[];
  upcomingHomework: MarriageHubAssignmentView[];
  pendingInviteCode: string | null;
  isCounselor: boolean;
  isCurriculumAdmin: boolean;
  canSubmitCounselorAssignment: boolean;
  isSeniorPastorCounselorApprover: boolean;
  contentVersion: string;
  stage2?: MarriageStage2Dashboard;
};
