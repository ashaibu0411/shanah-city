import type { Group } from "@/lib/group-types";

export const KIDS_GROUP_ID = "group-kids";

export const KIDS_AGE_GROUPS = [
  "Nursery (0-2)",
  "Preschool (3-5)",
  "Elementary (6-11)",
  "Youth (12+)",
] as const;

export const KIDS_SERVICES = ["Friday Evening", "Sunday Morning"] as const;

export type KidsAgeGroup = (typeof KIDS_AGE_GROUPS)[number];
export type KidsService = (typeof KIDS_SERVICES)[number];

export type AuthorizedPickupContact = {
  name: string;
  phone?: string;
  relationship?: string;
};

export type KidsLesson = {
  id: string;
  weekStarting: string;
  ageGroup: string;
  title: string;
  content: string;
  status: "draft" | "published";
  publishedAt?: string;
  createdBy: string;
  createdByName: string;
  createdAt: string;
  updatedAt: string;
};

export type KidsIncident = {
  id: string;
  checkInId?: string;
  childName: string;
  parentUserId?: string;
  ageGroup: string;
  service: string;
  severity: "minor" | "moderate" | "urgent";
  summary: string;
  details?: string;
  actionTaken?: string;
  reportedBy: string;
  reportedByName: string;
  parentNotified: boolean;
  notifiedAt?: string;
  createdAt: string;
};

export type KidsRosterEntry = {
  id: string;
  parentName: string;
  parentUserId?: string;
  childName: string;
  ageGroup: string;
  service: string;
  notes?: string;
  allergies?: string;
  medicalNotes?: string;
  authorizedPickup?: AuthorizedPickupContact[];
  securityCode: string;
  checkedInAt: string;
  hasAllergyAlert: boolean;
  hasMedicalAlert: boolean;
};

export type KidsRoomHeadcount = {
  ageGroup: string;
  count: number;
};

export function getWeekStarting(date = new Date()) {
  const copy = new Date(date);
  const day = copy.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  copy.setDate(copy.getDate() + diff);
  copy.setHours(0, 0, 0, 0);
  return copy.toISOString().slice(0, 10);
}

export function isKidsMinistryGroupName(name: string) {
  const normalized = name.toLowerCase();
  return normalized.includes("kid") || normalized.includes("children");
}

export function isKidsMinistryGroup(group: Pick<Group, "id" | "name" | "category">) {
  if (group.id === KIDS_GROUP_ID) return true;
  return isKidsMinistryGroupName(group.name);
}
