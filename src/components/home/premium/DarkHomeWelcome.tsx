"use client";

import Link from "next/link";
import { ChurchFlyerImage } from "@/components/home/ChurchFlyerImage";
import { AppNavIconGlyph } from "@/components/home/premium/PremiumHomeIcons";
import { homeMobileHeroImage } from "@/lib/home-explore-tile-images";
import { site } from "@/lib/site";

type DarkHomeWelcomeProps = {
  firstName?: string | null;
  campusLabel?: string;
  nextServiceLabel?: string;
};

const destinations = [
  { label: "Worship", description: "Watch live", href: "/live" },
  { label: "Devotions", description: "Daily word", href: "/devotions" },
  { label: "Community", description: "Connect", href: "/community" },
  { label: "Events", description: "What's next", href: "/calendar" },
] as const;

/**
 * The flyer-inspired first-screen experience is mobile-only.
 * These are real existing routes, not the mockup's illustrative app screens.
 */
export function DarkHomeWelcome({
  firstName,
  campusLabel,
  nextServiceLabel,
}: DarkHomeWelcomeProps) {
  return (
    <section
      className="relative isolate mb-6 overflow-hidden rounded-[1.65rem] border border-amber-300/20 bg-[#08152d] text-white shadow-[0_18px_45px_rgba(3,12,32,0.3)]"
      aria-label="Welcome to Shanah City"
      data-testid="dark-gold-home"
    >
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
        <div className="absolute -right-24 -top-32 h-72 w-72 rounded-full bg-[#b68a45]/20 blur-[75px]" />
        <div className="absolute -left-20 top-40 h-56 w-56 rounded-full bg-blue-600/20 blur-[85px]" />
        <div className="absolute inset-x-0 top-0 h-[17rem] opacity-45">
          <ChurchFlyerImage
            src={homeMobileHeroImage}
            alt=""
            priority
            sizes="100vw"
            className="h-full w-full object-cover object-center"
          />
        </div>
        <div className="absolute inset-x-0 top-0 h-[22rem] bg-gradient-to-b from-[#07152b]/45 via-[#07152b]/85 to-[#08152d]" />
      </div>

      <div className="relative px-4 pb-5 pt-7 sm:px-6">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border border-amber-200/30 bg-white/10 shadow-lg backdrop-blur-sm">
          <span className="font-display text-2xl font-black italic tracking-[-0.13em] text-[#f4d28d]">SC</span>
        </div>

        <p className="mt-3 text-center text-[10px] font-bold uppercase tracking-[0.34em] text-[#f4d28d]">
          Shanah City
        </p>
        <h1 className="mx-auto mt-4 max-w-[19rem] text-center font-display text-[clamp(1.65rem,7vw,2.4rem)] font-bold leading-[1.12] tracking-tight text-white">
          {firstName ? (
            <>Welcome back, <span className="text-[#f4d28d]">{firstName}</span></>
          ) : (
            <>Welcome to <span className="text-[#f4d28d]">Shanah City</span></>
          )}
        </h1>
        <p className="mx-auto mt-2 max-w-[18rem] text-center text-[13px] leading-relaxed text-slate-200">
          Changing lives to higher levels in God.
        </p>
        {campusLabel && nextServiceLabel ? (
          <p className="mx-auto mt-3 w-fit rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-center text-[11px] font-medium text-slate-100 backdrop-blur-sm">
            Sunday {nextServiceLabel} · {campusLabel}
          </p>
        ) : null}

        <div className="mt-6 grid grid-cols-2 gap-3">
          {destinations.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="group flex min-h-[112px] flex-col justify-between rounded-[1.15rem] border border-white/15 bg-gradient-to-br from-[#223550]/90 to-[#101e38]/95 px-4 py-3.5 shadow-[0_8px_20px_rgba(0,0,0,0.16)] transition active:scale-[0.98] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#f4d28d]"
            >
              <AppNavIconGlyph href={item.href} className="h-7 w-7 text-[#f4d28d]" />
              <span className="mt-2">
                <span className="block text-[15px] font-bold leading-tight text-white">{item.label}</span>
                <span className="mt-0.5 block text-[11px] text-slate-300">{item.description}</span>
              </span>
            </Link>
          ))}
        </div>
        <Link
          href="/give"
          className="mt-3 flex min-h-[66px] items-center gap-3 rounded-[1.15rem] border border-[#e9c578]/35 bg-gradient-to-r from-[#a3783b]/90 to-[#5b432f] px-4 py-3 text-white shadow-lg transition active:scale-[0.99] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#f4d28d]"
        >
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/15">
            <AppNavIconGlyph href="/give" className="h-6 w-6 text-[#fff0c8]" />
          </span>
          <span className="flex-1">
            <span className="block text-[15px] font-bold">Give</span>
            <span className="block text-[11px] text-white/85">Make an impact through generosity</span>
          </span>
          <span className="text-lg text-white/85" aria-hidden>→</span>
        </Link>
        <div className="mt-4 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-[12px] font-semibold">
          <Link href="/check-in" className="text-slate-200 underline decoration-[#f4d28d]/50 underline-offset-4">
            Check in
          </Link>
          <Link href="/groups" className="text-slate-200 underline decoration-[#f4d28d]/50 underline-offset-4">
            My groups
          </Link>
          <Link href={site.visitCTA.href} className="text-slate-200 underline decoration-[#f4d28d]/50 underline-offset-4">
            Plan a visit
          </Link>
        </div>
      </div>
    </section>
  );
}
