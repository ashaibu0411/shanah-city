"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CouplesHubTileGrid } from "@/components/couples/CouplesHubTileGrid";
import { CouplesLinkGate } from "@/components/couples/CouplesLinkGate";
import { couplesHubPremium } from "@/components/couples/couples-hub-premium";
import { powerCouplesGroupHubPath } from "@/lib/couples-hub-paths";
import { couplesMarriageTiles } from "@/lib/couples-hub-routes";
import type { CouplesHubOverview } from "@/lib/couples-hub-types";

export function CouplesMarriageDashboard() {
  const [overview, setOverview] = useState<CouplesHubOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void fetch("/api/couples/hub")
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error ?? "Could not load.");
        setOverview(data.overview ?? null);
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : "Could not load.");
      })
      .finally(() => setLoading(false));
  }, []);

  const locked = !overview?.hasActiveLink;

  return (
    <div className={couplesHubPremium.page}>
      <div className={couplesHubPremium.inset}>
        <Link href={powerCouplesGroupHubPath()} className={couplesHubPremium.backLink}>
          <span aria-hidden>←</span> Couples Hub
        </Link>
        <h1 className={`${couplesHubPremium.screenTitle} mt-3`}>Our marriage</h1>
        <p className={couplesHubPremium.screenSubtitle}>
          Shared only with your linked spouse — not visible to church staff or the community feed.
        </p>

        {overview?.hasActiveLink && overview.partnerName ? (
          <p className="mt-4 rounded-2xl border border-white/10 bg-[var(--couples-surface)] px-3 py-2 text-sm font-medium">
            With <strong className="text-rose-200">{overview.partnerName}</strong>
          </p>
        ) : null}

        {loading ? (
          <p className="mt-8 text-center text-sm text-[var(--couples-text-muted)]">Loading…</p>
        ) : error ? (
          <p className="mt-8 rounded-xl bg-red-950/50 px-3 py-2 text-sm text-red-200">{error}</p>
        ) : locked ? (
          <div className="mt-6">
            <CouplesLinkGate pendingIncoming={overview?.pendingIncomingInvite} />
          </div>
        ) : (
          <div className="mt-6">
            <CouplesHubTileGrid tiles={couplesMarriageTiles} variant="marriage" />
          </div>
        )}
      </div>
    </div>
  );
}
