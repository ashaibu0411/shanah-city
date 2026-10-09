"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { CouplesHubTabRow } from "@/components/couples/CouplesHubTabRow";
import { CouplesHubTileGrid } from "@/components/couples/CouplesHubTileGrid";
import { couplesHubPremium } from "@/components/couples/couples-hub-premium";
import { couplesCommunityTiles } from "@/lib/couples-hub-routes";
import type { CouplesHubOverview } from "@/lib/couples-hub-types";
import { SHANAH_POWER_COUPLES_GROUP_ID } from "@/lib/church-groups";

type CommunityTab = "discussions" | "events" | "resources";

const TAB_TILE_IDS: Record<CommunityTab, string[]> = {
  discussions: ["discussions", "prayer", "announcements"],
  events: ["events", "challenges"],
  resources: ["resources", "devotionals"],
};

export function CouplesCommunityHub() {
  const [overview, setOverview] = useState<CouplesHubOverview | null>(null);
  const [tab, setTab] = useState<CommunityTab>("discussions");

  useEffect(() => {
    void fetch("/api/couples/hub")
      .then(async (response) => {
        const data = await response.json();
        if (response.ok) setOverview(data.overview ?? null);
      })
      .catch(() => undefined);
  }, []);

  const tiles = useMemo(() => {
    const ids = new Set(TAB_TILE_IDS[tab]);
    return couplesCommunityTiles
      .filter((tile) => ids.has(tile.id))
      .map((tile) => ({ ...tile, tone: "community" as const }));
  }, [tab]);

  return (
    <div className={couplesHubPremium.page}>
      <div className={couplesHubPremium.inset}>
        <Link href="/couples" className={couplesHubPremium.backLink}>
          <span aria-hidden>←</span> Couples Hub
        </Link>
        <h1 className={`${couplesHubPremium.screenTitle} mt-3`}>Couples community</h1>
        <p className={couplesHubPremium.screenSubtitle}>
          Shanah Power Couples — discussions, events, and resources separate from your private
          marriage space.
        </p>

        <div className="mt-4">
          <CouplesHubTabRow
            tabs={[
              { id: "discussions", label: "Discussions" },
              { id: "events", label: "Events" },
              { id: "resources", label: "Resources" },
            ]}
            active={tab}
            onChange={setTab}
          />
        </div>

        {!overview?.isPowerCouplesMember ? (
          <div className={`${couplesHubPremium.gateCard} mt-6`}>
            <p className="font-semibold">Join the group</p>
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
          <CouplesHubTileGrid tiles={tiles} />
        </div>
      </div>
    </div>
  );
}
