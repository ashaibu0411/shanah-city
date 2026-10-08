import type { PublicMember } from "@/lib/auth-types";
import { canManageAsAdmin } from "@/lib/admin-access-server";
import { getCoupleLinkStatus } from "@/lib/couple-link-server";
import { isPowerCouplesMember } from "@/lib/couple-prayer-access-server";
import { SHANAH_POWER_COUPLES_GROUP_ID } from "@/lib/church-groups";
import { getGroups } from "@/lib/group-server";
import { isGroupLeaderOrAssistant } from "@/lib/group-admin-utils";
import type { CouplesHubOverview } from "@/lib/couples-hub-types";

export async function getCouplesHubOverview(user: PublicMember): Promise<CouplesHubOverview> {
  const [status, powerCouples, groups] = await Promise.all([
    getCoupleLinkStatus(user),
    isPowerCouplesMember(user.id),
    getGroups(),
  ]);

  const group = groups.find((entry) => entry.id === SHANAH_POWER_COUPLES_GROUP_ID);
  const canManageMarriageMinistry =
    (group ? isGroupLeaderOrAssistant(group, user.id) : false) ||
    (await canManageAsAdmin(user));

  return {
    hasActiveLink: status.link?.status === "active",
    partnerName: status.link?.status === "active" ? status.link.partnerName : undefined,
    anniversaryDate: status.link?.anniversaryDate,
    isPowerCouplesMember: powerCouples,
    pendingIncomingInvite: Boolean(status.pendingIncoming),
    canManageMarriageMinistry,
  };
}
