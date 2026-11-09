import { after } from "next/server";
import type { PublicMember } from "@/lib/auth-types";
import { redactUserIdForLogs } from "@/lib/giving-privacy-redact";
import { scheduleVerifiedStripeGiftsForMember } from "@/lib/giving-stripe-member-sync";

/** Hard ceiling for sign-in `after()` work (Vercel serverless continuation). */
const AUTH_AFTER_STRIPE_SYNC_BOUND_MS = 14_000;

/**
 * Run verified Stripe member sync after the auth response is sent (Next.js `after` on Vercel).
 * Failures are logged with redacted ids; login is never blocked.
 */
export function afterAuthVerifiedStripeMemberSync(
  member: Pick<PublicMember, "id" | "email" | "name" | "campusId">,
) {
  after(async () => {
    try {
      await Promise.race([
        scheduleVerifiedStripeGiftsForMember(member, "signin"),
        new Promise<never>((_, reject) => {
          setTimeout(() => reject(new Error("auth_after_stripe_sync_bound")), AUTH_AFTER_STRIPE_SYNC_BOUND_MS);
        }),
      ]);
    } catch (error) {
      console.warn("[giving-stripe-member-sync after-auth]", {
        member: redactUserIdForLogs(member.id),
        error: error instanceof Error ? error.message.slice(0, 120) : "unknown",
      });
    }
  });
}
