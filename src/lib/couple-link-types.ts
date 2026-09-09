export type CoupleLinkStatus = "pending" | "active" | "declined";

export type CoupleLinkRecord = {
  id: string;
  userAId: string;
  userBId: string;
  status: CoupleLinkStatus;
  requestedBy: string;
  anniversaryDate?: string;
  createdAt: string;
  acceptedAt?: string;
};

export type CoupleLinkView = {
  id: string;
  status: CoupleLinkStatus;
  partnerId: string;
  partnerName: string;
  partnerEmail: string;
  requestedBy: string;
  isIncomingInvite: boolean;
  acceptedAt?: string;
  anniversaryDate?: string;
};

export type CoupleLinkStatusResponse = {
  link: CoupleLinkView | null;
  pendingIncoming: CoupleLinkView | null;
  anniversaryNudge?: {
    daysUntil: number;
    yearsMarried: number | null;
    anniversaryDate: string;
  } | null;
};
