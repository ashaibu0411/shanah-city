export type TemperamentAssessmentKind = "member" | "leader";

export type TemperamentResponseStatus = "draft" | "submitted";

export type TemperamentDimension =
  | "communication"
  | "leadership_initiative"
  | "collaboration"
  | "emotional_expression"
  | "conflict_response"
  | "feedback_correction"
  | "structure"
  | "pace_decisions"
  | "service_motivation";

export type ClassicalTemperament = "sanguine" | "choleric" | "melancholic" | "phlegmatic";

export type TemperamentQuestionDef = {
  id: string;
  text: string;
  dimension: TemperamentDimension;
  /** Weights are normalized in scoring */
  classicalHint: Partial<Record<ClassicalTemperament, number>>;
  leaderOnly?: boolean;
};

/** Likert 1–5 answers keyed by question id */
export type TemperamentAnswersMap = Record<string, number>;

export type TemperamentClassicalScores = Record<ClassicalTemperament, number>;

export type TemperamentDimensionScores = Record<TemperamentDimension, number>;

export type TemperamentScoresPayload = {
  contentVersion: string;
  assessmentKind: TemperamentAssessmentKind;
  classical: TemperamentClassicalScores;
  dimensions: TemperamentDimensionScores;
};

export type TemperamentProfilePayload = {
  dominantTemperaments: {
    primary: ClassicalTemperament;
    secondary: ClassicalTemperament | null;
    classicalScores: TemperamentClassicalScores;
    note: string;
  };
  dimensionNarrative: Record<
    TemperamentDimension,
    {
      label: string;
      score: number;
      note: string;
    }
  >;
  strengthsTeamwork: string[];
  growthAreas: string[];
  communicationTips: string[];
  feedbackTips: string[];
  underPressure: string[];
  disagreementTips: string[];
  serveEffectively: string[];
  reflectionPrompts: string[];
};

export type TemperamentLeadershipReflection = {
  themes: string[];
  nextSteps: string[];
  note: string;
};

export type ShepherdingGuidanceBlock = {
  title: string;
  items: string[];
};

export type TemperamentShepherdingGuidance = {
  givingFeedback: ShepherdingGuidanceBlock;
  resolvingMisunderstandings: ShepherdingGuidanceBlock;
  delegating: ShepherdingGuidanceBlock;
  encouraging: ShepherdingGuidanceBlock;
  missedCommitments: ShepherdingGuidanceBlock;
  personalityDifferences: ShepherdingGuidanceBlock;
  teamDiscussion: ShepherdingGuidanceBlock;
};

/** Snapshot shared with leaders when the member opts in — no raw answers */
export type TemperamentLeaderSharedHighlights = {
  version: string;
  userId: string;
  displayName: string;
  assessmentKind: TemperamentAssessmentKind;
  submittedAt: string;
  dominantTemperaments: TemperamentProfilePayload["dominantTemperaments"];
  strengthsTeamwork: string[];
  communicationTips: string[];
  feedbackTips: string[];
};
