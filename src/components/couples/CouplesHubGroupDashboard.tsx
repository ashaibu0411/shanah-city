"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { CouplesCommunityFeedEmbedded } from "@/components/couples/CouplesCommunityFeedEmbedded";
import {
  CouplesFeatureCard,
  CouplesHeroCard,
  CouplesLoadingSkeleton,
  CouplesSectionHeading,
  CouplesShortcutTile,
} from "@/components/couples/design-system";
import {
  CouplesHomeGroupIcon,
  CouplesHomeLockHeartIcon,
} from "@/components/couples/CouplesHubHomeIcons";
import { CouplesHubTabRow } from "@/components/couples/CouplesHubTabRow";
import { CouplesHubTileGrid } from "@/components/couples/CouplesHubTileGrid";
import { CouplesLinkGate } from "@/components/couples/CouplesLinkGate";
import { couplesHubPremium } from "@/components/couples/couples-hub-premium";
import { couplesCommunityFeedPath } from "@/lib/couples-community-paths";
import { communityTileTarget } from "@/lib/couples-hub-paths";
import {
  couplesCommunityTiles,
  couplesMarriageTiles,
  type CouplesHubTile,
} from "@/lib/couples-hub-routes";
import type {
  CouplesHubCommunityTileId,
  CouplesHubMarriageTileId,
  CouplesHubOverview,
} from "@/lib/couples-hub-types";
import type { GroupDashboardQuickAction } from "@/lib/group-dashboard-types";
import type { PowerCouplesCommunitySection } from "@/lib/couples-hub-paths";
import { powerCouplesGroupSectionPath } from "@/lib/couples-hub-paths";
import { SHANAH_POWER_COUPLES_GROUP_ID } from "@/lib/church-groups";
import type { ChurchEvent } from "@/lib/types";

type CommunityTab = "discussions" | "events" | "resources";
type HubView = "landing" | "modules" | "community";

const TAB_TILE_IDS: Record<CommunityTab, CouplesHubCommunityTileId[]> = {
  discussions: ["discussions", "prayer", "announcements"],
  events: ["events", "challenges"],
  resources: ["resources", "devotionals"],
};

const HOME_MARRIAGE_SHORTCUTS: {
  id: CouplesHubMarriageTileId;
  title: string;
  emoji: string;
  tone: "sage" | "blush" | "blue" | "lavender";
}[] = [
  { id: "calendar", title: "Our Calendar", emoji: "📅", tone: "blue" },
  { id: "date-night", title: "Date Night", emoji: "💕", tone: "blush" },
  { id: "love-notes", title: "Love Notes", emoji: "💌", tone: "lavender" },
  { id: "devotionals", title: "Devotionals", emoji: "📖", tone: "sage" },
];

