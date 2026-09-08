"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { Devotion } from "@/lib/types";

type CouplesDevotionBannerProps = {
  className?: string;
};

export function CouplesDevotionBanner({ className = "" }: CouplesDevotionBannerProps) {
  const [devotion, setDevotion] = useState<Devotion | null>(null);

  useEffect(() => {
    void fetch("/api/devotions?tag=couples")
      .then((response) => response.json())
      .then((data) => {
        const items = (data.devotions ?? []) as Devotion[];
        setDevotion(items[0] ?? null);
      })
      .catch(() => setDevotion(null));
  }, []);

  if (!devotion) return null;

  return (
    <div
      className={`rounded-2xl border border-rose-200 bg-gradient-to-br from-rose-50 via-white to-sand-50 p-4 ${className}`}
    >
      <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-rose-800">
        This week for couples
      </p>
      <p className="mt-2 text-base font-semibold text-night-900">{devotion.title}</p>
      {devotion.reference ? (
        <p className="mt-1 text-sm text-night-600">{devotion.reference}</p>
      ) : null}
      <Link
        href={`/devotions/${encodeURIComponent(devotion.id)}`}
        className="mt-3 inline-flex text-sm font-semibold text-rose-900 underline-offset-2 hover:underline"
      >
        Read together →
      </Link>
    </div>
  );
}
