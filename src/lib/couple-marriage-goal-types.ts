export const MARRIAGE_GOAL_CATEGORIES = [
  { id: "spiritual", label: "Spiritual" },
  { id: "financial", label: "Financial" },
  { id: "family", label: "Family" },
  { id: "parenting", label: "Parenting" },
  { id: "communication", label: "Communication" },
  { id: "enrichment", label: "Marriage enrichment" },
] as const;

export type MarriageGoalCategory = (typeof MARRIAGE_GOAL_CATEGORIES)[number]["id"];

export type MarriageGoalMilestone = {
  id: string;
  title: string;
  done: boolean;
};

export type CoupleMarriageGoalRecord = {
  id: string;
  coupleLinkId: string;
  category: MarriageGoalCategory;
  title: string;
  description?: string;
  targetDate?: string;
  progress: number;
  milestones: MarriageGoalMilestone[];
  createdBy: string;
  createdAt: string;
  updatedAt: string;
};
