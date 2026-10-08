export const DATE_NIGHT_BUDGETS = [
  { id: "free", label: "Free" },
  { id: "low", label: "$" },
  { id: "medium", label: "$$" },
  { id: "special", label: "$$$" },
] as const;

export type DateNightBudget = (typeof DATE_NIGHT_BUDGETS)[number]["id"];

export const DATE_NIGHT_LOCATIONS = [
  { id: "home", label: "At home" },
  { id: "outdoor", label: "Outdoor" },
  { id: "dining", label: "Dining out" },
  { id: "faith", label: "Faith-centered" },
  { id: "adventure", label: "Adventure" },
] as const;

export type DateNightLocation = (typeof DATE_NIGHT_LOCATIONS)[number]["id"];

export type DateNightPlanStatus =
  | "idea"
  | "favorite"
  | "planned"
  | "completed"
  | "surprise_pending";

export type CoupleDateNightPlanRecord = {
  id: string;
  coupleLinkId: string;
  title: string;
  budget?: DateNightBudget;
  locationType?: DateNightLocation;
  scheduledAt?: string;
  isSurprise: boolean;
  invitedUserId?: string;
  status: DateNightPlanStatus;
  completedAt?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
};

export type DateNightIdeaCatalogItem = {
  id: string;
  title: string;
  description: string;
  budget: DateNightBudget;
  locationType: DateNightLocation;
};

export type CoupleDateNightPlanView = CoupleDateNightPlanRecord & {
  createdByName: string;
  isFromMe: boolean;
  /** Hide title for surprise recipient until accepted */
  displayTitle: string;
  canAcceptSurprise: boolean;
};
