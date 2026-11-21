import type { PublicMember } from "@/lib/auth-types";
import type { FamilyMember } from "@/lib/auth-types";
import type { KidCheckIn } from "@/lib/member-types";
import type { KidsRosterEntry } from "@/lib/kids-types";
import { KIDS_AGE_GROUPS, KIDS_SERVICES } from "@/lib/kids-types";
import {
  canManageKidsMinistry,
  getConfiguredKidsGroupId,
  userIsInKidsMinistryGroup,
} from "@/lib/kids-access-server";
import { getUserById } from "@/lib/auth-server";
import { memberHasFullGroupAccess } from "@/lib/ministry-readiness-server";
import { prisma } from "@/lib/db";
import { useDatabase } from "@/lib/use-database";
import { getKidCheckIns, verifyCheckoutKid } from "@/lib/member-server";
import { listKidsAssignments, listKidsVolunteerProfiles } from "@/lib/kids-workspace-server";
import type {
  KidsAnnouncement,
  KidsTeacherAssignment,
  KidsTeacherRole,
  KidsVolunteerProfile,
} from "@/lib/kids-workspace-types";

export type KidsMinistryScope = {
  canManage: boolean;
  service: string;
  serviceDate: string;
  /** Classrooms with a confirmed assignment for this service date. */
  confirmedAgeGroups: string[];
  canCheckIn: boolean;
  myAssignments: KidsTeacherAssignment[];
};

export function kidsWorkspaceStorageReady() {
  return Boolean(useDatabase());
}

export function kidsWorkspaceStorageError() {
  return "Kids Ministry workspace records require a configured database. Contact your ministry leader.";
}

export async function resolveKidsMinistryScope(
  user: PublicMember,
  service: string,
  serviceDate: string,
): Promise<KidsMinistryScope> {
  const canManage = await canManageKidsMinistry(user);
  const myAssignments = canManage
    ? []
    : await listKidsAssignments({ serviceDate, service, userId: user.id });
  const confirmedAgeGroups = canManage
    ? [...KIDS_AGE_GROUPS]
    : [
        ...new Set(
          myAssignments.filter((row) => row.status === "confirmed").map((row) => row.ageGroup),
        ),
      ];
  return {
    canManage,
    service,
    serviceDate,
    confirmedAgeGroups,
    canCheckIn: canManage || myAssignments.some((row) => row.status === "confirmed"),
    myAssignments,
  };
}

export function isAllowedAgeGroup(scope: KidsMinistryScope, ageGroup: string) {
  return scope.canManage || scope.confirmedAgeGroups.includes(ageGroup);
}

export function hasConfirmedAssignmentForAgeGroup(scope: KidsMinistryScope, ageGroup: string) {
  if (scope.canManage) return true;
  return scope.myAssignments.some(
    (row) => row.status === "confirmed" && row.ageGroup === ageGroup,
  );
}

export async function canViewSensitiveChildData(
  userId: string,
  scope: KidsMinistryScope,
  ageGroup: string,
) {
  if (scope.canManage) return true;
  if (!scope.confirmedAgeGroups.includes(ageGroup)) return false;
  const profile = await getKidsVolunteerProfile(userId);
  return Boolean(profile?.safeguardingLeaderVerifiedAt);
}

export function assertAllowedService(service: string) {
  if (!KIDS_SERVICES.some((item) => item === service)) {
    throw new Error("Invalid service.");
  }
}

export function assertAllowedAgeGroupValue(ageGroup: string) {
  if (!KIDS_AGE_GROUPS.some((group) => group === ageGroup)) {
    throw new Error("Invalid classroom.");
  }
}

export function sanitizeRosterEntry(entry: KidsRosterEntry, allowSensitive: boolean): KidsRosterEntry {
  if (allowSensitive) return entry;
  return {
    ...entry,
    medicalNotes: entry.hasMedicalAlert ? "Medical alert on file — see room lead." : undefined,
    allergies: entry.hasAllergyAlert ? "Allergy alert on file — see room lead." : undefined,
    authorizedPickup: entry.authorizedPickup?.map((contact) => ({
      name: contact.name,
      relationship: contact.relationship,
    })),
  };
}

export function filterRosterByScope(entries: KidsRosterEntry[], scope: KidsMinistryScope) {
  if (scope.canManage) return entries;
  return entries.filter((entry) => scope.confirmedAgeGroups.includes(entry.ageGroup));
}

export function filterAnnouncementsForUser(
  announcements: KidsAnnouncement[],
  canManage: boolean,
) {
  return announcements.filter((item) => canManage || item.audience !== "leaders_only");
}

export async function getKidsVolunteerProfile(userId: string): Promise<KidsVolunteerProfile | null> {
  if (!kidsWorkspaceStorageReady()) return null;
  const profiles = await listKidsVolunteerProfiles();
  return profiles.find((row) => row.userId === userId) ?? null;
}

export async function volunteerEligibleForAssignment(userId: string, role: KidsTeacherRole) {
  if (!(await userIsInKidsMinistryGroup(userId))) return false;
  const profile = await getKidsVolunteerProfile(userId);
  return Boolean(profile?.safeguardingLeaderVerifiedAt);
}

