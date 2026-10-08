"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/ui";
import { CouplesHubTileGrid } from "@/components/couples/CouplesHubTileGrid";
import { CouplesLinkGate } from "@/components/couples/CouplesLinkGate";
import { couplesHubPremium } from "@/components/couples/couples-hub-premium";
import { couplesCommunityTiles, couplesMarriageTiles } from "@/lib/couples-hub-routes";
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
        <PageHeader variant="flat" eyebrow="Marriage & family" title="Couples Hub" />

        <div className={`${couplesHubPremium.heroCard} mt-2`}>
          <p className={couplesHubPremium.sectionEyebrow}>Grow together</p>
          <h2 className="mt-2 font-display text-2xl font-semibold tracking-tight text-night-950 dark:text-sand-100">
            Love intentionally. Build in faith.
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-night-700 dark:text-sand-300">
            A private space for your marriage, plus the Shanah Power Couples community — events,
            resources, and encouragement with other couples.
          </p>
          {overview?.hasActiveLink && overview.partnerName ? (
            <p className="mt-4 rounded-2xl bg-white/80 px-3 py-2 text-sm font-medium text-rose-900 ring-1 ring-rose-200/80 dark:bg-[var(--color-bg-muted)] dark:text-rose-100 dark:ring-rose-900/40">
              Linked with <strong>{overview.partnerName}</strong>
              {overview.anniversaryDate ? (
                <span className="block text-xs font-normal text-night-600 dark:text-sand-400">
                  Anniversary {overview.anniversaryDate}
                </span>
              ) : null}
            </p>
          ) : null}
          <div className="mt-5 flex flex-col gap-2 sm:flex-row">
            <Link href="/couples/marriage" className={couplesHubPremium.primaryCta}>
              Our marriage
            </Link>
            <Link href="/couples/community" className={couplesHubPremium.secondaryCta}>
              Couples community
            </Link>
          </div>
        </div>

        {loading ? (
          <p className="mt-8 text-center text-sm text-night-500">Loading…</p>
        ) : error ? (
          <p className="mt-8 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
        ) : (
          <>
            <section className="mt-10">
              <p className={couplesHubPremium.sectionEyebrow}>Our marriage</p>
              <h3 className={`${couplesHubPremium.sectionTitle} mt-1`}>Private dashboard</h3>
              {locked ? (
                <div className="mt-4">
                  <CouplesLinkGate pendingIncoming={overview?.pendingIncomingInvite} />
                </div>
              ) : null}
              <div className="mt-4">
                <CouplesHubTileGrid tiles={couplesMarriageTiles} locked={locked} />
              </div>
            </section>

            <section className="mt-10">
              <p className={couplesHubPremium.sectionEyebrow}>Together</p>
              <h3 className={`${couplesHubPremium.sectionTitle} mt-1`}>Couples community</h3>
              {!overview?.isPowerCouplesMember ? (
                <p className="mt-3 text-sm leading-relaxed text-night-600 dark:text-sand-400">
                  Join{" "}
                  <Link
                    href={`/groups/${encodeURIComponent(SHANAH_POWER_COUPLES_GROUP_ID)}`}
                    className="font-semibold text-rose-800 underline-offset-2 hover:underline dark:text-rose-200"
                  >
                    Shanah Power Couples
                  </Link>{" "}
                  for group prayer, mentors, and marriage resources.
                </p>
              ) : null}
              <div className="mt-4">
                <CouplesHubTileGrid tiles={couplesCommunityTiles} />
              </div>
            </section>

            {overview?.canManageMarriageMinistry ? (
              <section className="mt-10 rounded-[1.25rem] border border-night-900/8 bg-white/80 p-4 dark:border-white/10 dark:bg-[var(--color-surface)]">
                <p className={couplesHubPremium.sectionEyebrow}>Ministry leaders</p>
                <p className="mt-2 text-sm text-night-700 dark:text-sand-300">
                  Publish devotionals, moderate discussions, and manage group resources from the
                  Power Couples group — private spouse data is never visible here.
                </p>
                <Link
                  href={`/groups/${encodeURIComponent(SHANAH_POWER_COUPLES_GROUP_ID)}`}
                  className={`${couplesHubPremium.secondaryCta} mt-4`}
                >
                  Open leader tools
                </Link>
              </section>
            ) : null}
          </>
        )}
      </div>
    </div>
  );
}
