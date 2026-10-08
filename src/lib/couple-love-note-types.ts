export const COUPLE_LOVE_NOTE_TYPES = [
  { id: "appreciation", label: "Appreciation", emoji: "💛" },
  { id: "encouragement", label: "Encouragement", emoji: "🌿" },
  { id: "scripture", label: "Scripture", emoji: "📖" },
  { id: "anniversary", label: "Anniversary", emoji: "💍" },
  { id: "surprise", label: "Surprise", emoji: "🎁" },
] as const;

export type CoupleLoveNoteType = (typeof COUPLE_LOVE_NOTE_TYPES)[number]["id"];

export type CoupleLoveNoteRecord = {
  id: string;
  coupleLinkId: string;
  fromUserId: string;
  noteType: CoupleLoveNoteType;
  body: string;
  scriptureRef?: string;
  readAt?: string;
  createdAt: string;
};

export type CoupleLoveNoteView = CoupleLoveNoteRecord & {
  fromUserName: string;
  isFromMe: boolean;
  isUnread: boolean;
};
