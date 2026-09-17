"use client";

import Link from "next/link";
import { useAuth } from "@/components/auth/AuthProvider";

export function ManageRecurringGivingCallout() {
  const { user, loading } = useAuth();

  if (loading || !user) {
    return null;
  }

  return (
    <Link
      href="/profile#your-giving"
      className="theme-light-surface mb-8 block rounded-2xl border-2 border-clay-500/50 bg-gradient-to-br from-clay-100 via-sand-50 to-amber-50/90 px-5 py-5 ring-2 ring-clay-400/30 transition hover:border-clay-600 active:scale-[0.99] dark:border-clay-400/40 dark:from-night-800 dark:via-night-900 dark:to-night-800 dark:ring-clay-500/20"
    >
      <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-clay-800 dark:text-clay-300">
        Already giving monthly?
      </p>
      <p className="mt-2 font-display text-xl font-bold leading-snug text-night-950 dark:text-sand-50 sm:text-2xl">
        Manage your recurring giving
      </p>
      <p className="mt-2 text-sm leading-relaxed text-night-700 dark:text-sand-300">
        Update amount, payment method, or cancel in Stripe&apos;s secure portal — tap here to open
        your giving settings on your profile.
      </p>
      <span className="mt-4 inline-flex items-center gap-1 text-sm font-bold text-clay-800 dark:text-clay-300">
        Open recurring giving
        <span aria-hidden>→</span>
      </span>
    </Link>
  );
}
