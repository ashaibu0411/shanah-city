"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { CouplesHubHero } from "@/components/couples/CouplesHubHero";
import { CouplesHubTabRow } from "@/components/couples/CouplesHubTabRow";
import { CouplesHubTileGrid } from "@/components/couples/CouplesHubTileGrid";
import { CouplesLinkGate } from "@/components/couples/CouplesLinkGate";
import { couplesHubPremium } from "@/components/couples/couples-hub-premium";
import { communityTileTarget } from "@/lib/couples-hub-paths";
import {
  couplesCommunityTiles,
  couplesMarriageTiles,
  type CouplesHubTile,
} from "@/lib/couples-hub-routes";
import type { CouplesHubCommunityTileId, CouplesHubOverview } from "@/lib/couples-hub-types";
import type { GroupDashboardQuickAction } from "@/lib/group-dashboard-types";
import type { PowerCouplesCommunitySection } from "@/lib/couples-hub-paths";

type CommunityTab = "discussions" | "events" | "resources";
type HubView = "landing" | "modules" | "community";

const TAB_TILE_IDS: Record<CommunityTab, CouplesHubCommunityTileId[]> = {
  discussions: ["discussions", "prayer", "announcements"],
  events: ["events", "challenges"],
  resources: ["resources", "devotionals"],
};

export function CouplesHubGroupDashboard({
  joinSlot,
  onQuickAction,
  onCommunityNavigate,
}: {
  joinSlot?: React.ReactNode;
  onQuickAction?: (action: GroupDashboardQuickAction) => void;
  onCommunityNavigate: (target: PowerCouplesCommunitySection) => void;
}) {
  const [overview, setOverview] = useState<CouplesHubOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [communityTab, setCommunityTab] = useState<CommunityTab>("discussions");
  const [hubView, setHubView] = useState<HubView>("landing");

  useEffect(() => {
    void fetch("/api/couples/hub")
      .then(async (response) => {
        const data = await response.json();
        if (response.ok) setOverview(data.overview ?? null);
      })
      .catch(() => undefined)
      .finally(() => setLoading(false));
  }, []);

  const locked = !overview?.hasActiveLink;

  const communityTiles = useMemo(() => {
    const ids = new Set(TAB_TILE_IDS[communityTab]);
    return couplesCommunityTiles
      .filter((tile) => ids.has(tile.id as CouplesHubCommunityTileId))
      .map((tile) => ({ ...tile, tone: "community" as const }));
  }, [communityTab]);

  function activateCommunityTile(tile: CouplesHubTile) {
    const target = communityTileTarget(tile.id as CouplesHubCommunityTileId);
    if (target === "overview") return;
    onCommunityNavigate(target);
  }

  if (hubView !== "landing") {
    return (
      <div className={`${couplesHubPremium.inset} !px-0 !pt-2`}>
        <div className="px-4">
          <button type="button" className={couplesHubPremium.backLink} onClick={() => setHubView("landing")}>
            <span aria-hidden>←</span> Couples Hub
          </button>
          <h2 className={`${couplesHubPremium.screenTitle} mt-3`}>
            {hubView === "modules" ? "Our marriage" : "Couples community"}
          </h2>
          <p className={couplesHubPremium.screenSubtitle}>
            {hubView === "modules"
              ? "Everything private between you and your spouse."
              : "Discussions, events, and resources with other couples."}
          </p>
        </div>

        {hubView === "modules" ? (
          <section className="mt-4 px-4 pb-8">
            <div className={couplesHubPremium.menuPanel}>
            {loading ? (
              <p className="text-center text-sm text-[var(--couples-sheet-muted)]">Loading…</p>
            ) : locked ? (
              <CouplesLinkGate tone="sheet" pendingIncoming={overview?.pendingIncomingInvite} />
            ) : (
              <CouplesHubTileGrid tiles={couplesMarriageTiles} variant="marriage" />
            )}
            </div>
          </section>
        ) : (
          <section className="mt-6 px-4 pb-8">
            <CouplesHubTabRow
              tabs={[
                { id: "discussions", label: "Discussions" },
                { id: "events", label: "Events" },
                { id: "resources", label: "Resources" },
              ]}
              active={communityTab}
              onChange={setCommunityTab}
            />
            <div className="mt-4">
              <CouplesHubTileGrid tiles={communityTiles} onActivateTile={activateCommunityTile} />
            </div>
            <Link
              href="/community?group=group-shanah-power-couples"
              className={`${couplesHubPremium.primaryCta} mt-5`}
            >
              Open community feed
            </Link>
          </section>
        )}
      </div>
    );
  }

  return (
    <div className={`${couplesHubPremium.inset} !px-0 !pt-0`}>
      <CouplesHubHero
        title="Couples Hub"
        tagline="Grow in faith. Love intentionally. Build together."
        showHeart
      >
        {overview?.hasActiveLink && overview.partnerName ? (
          <p className="mt-4 inline-block rounded-full bg-white/15 px-3 py-1.5 text-xs font-medium text-white backdrop-blur-sm">
            Linked with {overview.partnerName}
          </p>
        ) : null}
      </CouplesHubHero>

      {joinSlot ? <div className="mt-4 px-4">{joinSlot}</div> : null}

      {!loading && locked ? (
        <div className="mt-4 px-4">
          <CouplesLinkGate tone="dark" pendingIncoming={overview?.pendingIncomingInvite} />
        </div>
      ) : null}

      <div className="mt-4 flex flex-col gap-3 px-4 pb-8">
        <button type="button" className={couplesHubPremium.marriageCta} onClick={() => setHubView("modules")}>
          <span className={couplesHubPremium.marriageCtaIcon} aria-hidden>🔒</span>
          <span>
            Our marriage
            <span className="mt-0.5 block text-xs font-normal text-white/80">Your private space</span>
          </span>
        </button>
        <button type="button" className={couplesHubPremium.communityCta} onClick={() => setHubView("community")}>
          <span className={couplesHubPremium.communityCtaIcon} aria-hidden>👥</span>
          <span>
            Couples community
            <span className="mt-0.5 block text-xs font-normal text-white/80">
              Events, discussions, resources
            </span>
          </span>
        </button>
      </div>

      {overview?.canManageMarriageMinistry ? (
        <section className={`${couplesHubPremium.card} mx-4 mb-4`}>
          <p className={couplesHubPremium.sectionEyebrow}>Ministry leaders</p>
          <p className="mt-2 text-xs text-[var(--couples-text-muted)]">
            Publish marriage devotionals from the devotionals module or Manage.
          </p>
        </section>
      ) : null}
    </div>
  );
}
