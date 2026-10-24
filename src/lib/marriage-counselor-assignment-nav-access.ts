import type { PublicMember } from "@/lib/auth-types";
import { canSubmitCounselorAssignmentRequest } from "@/lib/marriage-counselor-assignment-authority";

/** Sidebar / More menu / admin portal — mirrors counselor assignment workspace access. */
export async function canAccessMarriageCounselorAssignmentsNav(
  user: PublicMember,
): Promise<boolean> {
  return canSubmitCounselorAssignmentRequest(user);
}
