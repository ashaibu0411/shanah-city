"use client";

import Link from "next/link";
import { CommunityStatusRow } from "@/components/community/CommunityStatusRow";
import { MobilePremiumFrame } from "@/components/app/MobilePremiumFrame";

export function HomeStoriesSection() {
  return (
    <MobilePremiumFrame variant="surface" className="overflow-hidden ring-1 ring-night-900/8">
      <div className="border-b border-night-900/8 px-4 py-2.5 dark:border-white/10">
        <div className="flex items-center justify-between gap-2">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-night-500 dark:text-sand-400">
              Your people
            </p>
            <p className="mt-0.5 font-display text-base font-semibold text-night-900 dark:text-sand-100">
              Moments
            </p>
          </div>
          <Link
            href="/community"
            className="text-xs font-semibold text-clay-700 hover:underline dark:text-clay-300"
          >
            Community →
          </Link>
        </div>
        <p className="mt-1 text-xs text-night-600 dark:text-sand-300/90">
          Whole church family · your groups show first · vanishes in 24 hours
        </p>
      </div>
      <div className="px-1 pb-2 pt-1">
        <CommunityStatusRow variant="home" />
      </div>
    </MobilePremiumFrame>
  );
}
