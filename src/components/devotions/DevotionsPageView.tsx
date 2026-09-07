"use client";

import { useAppShell } from "@/components/app/AppShellContext";
import {
  MobileDevotionArchiveTile,
  MobileDevotionFeaturedHero,
  MobileDevotionsPageHeader,
} from "@/components/devotions/MobileDevotionsHub";
import { DevotionsFeed } from "@/components/devotions/DevotionsFeed";
import { PageHeader } from "@/components/ui";
import { pickTodayDevotion } from "@/lib/devotion-utils";
import type { Devotion } from "@/lib/types";

type DevotionsPageViewProps = {
  devotions: Devotion[];
};

export function DevotionsPageView({ devotions }: DevotionsPageViewProps) {
  const { isMobileApp } = useAppShell();
  const featured = pickTodayDevotion(devotions);
  const archive = featured
    ? devotions.filter((devotion) => devotion.id !== featured.id)
    : devotions;

  if (isMobileApp) {
    return (
      <div className="mobile-devotions-page space-y-4">
        <MobileDevotionsPageHeader />

        {featured ? <MobileDevotionFeaturedHero devotion={featured} /> : null}

        {archive.length > 0 ? (
          <section>
            <h2 className="mobile-section-title mb-2.5 px-0.5">Library</h2>
            <div className="space-y-3">
              {archive.map((devotion, index) => (
                <MobileDevotionArchiveTile
                  key={devotion.id}
                  devotion={devotion}
                  index={index}
                />
              ))}
            </div>
          </section>
        ) : featured ? null : (
          <p className="mobile-card mobile-premium-surface p-4 text-sm text-night-600">
            No published devotion yet. Check back soon.
          </p>
        )}
      </div>
    );
  }

  return (
    <>
      <PageHeader
        eyebrow="Daily"
        title="Devotions"
        description="Browse past devotions by title. Tap any message to read or listen in full."
      />
      {devotions.length === 0 ? (
        <p className="rounded-2xl bg-white p-5 text-sm text-night-600 ring-1 ring-night-900/5">
          No published devotion yet. Check back soon.
        </p>
      ) : (
        <DevotionsFeed devotions={devotions} />
      )}
    </>
  );
}
