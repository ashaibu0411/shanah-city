export type PastoralRole = "senior_pastor" | "associate_pastor";

export type PastoralRoleAssignments = {
  seniorPastorUserId: string | null;
  associatePastorUserId: string | null;
  updatedAt?: string;
  updatedBy?: string;
  updatedByName?: string;
};

export type PastoralRoleAssignmentView = {
  role: PastoralRole;
  label: string;
  userId: string | null;
  userName: string | null;
};

export const PASTORAL_ROLE_LABELS: Record<PastoralRole, string> = {
  senior_pastor: "Senior Pastor",
  associate_pastor: "Associate Pastor",
};

export const PASTORAL_ROLES: PastoralRole[] = ["senior_pastor", "associate_pastor"];

export function pastoralRoleForUser(
  userId: string,
  assignments: Pick<PastoralRoleAssignments, "seniorPastorUserId" | "associatePastorUserId">,
): PastoralRole | null {
  if (assignments.seniorPastorUserId === userId) return "senior_pastor";
  if (assignments.associatePastorUserId === userId) return "associate_pastor";
  return null;
}

export function userIdForPastoralRole(
  role: PastoralRole,
  assignments: PastoralRoleAssignments,
): string | null {
  return role === "senior_pastor"
    ? assignments.seniorPastorUserId
    : assignments.associatePastorUserId;
}
