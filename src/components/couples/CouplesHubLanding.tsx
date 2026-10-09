"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CouplesHubHero } from "@/components/couples/CouplesHubHero";
import { CouplesLinkGate } from "@/components/couples/CouplesLinkGate";
import { couplesHubPremium } from "@/components/couples/couples-hub-premium";
import type { CouplesHubOverview } from "@/lib/couples-hub-types";
import { SHANAH_POWER_COUPLES_GROUP_ID } from "@/lib/church-groups";

export function CouplesHubLanding() {
  const [overview, setOverview] = useState<CouplesHubOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void fetch("/api/couples/hub")
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.error ?? "Could not load Couples Hub.");
        }
        setOverview(data.overview ?? null);
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : "Could not load Couples Hub.");
      })
      .finally(() => setLoading(false));
  }, []);

  const locked = !overview?.hasActiveLink;

  return (
    <div className={couplesHubPremium.page}>
      <div className={couplesHubPremium.inset}>
        <CouplesHubHero
          eyebrow="Shanah City Church"
          title="Couples Hub"
          tagline="Grow in faith. Love intentionally. Build together."
        >
          {overview?.hasActiveLink && overview.partnerName ? (
            <p className="mt-4 inline-block rounded-full bg-white/15 px-3 py-1.5 text-xs font-medium text-white backdrop-blur-sm">
              Linked with {overview.partnerName}
              {overview.anniversaryDate ? ` · Anniversary ${overview.anniversaryDate}` : ""}
            </p>
          ) : null}
        </CouplesHubHero>

        <div className="flex flex-col gap-3">
          <Link href="/couples/marriage" className={couplesHubPremium.marriageCta}>
            <span aria-hidden>🔒</span>
            <span>
              Our marriage
              <span className="mt-0.5 block text-xs font-normal text-white/80">Your private space</span>
            </span>
          </Link>
          <Link href="/couples/community" className={couplesHubPremium.communityCta}>
            <span aria-hidden>👥</span>
            <span>
              Couples community
              <span className="mt-0.5 block text-xs font-normal text-white/80">
                Events, discussions, resources
              </span>
            </span>
          </Link>
        </div>

        {loading ? (
          <p className="mt-8 text-center text-sm text-[var(--couples-text-muted)]">Loading…</p>
        ) : error ? (
          <p className="mt-8 rounded-xl bg-red-950/50 px-3 py-2 text-sm text-red-200">{error}</p>
        ) : locked ? (
          <div className="mt-8">
            <p className={couplesHubPremium.sectionEyebrow}>Before you begin</p>
            <CouplesLinkGate pendingIncoming={overview?.pendingIncomingInvite} />
          </div>
        ) : null}

        {!overview?.isPowerCouplesMember && !loading ? (
          <p className="mt-8 text-center text-sm text-[var(--couples-text-muted)]">
            New to the community?{" "}
            <Link
              href={`/groups/${encodeURIComponent(SHANAH_POWER_COUPLES_GROUP_ID)}`}
              className="font-semibold text-rose-300 underline-offset-2 hover:underline"
            >
              Join Shanah Power Couples
            </Link>
          </p>
        ) : null}

        {overview?.canManageMarriageMinistry ? (
          <section className={`${couplesHubPremium.card} mt-8`}>
            <p className={couplesHubPremium.sectionEyebrow}>Ministry leaders</p>
            <p className="mt-2 text-sm text-[var(--couples-text-muted)]">
              Publish marriage devotionals and manage group resources. Private spouse data is never
              visible to leaders.
            </p>
            <Link
              href={`/groups/${encodeURIComponent(SHANAH_POWER_COUPLES_GROUP_ID)}`}
              className={`${couplesHubPremium.secondaryCta} mt-4`}
            >
              Open leader tools
            </Link>
          </section>
        ) : null}
      </div>
    </div>
  );
}
