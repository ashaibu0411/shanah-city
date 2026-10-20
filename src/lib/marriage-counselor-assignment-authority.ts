import type { PublicMember } from "@/lib/auth-types";
import { assignmentAdminIdsFromEnv } from "@/lib/marriage-journey-administrative-coordinator-policy";
import { getPastoralRoleAssignments } from "@/lib/pastoral-roles-server";
import { pastoralRoleForUser } from "@/lib/pastoral-roles-types";

export async function isSeniorPastor(user: Pick<PublicMember, "id">): Promise<boolean> {
  const assignments = await getPastoralRoleAssignments();
  return pastoralRoleForUser(user.id, assignments) === "senior_pastor";
}

export async function assertSeniorPastor(user: Pick<PublicMember, "id">): Promise<void> {
  if (!(await isSeniorPastor(user))) {
    throw new Error("Senior Pastor approval required.");
  }
}

/** Option A — explicit allow-list for assignment request submission only. */
export async function assertCanSubmitCounselorAssignmentRequest(
  user: Pick<PublicMember, "id">,
): Promise<void> {
  if (await isSeniorPastor(user)) return;
  if (assignmentAdminIdsFromEnv().has(user.id)) return;
  throw new Error("Not authorized to submit counselor assignment requests.");
}

export async function canSubmitCounselorAssignmentRequest(
  user: Pick<PublicMember, "id">,
): Promise<boolean> {
  try {
    await assertCanSubmitCounselorAssignmentRequest(user);
    return true;
  } catch {
    return false;
  }
}
