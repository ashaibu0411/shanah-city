import type { FamilyMember, PublicMember } from "@/lib/auth-types";
import type { KidCheckIn } from "@/lib/member-types";
import type { KidsLesson, KidsRosterEntry, KidsRoomHeadcount } from "@/lib/kids-types";
import { KIDS_AGE_GROUPS } from "@/lib/kids-types";
import { useDatabase } from "@/lib/use-database";
import * as lessonDb from "@/lib/stores/kids-lesson-db";
import * as lessonJson from "@/lib/stores/kids-lesson-json";
import * as incidentDb from "@/lib/stores/kids-incident-db";
import * as incidentJson from "@/lib/stores/kids-incident-json";

const lessonStore = () => (useDatabase() ? lessonDb : lessonJson);
const incidentStore = () => (useDatabase() ? incidentDb : incidentJson);

export const listKidsLessons = (options?: Parameters<typeof lessonJson.listKidsLessons>[0]) =>
  lessonStore().listKidsLessons(options);
export const getKidsLesson = (weekStarting: string, ageGroup: string) =>
  lessonStore().getKidsLesson(weekStarting, ageGroup);
export const saveKidsLesson = (input: Parameters<typeof lessonJson.saveKidsLesson>[0]) =>
  lessonStore().saveKidsLesson(input);
export const listKidsIncidents = (options?: Parameters<typeof incidentJson.listKidsIncidents>[0]) =>
  incidentStore().listKidsIncidents(options);
export const addKidsIncident = (incident: Parameters<typeof incidentJson.addKidsIncident>[0]) =>
  incidentStore().addKidsIncident(incident);
export const markKidsIncidentNotified = (id: string) =>
  incidentStore().markKidsIncidentNotified(id);

export function toRosterEntry(entry: KidCheckIn): KidsRosterEntry {
  return {
    id: entry.id,
    parentName: entry.parentName,
    parentUserId: entry.parentUserId,
    childName: entry.childName,
    ageGroup: entry.ageGroup,
    service: entry.service,
    notes: entry.notes,
    allergies: entry.allergies,
    medicalNotes: entry.medicalNotes,
    authorizedPickup: entry.authorizedPickup,
    securityCode: entry.securityCode,
    checkedInAt: entry.checkedInAt,
    hasAllergyAlert: Boolean(entry.allergies?.trim()),
    hasMedicalAlert: Boolean(entry.medicalNotes?.trim()),
  };
}

export function buildHeadcount(active: KidCheckIn[]): KidsRoomHeadcount[] {
  const counts = new Map<string, number>();
  for (const group of KIDS_AGE_GROUPS) {
    counts.set(group, 0);
  }
  for (const entry of active) {
    counts.set(entry.ageGroup, (counts.get(entry.ageGroup) ?? 0) + 1);
  }
  return KIDS_AGE_GROUPS.map((ageGroup) => ({
    ageGroup,
    count: counts.get(ageGroup) ?? 0,
  }));
}

export function findFamilyChild(family: FamilyMember[], childName: string) {
  const normalized = childName.trim().toLowerCase();
  return family.find(
    (member) =>
      member.relationship === "child" &&
      member.name.trim().toLowerCase() === normalized,
  );
}

export function enrichCheckInFromProfile(
  user: PublicMember,
  childName: string,
): Pick<
  KidCheckIn,
  "parentUserId" | "familyMemberId" | "allergies" | "medicalNotes" | "authorizedPickup"
> {
  const child = findFamilyChild(user.family ?? [], childName);
  return {
    parentUserId: user.id,
    familyMemberId: child?.id,
    allergies: child?.allergies,
    medicalNotes: child?.medicalNotes,
    authorizedPickup: child?.authorizedPickup,
  };
}

export function filterActiveCheckIns(
  checkins: KidCheckIn[],
  options?: { service?: string; parentUserId?: string },
) {
  return checkins.filter((entry) => {
    if (entry.checkedOutAt) return false;
    if (options?.service && entry.service !== options.service) return false;
    if (options?.parentUserId && entry.parentUserId !== options.parentUserId) return false;
    return true;
  });
}

export function publishKidsLesson(
  lesson: Omit<KidsLesson, "publishedAt" | "status" | "updatedAt">,
): Omit<KidsLesson, "updatedAt"> {
  return {
    ...lesson,
    status: "published",
    publishedAt: new Date().toISOString(),
  };
}
