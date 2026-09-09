export type CouplePrayerPostRecord = {
  id: string;
  coupleLinkId: string;
  authorId: string;
  authorName: string;
  content: string;
  type: "prayer" | "praise";
  createdAt: string;
};
