"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/ui";
import { CouplesHubTileGrid } from "@/components/couples/CouplesHubTileGrid";
import { CouplesLinkGate } from "@/components/couples/CouplesLinkGate";
import { couplesHubPremium } from "@/components/couples/couples-hub-premium";
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
        <PageHeader variant="flat" eyebrow="Private" title="Our marriage" />
        <p className="mt-1 text-sm text-night-600 dark:text-sand-400">
          Shared only with your linked spouse — not visible to church staff or the community feed.
        </p>

        {overview?.hasActiveLink && overview.partnerName ? (
          <p className="mt-4 text-sm font-medium text-night-800 dark:text-sand-200">
            With <strong>{overview.partnerName}</strong>
          </p>
        ) : null}

        {loading ? (
          <p className="mt-8 text-center text-sm text-night-500">Loading…</p>
        ) : error ? (
          <p className="mt-8 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
        ) : locked ? (
          <div className="mt-6">
            <CouplesLinkGate pendingIncoming={overview?.pendingIncomingInvite} />
          </div>
        ) : (
          <div className="mt-6">
            <CouplesHubTileGrid tiles={couplesMarriageTiles} />
          </div>
        )}

        <Link href="/couples" className={`${couplesHubPremium.secondaryCta} mt-10`}>
          Back to Couples Hub
        </Link>
      </div>
    </div>
  );
}
