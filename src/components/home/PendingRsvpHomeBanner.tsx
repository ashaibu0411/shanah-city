"use client";

import Link from "next/link";
import { useAuth } from "@/components/auth/AuthProvider";
import { useMyEventRsvps } from "@/components/calendar/useMyEventRsvps";

export function PendingRsvpHomeBanner() {
  const { user } = useAuth();
  const { pendingCount } = useMyEventRsvps(Boolean(user));

  if (!user || pendingCount === 0) {
    return null;
  }

  return (
    <Link
      href="/calendar"
      className="block rounded-[1.25rem] border border-night-900/8 bg-white px-4 py-3 text-sm text-night-900 shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition hover:bg-[#f7f3eb]"
    >
      <span className="font-semibold">{pendingCount} event RSVP{pendingCount === 1 ? "" : "s"}</span>{" "}
      waiting for your reply · Tap to respond
    </Link>
  );
}
