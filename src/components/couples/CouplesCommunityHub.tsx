"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/ui";
import { CouplesHubTileGrid } from "@/components/couples/CouplesHubTileGrid";
import { couplesHubPremium } from "@/components/couples/couples-hub-premium";
import { couplesCommunityTiles } from "@/lib/couples-hub-routes";
import type { CouplesHubOverview } from "@/lib/couples-hub-types";
import { SHANAH_POWER_COUPLES_GROUP_ID } from "@/lib/church-groups";

export function CouplesCommunityHub() {
  const [overview, setOverview] = useState<CouplesHubOverview | null>(null);

  useEffect(() => {
    void fetch("/api/couples/hub")
      .then(async (response) => {
        const data = await response.json();
        if (response.ok) setOverview(data.overview ?? null);
      })
      .catch(() => undefined);
  }, []);

  return (
    <div className={couplesHubPremium.page}>
      <div className={couplesHubPremium.inset}>
        <PageHeader variant="flat" eyebrow="Together" title="Couples community" />
        <p className="mt-2 text-sm leading-relaxed text-night-600 dark:text-sand-400">
          Public group spaces for Shanah Power Couples — separate from your private marriage
          dashboard.
        </p>

        {!overview?.isPowerCouplesMember ? (
          <div className={`${couplesHubPremium.gateCard} mt-6`}>
            <p className="font-semibold text-night-900 dark:text-sand-100">Join the group</p>
            <p className="mt-2">
              Community prayer, mentors, and resources are available to Power Couples members.
            </p>
            <Link
              href={`/groups/${encodeURIComponent(SHANAH_POWER_COUPLES_GROUP_ID)}`}
              className={`${couplesHubPremium.primaryCta} mt-4`}
            >
              Shanah Power Couples
            </Link>
          </div>
        ) : null}

        <div className="mt-6">
          <CouplesHubTileGrid tiles={couplesCommunityTiles} />
        </div>

        <Link href="/couples" className={`${couplesHubPremium.secondaryCta} mt-10`}>
          Back to Couples Hub
        </Link>
      </div>
    </div>
  );
}
