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

const TAB_TILE_IDS: Record<CommunityTab, CouplesHubCommunityTileId[]> = {
  discussions: ["discussions", "prayer", "announcements"],
  events: ["events", "challenges"],
  resources: ["resources", "devotionals"],
};

export function CouplesHubGroupDashboard({
  onQuickAction,
  onCommunityNavigate,
}: {
  onQuickAction?: (action: GroupDashboardQuickAction) => void;
  onCommunityNavigate: (target: PowerCouplesCommunitySection) => void;
}) {
  const [overview, setOverview] = useState<CouplesHubOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [communityTab, setCommunityTab] = useState<CommunityTab>("discussions");

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

  return (
    <div className="couples-hub-page overflow-hidden rounded-[1.35rem] ring-1 ring-white/10">
      <div className="px-1 pb-2 pt-0">
        <CouplesHubHero
          eyebrow="Shanah City Church"
          title="Couples Hub"
          tagline="Grow in faith. Love intentionally. Build together."
        >
          {overview?.hasActiveLink && overview.partnerName ? (
            <p className="mt-4 inline-block rounded-full bg-white/15 px-3 py-1.5 text-xs font-medium text-white backdrop-blur-sm">
              Linked with {overview.partnerName}
            </p>
          ) : null}
        </CouplesHubHero>

        <div className="mt-3 flex flex-wrap gap-2 px-3">
          <button
            type="button"
            className={`${couplesHubPremium.marriageCta} !w-auto flex-1 min-w-[9rem] !py-2.5 !text-xs`}
            onClick={() => {
              document.getElementById("couples-hub-marriage")?.scrollIntoView({ behavior: "smooth" });
            }}
          >
            <span aria-hidden>🔒</span> Our marriage
          </button>
          <button
            type="button"
            className={`${couplesHubPremium.communityCta} !w-auto flex-1 min-w-[9rem] !py-2.5 !text-xs`}
            onClick={() => {
              document.getElementById("couples-hub-community")?.scrollIntoView({ behavior: "smooth" });
            }}
          >
            <span aria-hidden>👥</span> Community
          </button>
          {onQuickAction ? (
            <>
              <button
                type="button"
                className={`${couplesHubPremium.secondaryCta} !w-auto !px-4 !py-2.5 !text-xs`}
                onClick={() =>
                  onQuickAction({ id: "hub-chat", label: "Group chat", action: "chat" })
                }
              >
                Group chat
              </button>
              <button
                type="button"
                className={`${couplesHubPremium.secondaryCta} !w-auto !px-4 !py-2.5 !text-xs`}
                onClick={() => onCommunityNavigate("calendar")}
              >
                Events
              </button>
            </>
          ) : null}
        </div>

        <section id="couples-hub-marriage" className="mt-6 px-3">
          <p className={couplesHubPremium.sectionEyebrow}>Our marriage</p>
          <h3 className="mt-1 font-display text-lg font-semibold text-[var(--couples-text)]">
            Private space
          </h3>
          <p className="mt-1 text-xs text-[var(--couples-text-muted)]">
            Only you and your linked spouse — not visible to leaders or the community feed.
          </p>
          {loading ? (
            <p className="mt-4 text-center text-sm text-[var(--couples-text-muted)]">Loading…</p>
          ) : locked ? (
            <div className="mt-4">
              <CouplesLinkGate pendingIncoming={overview?.pendingIncomingInvite} />
            </div>
          ) : (
            <div className="mt-4">
              <CouplesHubTileGrid tiles={couplesMarriageTiles} variant="marriage" />
            </div>
          )}
          <Link
            href="/couples/marriage"
            className="mt-3 inline-block text-xs font-semibold text-rose-300 underline-offset-2 hover:underline"
          >
            Open full marriage dashboard
          </Link>
        </section>

        <section id="couples-hub-community" className="mt-8 px-3 pb-4">
          <p className={couplesHubPremium.sectionEyebrow}>Together</p>
          <h3 className="mt-1 font-display text-lg font-semibold text-[var(--couples-text)]">
            Couples community
          </h3>
          {!overview?.isPowerCouplesMember ? (
            <p className="mt-2 text-xs text-[var(--couples-text-muted)]">
              You are viewing this hub from the group — join to unlock all community tools.
            </p>
          ) : null}
          <div className="mt-4">
            <CouplesHubTabRow
              tabs={[
                { id: "discussions", label: "Discussions" },
                { id: "events", label: "Events" },
                { id: "resources", label: "Resources" },
              ]}
              active={communityTab}
              onChange={setCommunityTab}
            />
          </div>
          <div className="mt-4">
            <CouplesHubTileGrid
              tiles={communityTiles}
              onActivateTile={activateCommunityTile}
            />
          </div>
        </section>

        {overview?.canManageMarriageMinistry ? (
          <section className={`${couplesHubPremium.card} mx-3 mb-3`}>
            <p className={couplesHubPremium.sectionEyebrow}>Ministry leaders</p>
            <p className="mt-2 text-xs text-[var(--couples-text-muted)]">
              Publish marriage devotionals from Manage or the marriage devotionals module. Private
              spouse data is never visible here.
            </p>
          </section>
        ) : null}
      </div>
    </div>
  );
}
