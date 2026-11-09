import type { PublicMember } from "@/lib/auth-types";
import { normalizeGivingEmail } from "@/lib/giving-types";
import { linkGivingRecordsToUser, listGivingRecords } from "@/lib/giving-server";
import { mergeMemberVisibleGivingRecords } from "@/lib/giving-member-merge";
import { loadLatestMemberStripeSyncReport } from "@/lib/giving-stripe-member-sync";
import type { MemberStripeSyncReport } from "@/lib/giving-stripe-member-sync-report";

export type MemberGivingHistoryLoad = {
  records: Awaited<ReturnType<typeof mergeMemberVisibleGivingRecords>>;
  lastStripeSync: {
    status: string;
    trigger: string;
    recorded: number;
    linked: number;
    flagged: number;
    skipped: number;
    finishedAt: string | null;
    report: MemberStripeSyncReport | null;
  } | null;
};

/**
 * DB-first member history. Stripe recovery runs outside the request (after auth/history).
 */
export async function listGivingRecordsForMember(
  member: Pick<PublicMember, "id" | "email" | "name" | "campusId">,
): Promise<MemberGivingHistoryLoad> {
  await linkGivingRecordsToUser(member.email, member.id).catch(() => {
    /* email link is best-effort */
  });

  const byUserId = await listGivingRecords({ userId: member.id });
  const email = normalizeGivingEmail(member.email);
  const byEmail = email ? await listGivingRecords({ donorEmail: email }) : [];

  const lastRun = await loadLatestMemberStripeSyncReport(member.id);
  const lastStripeSync = lastRun
    ? {
        status: lastRun.status,
        trigger: lastRun.trigger,
        recorded: lastRun.recorded,
        linked: lastRun.linked,
        flagged: lastRun.flagged,
        skipped: lastRun.skipped,
        finishedAt: lastRun.finishedAt?.toISOString() ?? null,
        report: (lastRun.metrics as MemberStripeSyncReport | null) ?? null,
      }
    : null;

  return {
    records: mergeMemberVisibleGivingRecords(member.id, byUserId, byEmail),
    lastStripeSync,
  };
}
