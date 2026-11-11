"use client";

import Link from "next/link";
import { AppNavIconGlyph } from "@/components/home/premium/PremiumHomeIcons";
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
      className="flyer-home-hero relative isolate overflow-hidden bg-[#08152d] text-white"
      aria-label="Welcome to Shanah City"
      data-testid="dark-gold-home"
    >
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
        <div className="absolute -top-40 -right-24 h-80 w-80 rounded-full bg-[#b78a46]/15 blur-[85px]" />
        <div className="absolute -left-20 top-40 h-64 w-64 rounded-full bg-[#465a9c]/20 blur-[85px]" />
        <svg className="absolute inset-x-0 top-28 h-72 w-full opacity-80" viewBox="0 0 420 280" preserveAspectRatio="xMidYMid slice">
          <defs>
            <linearGradient id="flyer-sky" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#101d40" stopOpacity="0" />
              <stop offset=".7" stopColor="#c88a65" stopOpacity=".32" />
              <stop offset="1" stopColor="#f1bc70" stopOpacity=".4" />
            </linearGradient>
            <linearGradient id="flyer-ridge" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#6882a3" />
              <stop offset="1" stopColor="#17294c" />
            </linearGradient>
          </defs>
          <rect width="420" height="280" fill="url(#flyer-sky)" />
          <path d="M0 230 L46 196 L76 205 L116 144 L155 196 L188 168 L230 217 L277 158 L301 173 L340 122 L387 191 L420 166 L420 280 L0 280 Z" fill="url(#flyer-ridge)" />
          <path d="M95 172 L116 144 L139 176 L127 170 L117 158 L107 174 M320 149 L340 122 L360 148 L343 139 L337 136 Z" fill="#c1c6ca" opacity=".9" />
          <path d="M0 250 L65 223 L125 248 L194 215 L247 244 L327 203 L420 244 L420 280 L0 280 Z" fill="#101e3b" />
          <path d="M0 266 L71 250 L142 263 L214 244 L306 260 L382 247 L420 256 L420 280 L0 280 Z" fill="#07152e" />
        </svg>
        <div className="absolute inset-0 bg-gradient-to-b from-[#08152d]/10 via-[#08152d]/45 to-[#08152d]"/>
      </div>

      <div className="relative px-4 pb-7 pt-8 sm:px-6">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-[#edc879]/35 bg-[#132443]/75 shadow-[0_0_30px_rgba(227,183,100,.18)] backdrop-blur-sm">
          <span className="font-display text-2xl font-black italic tracking-[-0.13em] text-[#f4d28d]">SC</span>
        </div>

        <p className="mt-3 text-center text-[11px] font-bold uppercase tracking-[0.38em] text-[#f4d28d]">
          Shanah City
        </p>
        <h1 className="mx-auto mt-7 max-w-[20rem] text-center font-display text-[clamp(1.85rem,8vw,2.7rem)] font-bold leading-[1.1] tracking-tight text-white">
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

        <div className="mt-9 grid grid-cols-2 gap-3">
          {destinations.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="group flex min-h-[124px] flex-col justify-between rounded-[1.05rem] border border-[#d9b46f]/25 bg-gradient-to-br from-[#243858]/95 to-[#0e1d37]/95 px-4 py-4 shadow-[0_12px_25px_rgba(0,0,0,0.24)] transition active:scale-[0.98] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#f4d28d]"
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
          className="mt-3 flex min-h-[72px] items-center gap-3 rounded-[1.05rem] border border-[#e9c578]/40 bg-gradient-to-r from-[#8d6636] via-[#6e4d31] to-[#3d3140] px-4 py-3 text-white shadow-[0_12px_25px_rgba(0,0,0,0.25)] transition active:scale-[0.99] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#f4d28d]"
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
