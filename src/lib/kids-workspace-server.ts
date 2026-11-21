import { prisma } from "@/lib/db";
import { useDatabase } from "@/lib/use-database";
import { KIDS_AGE_GROUPS } from "@/lib/kids-types";
import type { KidCheckIn } from "@/lib/member-types";
import type { KidsLesson } from "@/lib/kids-types";
import {
  getServiceDateLabel,
  suggestAgeGroupFromBirthYear,
  type KidsChildSearchResult,
  type KidsLeaderSnapshot,
  type KidsTeacherAssignment,
} from "@/lib/kids-workspace-types";
import { buildHeadcount, filterActiveCheckIns, listKidsIncidents, listKidsLessons } from "@/lib/kids-server";
import * as workspaceDb from "@/lib/stores/kids-workspace-db";
import * as workspaceJson from "@/lib/stores/kids-workspace-json";
import { getUserById } from "@/lib/auth-server";

const workspaceStore = () => (useDatabase() ? workspaceDb : workspaceJson);

export const listKidsAssignments = (options?: Parameters<typeof workspaceJson.listKidsAssignments>[0]) =>
  workspaceStore().listKidsAssignments(options);
export const saveKidsAssignment = (assignment: Parameters<typeof workspaceJson.saveKidsAssignment>[0]) =>
  workspaceStore().saveKidsAssignment(assignment);
export const deleteKidsAssignment = (id: string) => workspaceStore().deleteKidsAssignment(id);
export const listKidsVolunteerProfiles = () => workspaceStore().listKidsVolunteerProfiles();
export const saveKidsVolunteerProfile = (profile: Parameters<typeof workspaceJson.saveKidsVolunteerProfile>[0]) =>
  workspaceStore().saveKidsVolunteerProfile(profile);
export const listKidsLessonCompletions = (
  options?: Parameters<typeof workspaceJson.listKidsLessonCompletions>[0],
) => workspaceStore().listKidsLessonCompletions(options);
export const saveKidsLessonCompletion = (
  completion: Parameters<typeof workspaceJson.saveKidsLessonCompletion>[0],
) => workspaceStore().saveKidsLessonCompletion(completion);
export const listKidsAnnouncements = (limit?: number) => workspaceStore().listKidsAnnouncements(limit);
export const saveKidsAnnouncement = (announcement: Parameters<typeof workspaceJson.saveKidsAnnouncement>[0]) =>
  workspaceStore().saveKidsAnnouncement(announcement);

export async function searchRegisteredChildren(prefix: string, limit = 25): Promise<KidsChildSearchResult[]> {
  const query = prefix.trim().toLowerCase();
  if (query.length < 1) return [];

  if (!useDatabase()) return [];

  const members = await prisma.familyMember.findMany({
    where: {
      relationship: { equals: "child", mode: "insensitive" },
      name: { startsWith: prefix.trim(), mode: "insensitive" },
    },
    take: limit,
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      birthYear: true,
      allergies: true,
      medicalNotes: true,
      authorizedPickup: true,
      userId: true,
      user: { select: { name: true, displayName: true } },
    },
  });

  const results: KidsChildSearchResult[] = [];
  for (const member of members) {
    const parentName = member.user.displayName || member.user.name;
    let authorizedPickup: KidsChildSearchResult["authorizedPickup"];
    if (Array.isArray(member.authorizedPickup)) {
      authorizedPickup = member.authorizedPickup as KidsChildSearchResult["authorizedPickup"];
    }
    results.push({
      familyMemberId: member.id,
      childName: member.name,
      parentUserId: member.userId,
      parentName,
      birthYear: member.birthYear ?? undefined,
      allergies: member.allergies ?? undefined,
      medicalNotes: member.medicalNotes ?? undefined,
      authorizedPickup,
      suggestedAgeGroup: suggestAgeGroupFromBirthYear(member.birthYear ?? undefined),
    });
  }
  return results;
}

export function findTodayAssignments(
  assignments: KidsTeacherAssignment[],
  userId: string,
  serviceDate: string,
  service: string,
) {
  return assignments.filter(
    (row) => row.userId === userId && row.serviceDate === serviceDate && row.service === service,
  );
}

export async function buildKidsLeaderSnapshot(options: {
  checkins: KidCheckIn[];
  service: string;
  serviceDate: string;
  weekStarting: string;
}): Promise<KidsLeaderSnapshot> {
  const active = filterActiveCheckIns(options.checkins, { service: options.service });
  const headcount = buildHeadcount(active);
  const assignments = await listKidsAssignments({ serviceDate: options.serviceDate, service: options.service });
  const upcoming = await listKidsAssignments();
  const futureAssignments = upcoming
    .filter((row) => row.serviceDate >= options.serviceDate)
    .slice(0, 12);

  const lessons = await listKidsLessons({ weekStarting: options.weekStarting });
  const published = lessons.filter((lesson) => lesson.status === "published");
  const incidents = await listKidsIncidents({ service: options.service, limit: 50 });
  const volunteers = await listKidsVolunteerProfiles();

  const roomsWithKids = new Set(headcount.filter((room) => room.count > 0).map((room) => room.ageGroup));
  const roomsWithTeachers = new Set(assignments.map((row) => row.ageGroup));
  const uncoveredRooms = KIDS_AGE_GROUPS.filter(
    (group) => roomsWithKids.has(group) && !roomsWithTeachers.has(group),
  );

  const attentionItems: string[] = [];
  if (uncoveredRooms.length) {
    attentionItems.push(`Classrooms missing teacher coverage: ${uncoveredRooms.join(", ")}`);
  }
  const pending = assignments.filter((row) => row.status === "pending" || row.status === "needs_replacement");
  if (pending.length) {
    attentionItems.push(`${pending.length} teaching assignment(s) need confirmation or coverage`);
  }
  const urgent = incidents.filter((entry) => entry.severity === "urgent" && !entry.parentNotified);
  if (urgent.length) {
    attentionItems.push(`${urgent.length} urgent incident(s) may need parent follow-up`);
  }

  return {
    totalChildrenCheckedIn: active.length,
    headcount,
    assignmentsToday: assignments.length,
    unconfirmedAssignments: pending.length,
    uncoveredRooms,
    publishedLessonsThisWeek: published.length,
    openIncidents: incidents.length,
    volunteersOnboarded: volunteers.filter((v) => v.onboardingComplete).length,
    volunteersNeedingSafeguarding: volunteers.filter((v) => !v.safeguardingCompletedAt).length,
    upcomingAssignments: futureAssignments,
    attentionItems,
  };
}

export async function resolveVolunteerName(userId: string, fallback = "Team member") {
  const user = await getUserById(userId);
  return user?.name ?? fallback;
}

export function pickLessonForRoom(lessons: KidsLesson[], ageGroup: string, userId?: string) {
  const published = lessons.filter(
    (lesson) => lesson.ageGroup === ageGroup && lesson.status === "published",
  );
  if (!published.length) return null;
  const assigned = published.find((lesson) => lesson.assignedToUserId === userId);
  return assigned ?? published[0];
}

export { getServiceDateLabel };