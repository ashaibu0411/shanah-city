import type { PublicMember } from "@/lib/auth-types";
import { normalizeGivingEmail } from "@/lib/giving-types";
import { linkGivingRecordsToUser, listGivingRecords } from "@/lib/giving-server";
import { mergeMemberVisibleGivingRecords } from "@/lib/giving-member-merge";
import { syncVerifiedStripeGiftsForMember } from "@/lib/giving-stripe-member-sync";

/**
 * Member-visible giving history: link guest gifts by verified email, then return
 * records owned by this user (never another member's userId).
 */
export async function listGivingRecordsForMember(
  member: Pick<PublicMember, "id" | "email" | "name" | "campusId">,
) {
  await linkGivingRecordsToUser(member.email, member.id);
  await syncVerifiedStripeGiftsForMember(member);

  const byUserId = await listGivingRecords({ userId: member.id });
  const email = normalizeGivingEmail(member.email);
  const byEmail = email ? await listGivingRecords({ donorEmail: email }) : [];

  return mergeMemberVisibleGivingRecords(member.id, byUserId, byEmail);
}
