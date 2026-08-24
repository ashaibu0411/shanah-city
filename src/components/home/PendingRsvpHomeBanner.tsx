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
      className="block rounded-2xl border border-teal-200 bg-teal-50 px-4 py-3 text-sm text-teal-950 ring-1 ring-teal-100 transition hover:bg-teal-100/80"
    >
      <span className="font-semibold">{pendingCount} event RSVP{pendingCount === 1 ? "" : "s"}</span>{" "}
      waiting for your reply · Tap to respond
    </Link>
  );
}