export async function verifyRegisteredChildForCheckIn(parentUserId: string, familyMemberId: string) {
  if (!familyMemberId || !parentUserId) return null;
  const parent = await getUserById(parentUserId);
  if (!parent || parent.id !== parentUserId) return null;
  const child = parent.family.find(
    (member) => member.id === familyMemberId && member.relationship === "child",
  );
  if (!child) return null;
  return { parent, child };
}

export function buildRegisteredCheckInPayload(params: {
  parent: Pick<PublicMember, "id" | "name">;
  child: FamilyMember;
  ageGroup: string;
  service: string;
  notes?: string;
  securityCode: string;
}) {
  return {
    parentName: params.parent.name,
    parentUserId: params.parent.id,
    familyMemberId: params.child.id,
    childName: params.child.name,
    ageGroup: params.ageGroup,
    service: params.service,
    notes: params.notes,
    allergies: params.child.allergies,
    medicalNotes: params.child.medicalNotes,
    authorizedPickup: params.child.authorizedPickup,
    securityCode: params.securityCode,
    checkedInAt: new Date().toISOString(),
  };
}

export async function assertActiveCheckInScope(
  user: PublicMember,
  entry: KidCheckIn,
  scope: KidsMinistryScope,
) {
  if (!isAllowedAgeGroup(scope, entry.ageGroup)) {
    throw new Error("Not authorized for this classroom.");
  }
  if (scope.canManage) return;
  if (!hasConfirmedAssignmentForAgeGroup(scope, entry.ageGroup)) {
    throw new Error("Confirmed assignment required for this classroom.");
  }
}

export type AuthorizedCheckoutResult =
  | { ok: true; checkin: KidCheckIn }
  | { ok: false; status: number; error: string };

/**
 * Authorize pickup staff, validate security code, then mutate check-out (never the reverse).
 */
type KidCheckoutDeps = {
  getKidCheckIns: typeof getKidCheckIns;
  verifyCheckoutKid: typeof verifyCheckoutKid;
};

export async function executeAuthorizedKidCheckout(
  id: string,
  securityCode: string,
  checkedOutBy: string,
  user: PublicMember,
  scope: KidsMinistryScope,
  deps: KidCheckoutDeps = { getKidCheckIns, verifyCheckoutKid },
): Promise<AuthorizedCheckoutResult> {
  const active = (await deps.getKidCheckIns()).find((entry) => entry.id === id && !entry.checkedOutAt);
  if (!active) {
    return { ok: false, status: 404, error: "Check-in not found or already checked out." };
  }
  try {
    await assertActiveCheckInScope(user, active, scope);
  } catch (e) {
    return {
      ok: false,
      status: 403,
      error: e instanceof Error ? e.message : "Not authorized.",
    };
  }
  if (active.securityCode.trim() !== securityCode.trim()) {
    return { ok: false, status: 403, error: "Security code does not match." };
  }
  const result = await deps.verifyCheckoutKid(id, { securityCode, checkedOutBy });
  if (!result) {
    return { ok: false, status: 404, error: "Check-in not found or already checked out." };
  }
  if ("error" in result) {
    return { ok: false, status: 403, error: "Security code does not match." };
  }
  return { ok: true, checkin: result.checkin };
}

export function resolveIncidentFromCheckIn(
  checkIn: KidCheckIn,
  fallback: { childName?: string; ageGroup?: string; service?: string; parentUserId?: string },
) {
  return {
    checkInId: checkIn.id,
    childName: checkIn.childName,
    ageGroup: checkIn.ageGroup,
    service: checkIn.service,
    parentUserId: checkIn.parentUserId,
    childNameMismatch:
      fallback.childName &&
      fallback.childName.trim().toLowerCase() !== checkIn.childName.trim().toLowerCase(),
  };
}

export async function searchKidsMinistryMembers(query: string, limit = 25) {
  const q = query.trim();
  if (q.length < 2 || !kidsWorkspaceStorageReady()) return [];

  const kidsGroupId = getConfiguredKidsGroupId();
  const users = await prisma.user.findMany({
    where: {
      OR: [
        { name: { contains: q, mode: "insensitive" } },
        { displayName: { contains: q, mode: "insensitive" } },
        { email: { contains: q, mode: "insensitive" } },
      ],
    },
    select: { id: true, name: true, displayName: true, email: true },
    take: 80,
    orderBy: { name: "asc" },
  });

  const eligible: { id: string; name: string; email: string; eligibleTeacher: boolean; eligibleAssistant: boolean }[] = [];
  for (const row of users) {
    const access = await memberHasFullGroupAccess(row.id, kidsGroupId);
    if (!access.allowed) continue;
    const teacherOk = await volunteerEligibleForAssignment(row.id, "teacher");
    const assistantOk = await volunteerEligibleForAssignment(row.id, "assistant");
    if (!teacherOk && !assistantOk) continue;
    eligible.push({
      id: row.id,
      name: row.displayName || row.name,
      email: row.email,
      eligibleTeacher: teacherOk,
      eligibleAssistant: assistantOk,
    });
    if (eligible.length >= limit) break;
  }
  return eligible;
}

export function confirmedLeadCoverageByRoom(assignments: KidsTeacherAssignment[]) {
  const covered = new Set<string>();
  for (const row of assignments) {
    if (row.status !== "confirmed" || row.role !== "teacher") continue;
    covered.add(row.ageGroup);
  }
  return covered;
}