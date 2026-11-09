import type { PublicMember } from "@/lib/auth-types";
import { normalizeGivingEmail } from "@/lib/giving-types";
import { linkGivingRecordsToUser, listGivingRecords } from "@/lib/giving-server";
import { mergeMemberVisibleGivingRecords } from "@/lib/giving-member-merge";
import {
  scheduleVerifiedStripeGiftsForMember,
  type MemberStripeSyncResult,
} from "@/lib/giving-stripe-member-sync";

export type MemberGivingHistoryLoad = {
  records: Awaited<ReturnType<typeof mergeMemberVisibleGivingRecords>>;
  stripeSync: MemberStripeSyncResult;
};

/**
 * Member-visible giving history: link guest gifts by verified email, then return
 * records owned by this user (never another member's userId). Stripe sync failures
 * never prevent returning existing DB records.
 */
export async function listGivingRecordsForMember(
  member: Pick<PublicMember, "id" | "email" | "name" | "campusId">,
): Promise<MemberGivingHistoryLoad> {
  await linkGivingRecordsToUser(member.email, member.id).catch(() => {
    /* email link is best-effort; DB rows still load */
  });

  let stripeSync: MemberStripeSyncResult = {
    recorded: 0,
    linked: 0,
    flagged: 0,
    skipped: 0,
    status: "noop",
  };
  try {
    stripeSync = await scheduleVerifiedStripeGiftsForMember(member, "history");
  } catch {
    stripeSync = { recorded: 0, linked: 0, flagged: 0, skipped: 0, status: "stripe_error" };
  }

  const byUserId = await listGivingRecords({ userId: member.id });
  const email = normalizeGivingEmail(member.email);
  const byEmail = email ? await listGivingRecords({ donorEmail: email }) : [];

  return {
    records: mergeMemberVisibleGivingRecords(member.id, byUserId, byEmail),
    stripeSync,
  };
}
