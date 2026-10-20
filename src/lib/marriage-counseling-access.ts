import { canManageAsAdmin } from "@/lib/admin-access-server";
import type { PublicMember } from "@/lib/auth-types";
import { getPastoralRoleAssignments } from "@/lib/pastoral-roles-server";
import { pastoralRoleForUser } from "@/lib/pastoral-roles-types";
import { getCoupleLinkById } from "@/lib/couple-link-server";
import { resolveJourneyPartnerId, viewerIsJourneyParticipant } from "@/lib/marriage-counseling-participants";
import type { MarriageCounselingJourneyRecord } from "@/lib/marriage-counseling-types";

function counselorIdsFromEnv(): Set<string> {
  const raw = process.env.MARRIAGE_COUNSELOR_USER_IDS ?? "";
  return new Set(
    raw
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean),
  );
}

function curriculumAdminIdsFromEnv(): Set<string> {
  const raw = process.env.MARRIAGE_CURRICULUM_ADMIN_USER_IDS ?? "";
  return new Set(
    raw
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean),
  );
}

export async function isMarriageCounselor(user: PublicMember): Promise<boolean> {
  if (counselorIdsFromEnv().has(user.id)) return true;
  if (await canManageAsAdmin(user)) return true;
  const assignments = await getPastoralRoleAssignments();
  const role = pastoralRoleForUser(user.id, assignments);
  return role === "senior_pastor" || role === "associate_pastor";
}

export async function isMarriageCurriculumAdmin(user: PublicMember): Promise<boolean> {
  if (curriculumAdminIdsFromEnv().has(user.id)) return true;
  if (await canManageAsAdmin(user)) return true;
  return isMarriageCounselor(user);
}

export async function assertJourneyParticipant(
  journey: MarriageCounselingJourneyRecord,
  userId: string,
): Promise<{ partnerId: string }> {
  if (!(await viewerIsJourneyParticipant(journey, userId))) {
    throw new Error("You are not part of this journey.");
  }
  const partnerId = await resolveJourneyPartnerId(journey, userId);
  if (!partnerId) {
    throw new Error("Your partner has not joined this journey yet.");
  }
  return { partnerId };
}

export async function assertJourneyParticipantLoose(
  journey: MarriageCounselingJourneyRecord,
  userId: string,
) {
  if (!(await viewerIsJourneyParticipant(journey, userId))) {
    throw new Error("You are not part of this journey.");
  }
}

export function isJourneyCounselorAccessRevoked(journey: MarriageCounselingJourneyRecord): boolean {
  return Boolean(journey.counselorAccessRevokedAt?.trim());
}

/** Authenticated marriage counselor / pastoral role (not assignment-specific). */
export async function assertMarriageCounselorRole(user: PublicMember): Promise<void> {
  if (!(await isMarriageCounselor(user))) {
    throw new Error("Counselor access required.");
  }
}

export function viewerIsAssignedClinicalCounselor(
  viewerId: string,
  journey: MarriageCounselingJourneyRecord,
): boolean {
  if (isJourneyCounselorAccessRevoked(journey)) return false;
  if (!journey.counselorUserId?.trim()) return false;
  return journey.counselorUserId === viewerId;
}

/**
 * Clinical access: assigned counselor only. Pastor/admin role does not bypass assignment.
 */
export async function assertClinicalCounselorForJourney(
  user: PublicMember,
  journey: MarriageCounselingJourneyRecord,
): Promise<void> {
  await assertMarriageCounselorRole(user);
  if (isJourneyCounselorAccessRevoked(journey)) {
    throw new Error("Counselor access has been revoked for this journey.");
  }
  if (!viewerIsAssignedClinicalCounselor(user.id, journey)) {
    throw new Error("Access denied.");
  }
}

/** Administrative roster/progress view for pastoral oversight (no clinical payload). */
export async function assertAdministrativeCounselorOverviewAccess(
  user: PublicMember,
  journey: MarriageCounselingJourneyRecord,
): Promise<void> {
  await assertMarriageCounselorRole(user);
}

export async function viewerHasClinicalCounselorAccess(
  user: PublicMember,
  journey: MarriageCounselingJourneyRecord,
): Promise<boolean> {
  if (!(await isMarriageCounselor(user))) return false;
  return viewerIsAssignedClinicalCounselor(user.id, journey);
}

/** @deprecated Use assertClinicalCounselorForJourney for confidential data; overview uses administrative helpers. */
export async function assertCounselorForJourney(
  user: PublicMember,
  journey: MarriageCounselingJourneyRecord,
) {
  await assertClinicalCounselorForJourney(user, journey);
}

export async function counselorCanViewJourney(
  user: PublicMember,
  journey: MarriageCounselingJourneyRecord,
) {
  await assertClinicalCounselorForJourney(user, journey);
  return true;
}
