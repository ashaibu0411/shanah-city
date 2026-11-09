import { after } from "next/server";
import type { PublicMember } from "@/lib/auth-types";
import { redactUserIdForLogs } from "@/lib/giving-privacy-redact";
import { scheduleVerifiedStripeGiftsForMember } from "@/lib/giving-stripe-member-sync";

const HISTORY_AFTER_STRIPE_SYNC_BOUND_MS = 14_000;

/** Post-response Stripe recovery for profile history loads — never blocks JSON. */
export function afterHistoryVerifiedStripeMemberSync(
  member: Pick<PublicMember, "id" | "email" | "name" | "campusId">,
) {
  after(async () => {
    try {
      await Promise.race([
        scheduleVerifiedStripeGiftsForMember(member, "history"),
        new Promise<never>((_, reject) => {
          setTimeout(
            () => reject(new Error("history_after_stripe_sync_bound")),
            HISTORY_AFTER_STRIPE_SYNC_BOUND_MS,
          );
        }),
      ]);
    } catch (error) {
      console.warn("[giving-stripe-member-sync after-history]", {
        member: redactUserIdForLogs(member.id),
        error: error instanceof Error ? error.message.slice(0, 120) : "unknown",
      });
    }
  });
}
