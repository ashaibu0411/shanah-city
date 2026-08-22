"use client";

import { useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { DevotionCard } from "@/components/devotions/DevotionCard";
import type { Devotion } from "@/lib/types";

export function DevotionsFeed({ devotions }: { devotions: Devotion[] }) {
  const searchParams = useSearchParams();
  const targetId = searchParams.get("id");
  const scrolledRef = useRef(false);

  useEffect(() => {
    if (!targetId || scrolledRef.current) return;
    const element = document.getElementById(`devotion-${targetId}`);
    if (!element) return;
    scrolledRef.current = true;
    window.setTimeout(() => {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 100);
  }, [targetId, devotions]);

  return (
    <div className="grid gap-4">
      {devotions.map((devotion) => (
        <DevotionCard
          key={devotion.id}
          devotion={devotion}
          highlighted={Boolean(targetId && devotion.id === targetId)}
        />
      ))}
    </div>
  );
}
