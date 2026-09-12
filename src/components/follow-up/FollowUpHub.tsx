"use client";

import Link from "next/link";
import { useAuth } from "@/components/auth/AuthProvider";
import { GuestQueuePanel } from "@/components/frontliners/GuestQueuePanel";
import { Card } from "@/components/ui";
import { FOLLOW_UP_GROUP_ID } from "@/lib/follow-up-types";

export function FollowUpHub() {
  const { permissions } = useAuth();

  return (
    <div className="space-y-8">
      <div className="grid gap-3 sm:grid-cols-2">
        <Card className="p-4">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-clay-700">
            Your rhythm
          </p>
          <p className="mt-1 font-display text-lg font-semibold text-night-900">
            Contact guests within 48 hours
          </p>
          <p className="mt-2 text-sm text-night-600">
            Call or text each new submission, log outcomes in your monthly report, and escalate
            urgent pastoral needs immediately.
          </p>
        </Card>

        <Card className="p-4">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-clay-700">
            Team tools
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Link
              href={`/groups/${FOLLOW_UP_GROUP_ID}`}
              className="rounded-full bg-night-900 px-4 py-2 text-sm font-semibold text-sand-50 transition hover:bg-night-950"
            >
              Team group
            </Link>
            {permissions.canManageFollowUp ? (
              <Link
                href={`/groups/${FOLLOW_UP_GROUP_ID}?report=1`}
                className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-night-800 ring-1 ring-night-900/10 transition hover:bg-sand-50"
              >
                Monthly report
              </Link>
            ) : null}
            <a
              href="/guest"
              target="_blank"
              rel="noreferrer"
              className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-night-800 ring-1 ring-night-900/10 transition hover:bg-sand-50"
            >
              Guest connect link
            </a>
          </div>
        </Card>
      </div>

      <GuestQueuePanel variant="follow-up" />
    </div>
  );
}
