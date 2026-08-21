import type { PublicMember } from "@/lib/auth-types";
import { canAccessFinance } from "@/lib/finance-access-server";

/** Admin Group and Finance Team can record per-person gifts and send thank-yous. */
export async function canManageGivingRecords(user: Pick<PublicMember, "id"> | null) {
  return canAccessFinance(user);
}
