export type AuthorizedPickupContact = {
  name: string;
  phone?: string;
  relationship?: string;
};

export type FamilyMember = {
  id: string;
  name: string;
  relationship: "spouse" | "child" | "parent" | "sibling" | "other";
  birthYear?: string;
  notes?: string;
  allergies?: string;
  medicalNotes?: string;
  authorizedPickup?: AuthorizedPickupContact[];
};

export type NotificationPrefs = {
  pushEnabled: boolean;
  devotions: boolean;
  messages: boolean;
  announcements: boolean;
  worship: boolean;
  kids: boolean;
};

export type NotificationTopic = "devotions" | "messages" | "announcements" | "worship" | "kids";

export type MemberProfile = {
  id: string;
  name: string;
  email: string;
  phone?: string;
  campusId: string;
  role?: "member" | "leader" | "team" | "media";
  avatarUrl?: string;
  notificationPrefs?: NotificationPrefs;
  passwordHash: string;
  family: FamilyMember[];
  createdAt: string;
  updatedAt: string;
};

export type PublicMember = Omit<MemberProfile, "passwordHash">;

export type SessionRecord = {
  token: string;
  userId: string;
  expiresAt: string;
};

export type ActivityItem = {
  id: string;
  userId: string;
  type:
    | "signup"
    | "profile_update"
    | "family_added"
    | "family_updated"
    | "signin"
    | "devotion_published"
    | "message_sent"
    | "leader_promoted"
    | "notifications_updated"
    | "password_reset";
  label: string;
  createdAt: string;
};
