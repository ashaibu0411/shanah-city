export const CHECK_IN_DIMENSIONS = [
  {
    id: "communication",
    label: "Communication",
    prompt: "How are you doing at listening and speaking with kindness?",
    conversationStarter: "What is one thing I can do this week to help you feel heard?",
  },
  {
    id: "connection",
    label: "Emotional connection",
    prompt: "How connected do you feel to your spouse right now?",
    conversationStarter: "When did you feel closest to me recently?",
  },
  {
    id: "quality-time",
    label: "Quality time",
    prompt: "Are you making intentional time for each other?",
    conversationStarter: "What would a meaningful hour together look like this week?",
  },
  {
    id: "appreciation",
    label: "Appreciation",
    prompt: "Do you feel valued and appreciated?",
    conversationStarter: "Name one way your spouse blessed you this week.",
  },
  {
    id: "spiritual",
    label: "Spiritual growth",
    prompt: "Are you growing together in faith and prayer?",
    conversationStarter: "How can we pray together more intentionally?",
  },
  {
    id: "responsibilities",
    label: "Shared responsibilities",
    prompt: "How can you support each other in daily life?",
    conversationStarter: "What would lighten the load for your spouse this week?",
  },
] as const;

export type CheckInDimensionId = (typeof CHECK_IN_DIMENSIONS)[number]["id"];

export type CoupleCheckInAnswerRecord = {
  id: string;
  weekId: string;
  userId: string;
  dimension: CheckInDimensionId;
  reflection?: string;
  shareWithSpouse: boolean;
  createdAt: string;
};

export type CoupleCheckInWeekRecord = {
  id: string;
  coupleLinkId: string;
  weekStart: string;
  createdAt: string;
};
