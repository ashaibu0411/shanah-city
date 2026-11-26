"use client";

import { useEffect, useState } from "react";
import { ChurchFlyerImage } from "@/components/home/ChurchFlyerImage";
import { site } from "@/lib/site";
import {
  premiumV4HeroMountainImage,
  premiumV4HomeGreeting,
  premiumV4ServiceChip,
} from "@/lib/home-premium-v4";

type PremiumHomeV4HeroProps = {
  firstName?: string | null;
  campusLabel?: string;
  /** Premium Home V2/V3 — editorial type hierarchy (mobile home only). */
  editorial?: boolean;
  /** V3 mockup hero grading and compact ratio. */
  heroV3?: boolean;
};

export function PremiumHomeV4Hero({
  firstName,
  campusLabel,

}: PremiumHomeV4HeroProps) {
  const [greeting, setGreeting] = useState<string | null>(null);

  useEffect(() => {
    setGreeting(premiumV4HomeGreeting(firstName));
  }, [firstName]);

  return (
    <section aria-label="Welcome" className="mx-4 my-5 overflow-hidden rounded-xl bg-white text-[#19283B] dark:bg-[#1C222A] dark:text-[#F3F3EF]" style={{ display: "block" }}>
      <div className="px-5 pb-5 pt-6">
        <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-[#52647B] dark:text-[#B7C5D8]">{greeting || "Welcome home"}</p>
        <h1 className="text-[40px] font-semibold leading-[1.04] tracking-[-0.045em]">Shanah City.</h1>
        <p className="mt-3 max-w-[30ch] text-base leading-relaxed">{site.tagline}</p>
      </div>
      <div className="relative aspect-[16/9] overflow-hidden">
        <ChurchFlyerImage src={premiumV4HeroMountainImage} alt="" priority sizes="(max-width: 512px) 100vw, 768px" quality={95} className="absolute inset-0 h-full w-full object-cover" />
      </div>
      <p className="border-t border-slate-200 px-5 py-4 text-sm font-medium dark:border-slate-700">{premiumV4ServiceChip(campusLabel)}</p>
    </section>
  );
}
