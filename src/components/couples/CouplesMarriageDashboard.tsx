"use client";

import { useEffect, useState } from "react";
import { CouplesHubScreen } from "@/components/couples/CouplesHubScreen";
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
    <CouplesHubScreen title="Couples Hub" backHref={powerCouplesGroupHubPath()} backLabel="Back">
      <p className={couplesHubPremium.sheetSubtitle}>
        Shared only with your linked spouse — not visible to church staff or the community feed.
      </p>

      {overview?.hasActiveLink && overview.partnerName ? (
        <p className="mb-4 rounded-2xl border border-stone-200 bg-white px-3 py-2 text-sm font-medium text-stone-800">
          With <strong>{overview.partnerName}</strong>
        </p>
      ) : null}

      {loading ? (
        <p className="mt-8 text-center text-sm text-[var(--couples-sheet-muted)]">Loading…</p>
      ) : error ? (
        <p className={couplesHubPremium.sheetStatusError}>{error}</p>
      ) : locked ? (
        <CouplesLinkGate pendingIncoming={overview?.pendingIncomingInvite} />
      ) : (
        <div className={couplesHubPremium.menuPanel}>
          <CouplesHubTileGrid tiles={couplesMarriageTiles} variant="marriage" />
        </div>
      )}
    </CouplesHubScreen>
  );
}