function parseEventDay(event: ChurchEvent): Date | null {
  const raw = event.startsOn?.trim() || event.date?.trim();
  if (!raw) return null;
  const parsed = new Date(`${raw}T12:00:00`);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function formatEventPreview(event: ChurchEvent) {
  const day = parseEventDay(event);
  const dateLabel = day
    ? day.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" })
    : event.date || "Date TBA";
  const meta = [dateLabel, event.time].filter(Boolean).join(" · ");
  return { meta, location: event.location?.trim() };
}

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
  const [nextEvent, setNextEvent] = useState<ChurchEvent | null>(null);
  const [eventsLoading, setEventsLoading] = useState(true);

  useEffect(() => {
    void fetch("/api/couples/hub")
      .then(async (response) => {
        const data = await response.json();
        if (response.ok) setOverview(data.overview ?? null);
      })
      .catch(() => undefined)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    void fetch(`/api/events?groupId=${encodeURIComponent(SHANAH_POWER_COUPLES_GROUP_ID)}`)
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) return;
        const events = (data.events ?? []) as ChurchEvent[];
        const upcoming = events
          .filter((event) => event.published !== false)
          .map((event) => ({ event, day: parseEventDay(event) }))
          .filter((entry) => entry.day && entry.day >= today)
          .sort((a, b) => a.day!.getTime() - b.day!.getTime());
        setNextEvent(upcoming[0]?.event ?? null);
      })
      .catch(() => undefined)
      .finally(() => setEventsLoading(false));
  }, []);

  const locked = !overview?.hasActiveLink;

  const marriageShortcutTiles = useMemo(() => {
    const byId = new Map(couplesMarriageTiles.map((tile) => [tile.id, tile]));
    return HOME_MARRIAGE_SHORTCUTS.map((shortcut) => {
      const tile = byId.get(shortcut.id);
      return tile ? { ...shortcut, href: tile.href } : null;
    }).filter(Boolean) as Array<{
      id: CouplesHubMarriageTileId;
      title: string;
      emoji: string;
      tone: "sage" | "blush" | "blue" | "lavender";
      href: string;
    }>;
  }, []);

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
          <section className="mt-2 pb-8">
            <div className="px-4">
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
            {communityTab === "discussions" ? (
              <CouplesCommunityFeedEmbedded mode="discussions" onBack={() => setHubView("landing")} />
            ) : (
              <div className="mt-4 px-4">
                <CouplesHubTileGrid tiles={communityTiles} onActivateTile={activateCommunityTile} />
              </div>
            )}
            {communityTab === "discussions" ? (
              <div className="mt-4 flex flex-col gap-2 px-4">
                <Link href={couplesCommunityFeedPath("prayer")} className={couplesHubPremium.secondaryCta}>
                  Prayer community
                </Link>
                <Link href={couplesCommunityFeedPath("announcements")} className={couplesHubPremium.secondaryCta}>
                  Announcements
                </Link>
              </div>
            ) : null}
          </section>
        )}
      </div>
    );
  }

  const eventPreview = nextEvent ? formatEventPreview(nextEvent) : null;

  return (
    <div className="couples-hub-landing pb-28">
      <CouplesHeroCard
        layout="banner"
        cropFlyerBranding
        title="Power Couples"
        tagline="Grow in faith. Love intentionally. Build together."
        showHeart
      >
        {overview?.hasActiveLink && overview.partnerName ? (
          <p className="mt-3 inline-block rounded-full bg-white/15 px-3 py-1.5 text-xs font-medium text-white backdrop-blur-sm">
            Linked with {overview.partnerName}
          </p>
        ) : null}
      </CouplesHeroCard>

      {joinSlot ? <div className="mt-4 px-[var(--couples-page-padding)]">{joinSlot}</div> : null}

      {!loading && locked ? (
        <div className="mt-4 px-[var(--couples-page-padding)]">
          <CouplesLinkGate tone="sheet" pendingIncoming={overview?.pendingIncomingInvite} />
        </div>
      ) : null}

      <div className="mt-4 flex flex-col gap-3 px-[var(--couples-page-padding)]">
        <CouplesFeatureCard
          variant="marriage"
          icon={<CouplesHomeLockHeartIcon />}
          title="Our Marriage"
          subtitle="Your private space to grow together"
          onClick={() => setHubView("modules")}
        />
        <CouplesFeatureCard
          variant="community"
          icon={<CouplesHomeGroupIcon />}
          title="Couples Community"
          subtitle="Connect, encourage & grow together"
          onClick={() => setHubView("community")}
        />
      </div>

      <section className="mt-8 px-[var(--couples-page-padding)]">
        <h2 className="font-[family-name:var(--font-couples-display)] text-[1.25rem] font-semibold text-[var(--couples-text)]">
          For Your Marriage
        </h2>
        <div
          className="couples-hub-landing-scroll -mx-[var(--couples-page-padding)] mt-4 flex gap-3 overflow-x-auto px-[var(--couples-page-padding)] pb-1"
          role="list"
        >
          {marriageShortcutTiles.map((shortcut) => (
            <CouplesShortcutTile
              key={shortcut.id}
              title={shortcut.title}
              icon={shortcut.emoji}
              href={shortcut.href}
              tone={shortcut.tone}
            />
          ))}
        </div>
      </section>

      <section className="mt-8 px-[var(--couples-page-padding)]">
        <div className="flex items-end justify-between gap-3">
          <h2 className="font-[family-name:var(--font-couples-display)] text-[1.25rem] font-semibold text-[var(--couples-text)]">
            Upcoming Couples Events
          </h2>
          <button
            type="button"
            className="shrink-0 pb-0.5 text-[0.8125rem] font-semibold text-[var(--couples-gold)] transition hover:text-[var(--couples-mocha)]"
            onClick={() => onCommunityNavigate("calendar")}
          >
            View all
          </button>
        </div>
        <div className="mt-3">
          {eventsLoading ? (
            <CouplesLoadingSkeleton rows={1} />
          ) : nextEvent && eventPreview ? (
            <Link
              href={powerCouplesGroupSectionPath("calendar")}
              className="flex gap-3 rounded-[var(--couples-radius-card)] bg-[var(--couples-surface)] p-4 transition active:scale-[0.99] motion-reduce:transition-none"
            >
              <span
                className="flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-xl bg-[var(--couples-gold-light)] text-center"
                aria-hidden
              >
                <span className="text-[0.625rem] font-bold uppercase tracking-wide text-[var(--couples-mocha)]">
                  {parseEventDay(nextEvent)?.toLocaleDateString(undefined, { month: "short" })}
                </span>
                <span className="text-lg font-semibold leading-none text-[var(--couples-mocha)]">
                  {parseEventDay(nextEvent)?.getDate()}
                </span>
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-[0.9375rem] font-semibold text-[var(--couples-text)]">
                  {nextEvent.title}
                </span>
                <span className="mt-0.5 block text-[0.8125rem] text-[var(--couples-muted)]">
                  {eventPreview.meta}
                </span>
                {eventPreview.location ? (
                  <span className="mt-0.5 block truncate text-xs text-[var(--couples-muted)]">
                    {eventPreview.location}
                  </span>
                ) : null}
              </span>
              <span className="self-center text-[var(--couples-muted)]" aria-hidden>›</span>
            </Link>
          ) : (
            <div className="rounded-[var(--couples-radius-card)] bg-[var(--couples-surface)] px-4 py-6 text-center text-sm text-[var(--couples-muted)]">
              No upcoming events on the calendar yet.
              <button
                type="button"
                className="mt-2 block w-full text-sm font-semibold text-[var(--couples-gold)]"
                onClick={() => onCommunityNavigate("calendar")}
              >
                Open group calendar
              </button>
            </div>
          )}
        </div>
      </section>

      {overview?.canManageMarriageMinistry ? (
        <section className="mx-[var(--couples-page-padding)] mt-8 mb-4 rounded-[var(--couples-radius-card)] bg-[var(--couples-surface)] p-4">
          <CouplesSectionHeading
            eyebrow="Ministry leaders"
            title="Marriage ministry tools"
            description="Publish marriage devotionals from the devotionals module or Manage."
          />
        </section>
      ) : null}
    </div>
  );
}
