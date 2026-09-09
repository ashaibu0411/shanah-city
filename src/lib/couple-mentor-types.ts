export type CoupleMentorRequestRecord = {
  id: string;
  coupleLinkId: string;
  requesterId: string;
  requesterName: string;
  note?: string;
  status: "open" | "matched" | "closed";
  mentorLinkId?: string;
  matchedBy?: string;
  matchedByName?: string;
  matchedAt?: string;
  createdAt: string;
  updatedAt: string;
};

export type CoupleMentorRequestView = CoupleMentorRequestRecord & {
  coupleLabel: string;
  mentorLabel?: string;
};
