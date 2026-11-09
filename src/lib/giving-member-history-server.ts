import { normalizeGivingEmail } from "@/lib/giving-types";
import { linkGivingRecordsToUser, listGivingRecords } from "@/lib/giving-server";
import { mergeMemberVisibleGivingRecords } from "@/lib/giving-member-merge";

/**
 * Member-visible giving history: link guest gifts by verified email, then return
 * records owned by this user (never another member's userId).
 */
export async function listGivingRecordsForMember(member: { id: string; email: string }) {
  await linkGivingRecordsToUser(member.email, member.id);

  const byUserId = await listGivingRecords({ userId: member.id });
  const email = normalizeGivingEmail(member.email);
  const byEmail = email ? await listGivingRecords({ donorEmail: email }) : [];

  return mergeMemberVisibleGivingRecords(member.id, byUserId, byEmail);
}
