export type CouplePrayerJournalStatus = "praying" | "answered";

export type CouplePrayerJournalEntryRecord = {
  id: string;
  coupleLinkId: string;
  createdBy: string;
  title: string;
  body: string;
  status: CouplePrayerJournalStatus;
  answeredAt?: string;
  createdAt: string;
  updatedAt: string;
};

export type CouplePrayerJournalEntryView = CouplePrayerJournalEntryRecord & {
  createdByName: string;
};
