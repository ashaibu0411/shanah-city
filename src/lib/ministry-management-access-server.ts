import type { PublicMember } from "@/lib/auth-types";
import { canManageAsAdmin } from "@/lib/admin-access-server";
import { userHasPastoralMinistryRole } from "@/lib/pastoral-roles-server";

/** Admin Group, Senior Pastor, or Associate Pastor — not the general Pastors group. */
export async function canManageMinistry(user: Pick<PublicMember, "id"> | null) {
  if (!user) return false;
  if (await canManageAsAdmin(user)) return true;
  return userHasPastoralMinistryRole(user.id);
}

export async function getMinistryManagementPermissions(user: Pick<PublicMember, "id"> | null) {
  const allowed = await canManageMinistry(user);
  return {
    canManageMinistry: allowed,
    canReviewMinistryReports: allowed,
  };
}
