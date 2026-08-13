"use client";

import { useAppShell } from "@/components/app/AppShellContext";
import { site } from "@/lib/site";

export function ConnectHero() {
  const { isMobileApp } = useAppShell();

  if (!isMobileApp) return null;

  return (
    <div
      className={`mb-6 rounded-3xl bg-gradient-to-br ${site.visitCTA.gradient} p-6 text-white shadow-md`}
    >
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/80">
        Plan your visit
      </p>
      <h2 className="mt-2 font-display text-2xl font-semibold">
        We&apos;d love to meet you
      </h2>
      <p className="mt-2 text-sm leading-relaxed text-white/85">
        Join us in Aurora, Colorado or Accra, Ghana.
      </p>
    </div>
  );
}
