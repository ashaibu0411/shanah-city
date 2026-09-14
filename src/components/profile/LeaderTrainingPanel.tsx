"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Card } from "@/components/ui";
import { useAppShell } from "@/components/app/AppShellContext";

type HandoutLink = {
  slug: string;
  title: string;
  description: string;
  href: string;
};

export function LeaderTrainingPanel() {
  const { isMobileApp } = useAppShell();
  const [handouts, setHandouts] = useState<HandoutLink[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const response = await fetch("/api/profile/training-handouts");
        if (!response.ok) {
          if (!cancelled) setHandouts([]);
          return;
        }
        const data = await response.json();
        if (!cancelled) {
          setHandouts(Array.isArray(data.handouts) ? data.handouts : []);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading || handouts.length === 0) {
    return null;
  }

  return (
    <Card className={isMobileApp ? "!p-3.5" : ""}>
      <h2
        className={`font-display font-semibold text-night-900 ${isMobileApp ? "text-base" : "text-xl"}`}
      >
        Leader training
      </h2>
      <p className="mt-1 text-sm text-night-600">
        One-page guides for your role. Open a handout, then use Print → Save as PDF if you want a
        copy offline.
      </p>
      <ul className={`mt-3 ${isMobileApp ? "divide-y divide-night-900/5" : "space-y-2"}`}>
        {handouts.map((handout) => (
          <li key={handout.slug} className={isMobileApp ? "py-2.5 first:pt-0" : ""}>
            <Link
              href={handout.href}
              className="block rounded-xl transition hover:bg-sand-50/80 active:bg-sand-100/80"
            >
              <span className="font-semibold text-night-900">{handout.title}</span>
              <span className="mt-0.5 block text-sm text-night-600">{handout.description}</span>
              <span className="mt-1 inline-block text-sm font-medium text-clay-700">
                Open handout →
              </span>
            </Link>
          </li>
        ))}
      </ul>
      <p className="mt-3 text-xs text-night-500">
        <Link href="/training" className="font-medium text-night-700 hover:underline">
          Browse all training materials
        </Link>
      </p>
    </Card>
  );
}
