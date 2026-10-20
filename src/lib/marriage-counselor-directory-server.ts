import { getUserById } from "@/lib/auth-server";
import { getPastoralRoleAssignments } from "@/lib/pastoral-roles-server";
import { pastoralRoleForUser } from "@/lib/pastoral-roles-types";

function counselorIdsFromEnv(): Set<string> {
  const raw = process.env.MARRIAGE_COUNSELOR_USER_IDS ?? "";
  return new Set(
    raw
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean),
  );
}

export type EligibleClinicalCounselor = {
  userId: string;
  displayName: string;
};

async function eligibleClinicalCounselorIdSet(): Promise<Set<string>> {
  const ids = new Set<string>(counselorIdsFromEnv());
  const assignments = await getPastoralRoleAssignments();
  if (assignments.seniorPastorUserId?.trim()) ids.add(assignments.seniorPastorUserId.trim());
  if (assignments.associatePastorUserId?.trim()) ids.add(assignments.associatePastorUserId.trim());
  return ids;
}

export async function isEligibleClinicalCounselorUserId(userId: string): Promise<boolean> {
  const ids = await eligibleClinicalCounselorIdSet();
  return ids.has(userId.trim());
}

/** Approved clinical counselors for assignment requests (not the full member directory). */
export async function listEligibleClinicalCounselors(): Promise<EligibleClinicalCounselor[]> {
  const ids = await eligibleClinicalCounselorIdSet();
  const result: EligibleClinicalCounselor[] = [];
  for (const userId of ids) {
    const user = await getUserById(userId);
    result.push({
      userId,
      displayName: user?.name?.trim() || "Counselor",
    });
  }
  result.sort((a, b) => a.displayName.localeCompare(b.displayName));
  return result;
}

export async function assertEligibleClinicalCounselor(counselorUserId: string): Promise<void> {
  if (!(await isEligibleClinicalCounselorUserId(counselorUserId))) {
    throw new Error("Selected counselor is not eligible.");
  }
}
