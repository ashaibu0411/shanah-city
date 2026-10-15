"use client";

import Link from "next/link";
import { marriagePremium } from "@/components/marriage/marriage-counseling-premium";

/** Shown on hub when NEXT_PUBLIC_MARRIAGE_STAGE2 is enabled. */
export function MarriageStage2HubPromo({
  resumeModuleId,
  activitiesCompleted,
  activitiesTotal,
}: {
  resumeModuleId?: string | null;
  activitiesCompleted?: number;
  activitiesTotal?: number;
}) {
  return (
    <div className={`${marriagePremium.card} mt-6 border-l-4 border-clay-500`}>
      <p className="text-xs font-bold uppercase tracking-wide text-clay-800">Stage 2 preview</p>
      <p className="mt-1 font-semibold">Couples learning center</p>
      <p className={`${marriagePremium.cardMuted} text-sm`}>
        Temperament discovery, financial workshop, scenario simulator, shared goals, and counselor-guided activities.
      </p>
      {activitiesTotal != null && activitiesTotal > 0 && (
        <p className="mt-2 text-sm">
          Interactive activities: {activitiesCompleted ?? 0}/{activitiesTotal} submitted
        </p>
      )}
      <div className="mt-3 flex flex-col gap-2 sm:flex-row">
        <Link href="/marriage/learn" className={`${marriagePremium.primaryCta} min-h-[44px] text-center`}>
          Open learning center
        </Link>
        {resumeModuleId && (
          <Link
            href={`/marriage/module/${resumeModuleId}`}
            className={`${marriagePremium.secondaryCta} min-h-[44px] text-center`}
          >
            Resume activity
          </Link>
        )}
      </div>
    </div>
  );
}
