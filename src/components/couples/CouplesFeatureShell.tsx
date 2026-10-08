"use client";

import Link from "next/link";
import { PageHeader } from "@/components/ui";
import { CouplesLinkGate } from "@/components/couples/CouplesLinkGate";
import { couplesHubPremium } from "@/components/couples/couples-hub-premium";
import type { CouplesHubOverview } from "@/lib/couples-hub-types";
import { useEffect, useState } from "react";

export function CouplesFeatureShell({
  title,
  eyebrow,
  description,
  phaseLabel = "Coming soon",
}: {
  title: string;
  eyebrow?: string;
  description: string;
  phaseLabel?: string;
}) {
  const [overview, setOverview] = useState<CouplesHubOverview | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void fetch("/api/couples/hub")
      .then(async (response) => {
        const data = await response.json();
        if (response.ok) setOverview(data.overview ?? null);
      })
      .finally(() => setLoading(false));
  }, []);

  const locked = !overview?.hasActiveLink;

  return (
    <div className={couplesHubPremium.page}>
      <div className={couplesHubPremium.inset}>
        <PageHeader variant="flat" eyebrow={eyebrow ?? "Our marriage"} title={title} />
        <p className="mt-2 text-sm leading-relaxed text-night-600 dark:text-sand-400">{description}</p>

        {loading ? (
          <p className="mt-8 text-center text-sm text-night-500">Loading…</p>
        ) : locked ? (
          <div className="mt-6">
            <CouplesLinkGate pendingIncoming={overview?.pendingIncomingInvite} />
          </div>
        ) : (
          <div className="mt-8 rounded-[1.25rem] border border-night-900/8 bg-white/90 p-5 dark:border-white/10 dark:bg-[var(--color-surface)]">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-clay-700">{phaseLabel}</p>
            <p className="mt-3 text-sm leading-relaxed text-night-700 dark:text-sand-300">
              This feature is wired into the Couples Hub architecture and will roll out in the next
              development phase. Your data will stay private to you and {overview?.partnerName ?? "your spouse"}.
            </p>
            <Link href="/couples/marriage" className={`${couplesHubPremium.secondaryCta} mt-5`}>
              Back to marriage dashboard
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
