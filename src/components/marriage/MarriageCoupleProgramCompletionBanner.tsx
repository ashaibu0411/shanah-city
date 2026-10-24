"use client";

import type { MarriageHubSummary } from "@/lib/marriage-counseling-types";
import { marriagePremium } from "@/components/marriage/marriage-counseling-premium";

type Props = {
  hub: MarriageHubSummary;
};

export function MarriageCoupleProgramCompletionBanner({ hub }: Props) {
  const program = hub.premaritalProgram;
  const gallery = hub.certificatesGallery;
  if (!program) return null;

  const allSessionsDone = program.sessionsCompleted >= program.sessionsTotal;
  const finalIssued = gallery?.finalCertificate.status === "issued";
  const finalPending = gallery?.finalCertificate.status === "eligible_pending_issue";

  if (!allSessionsDone && hub.journey?.status !== "completed") return null;

  return (
    <section
      className={`${marriagePremium.card} mt-6 border border-emerald-200 bg-emerald-50/70 dark:border-emerald-900/40 dark:bg-emerald-950/25`}
      aria-labelledby="marriage-prep-completion-heading"
    >
      <h2 id="marriage-prep-completion-heading" className="font-display text-lg font-semibold text-emerald-950 dark:text-emerald-100">
        {allSessionsDone ? "Eight-session program complete" : "Journey milestone"}
      </h2>
      <p className={`${marriagePremium.cardMuted} mt-2 text-sm`}>
        You finished the structured eight-session Marriage Prep track with your counselor. Completing sessions and
        homework does not automatically mean pastoral approval to marry — your Senior Pastor issues formal readiness
        and completion certificates separately.
      </p>
      {finalIssued ? (
        <p className="mt-3 text-sm font-semibold text-emerald-900 dark:text-emerald-100">
          Your completion certificate has been issued. Download it from the certificates section below when you are
          ready.
        </p>
      ) : finalPending ? (
        <p className="mt-3 text-sm text-emerald-900 dark:text-emerald-100">
          Your counselor has marked the program complete. Your Senior Pastor will review and issue the final
          certificate when ready — you will receive an update in Marriage Prep.
        </p>
      ) : (
        <p className="mt-3 text-sm text-emerald-900 dark:text-emerald-100">
          Your counselor or Senior Pastor may still have pastoral review steps. Watch this hub for certificate and
          appointment updates.
        </p>
      )}
    </section>
  );
}
