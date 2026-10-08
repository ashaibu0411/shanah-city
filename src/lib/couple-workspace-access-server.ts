import type { PublicMember } from "@/lib/auth-types";
import type { CoupleLinkRecord } from "@/lib/couple-link-types";
import { getActiveCoupleLinkForUserId, getCoupleLinkById } from "@/lib/couple-link-server";
import { partnerIdFromLink } from "@/lib/couple-link-utils";

/**
 * Private marriage workspace — only the two linked spouses.
 * Site admins and marriage leaders must NOT use these helpers for access.
 */
export function userInActiveCoupleLink(userId: string, link: CoupleLinkRecord) {
  if (link.status !== "active") return false;
  return link.userAId === userId || link.userBId === userId;
}

export async function assertActiveCoupleWorkspace(user: PublicMember): Promise<CoupleLinkRecord> {
  const link = await getActiveCoupleLinkForUserId(user.id);
  if (!link) {
    throw new Error("Link your spouse account to open your private marriage space.");
  }
  if (!userInActiveCoupleLink(user.id, link)) {
    throw new Error("You do not have access to this marriage workspace.");
  }
  return link;
}

export async function assertCoupleWorkspaceByLinkId(
  user: PublicMember,
  coupleLinkId: string,
): Promise<CoupleLinkRecord> {
  const link = await getCoupleLinkById(coupleLinkId);
  if (!link) {
    throw new Error("Marriage workspace not found.");
  }
  if (!userInActiveCoupleLink(user.id, link)) {
    throw new Error("You do not have access to this marriage workspace.");
  }
  return link;
}

export async function getPartnerIdForActiveLink(userId: string) {
  const link = await getActiveCoupleLinkForUserId(userId);
  if (!link) return null;
  return partnerIdFromLink(link, userId);
}
