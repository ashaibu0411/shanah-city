export type CouplePrayerJournalStatus = "praying" | "answered";

export type CouplePrayerJournalPrivacy = "couple" | "personal";

export const COUPLE_PRAYER_JOURNAL_CATEGORIES = [
  {
    id: "our-family",
    label: "Our Family",
    description: "Guidance and protection",
    icon: "family" as const,
  },
  {
    id: "financial",
    label: "Financial Breakthrough",
    description: "Wisdom and provision",
    icon: "praying-hands" as const,
  },
  {
    id: "our-marriage",
    label: "Our Marriage",
    description: "Continued unity and love",
    icon: "heart" as const,
  },
  {
    id: "future-plans",
    label: "Future Plans",
    description: "Clarity for what's next",
    icon: "target" as const,
  },
  {
    id: "our-children",
    label: "Our Children",
    description: "Health, purpose and favor",
    icon: "family" as const,
  },
] as const;

export type CouplePrayerJournalCategoryId = (typeof COUPLE_PRAYER_JOURNAL_CATEGORIES)[number]["id"];

export type CouplePrayerJournalEntryRecord = {
  id: string;
  coupleLinkId: string;
  createdBy: string;
  title: string;
  body: string;
  category: CouplePrayerJournalCategoryId;
  scriptureRef?: string;
  privacy: CouplePrayerJournalPrivacy;
  status: CouplePrayerJournalStatus;
  answeredAt?: string;
  testimony?: string;
  thanksgivingScripture?: string;
  answeredPhotoKey?: string;
  createdAt: string;
  updatedAt: string;
};

export type CouplePrayerJournalEntryView = CouplePrayerJournalEntryRecord & {
  createdByName: string;
};
