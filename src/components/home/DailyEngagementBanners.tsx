"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/components/auth/AuthProvider";
import { Card } from "@/components/ui";
import { SHANAH_POWER_COUPLES_GROUP_ID } from "@/lib/church-groups";
import type { CoupleLinkStatusResponse } from "@/lib/couple-link-types";
import {
  formatReportMonth,
  previousReportMonth,
} from "@/lib/ministry-report-types";
import { FOLLOW_UP_GROUP_ID } from "@/lib/follow-up-types";

type LeaderGroup = {
  id: string;
  name: string;
};

export function LeaderReportHomeBanner() {
  const { permissions, user } = useAuth();
  const [leaderGroups, setLeaderGroups] = useState<LeaderGroup[]>([]);
  const [missingCount, setMissingCount] = useState(0);

  useEffect(() => {
    if (!user || !permissions.canSubmitMinistryReports) return;

    const reportMonth = previousReportMonth();
    fetch(`/api/ministry-reports?reportMonth=${encodeURIComponent(reportMonth)}`)
      .then((response) => response.json())
      .then((data) => {
        const groups = (data.leaderGroups ?? []) as LeaderGroup[];
        setLeaderGroups(groups);
        const reports = (data.reports ?? []) as Array<{ groupId: string; status: string }>;
        const missing = groups.filter((group) => {
          const report = reports.find((entry) => entry.groupId === group.id);
          return (
            !report ||
            report.status === "draft" ||
            report.status === "returned"
          );
        });
        setMissingCount(missing.length);
      })
      .catch(() => undefined);
  }, [permissions.canSubmitMinistryReports, user]);

  if (!permissions.canSubmitMinistryReports || missingCount === 0 || leaderGroups.length === 0) {
    return null;
  }

  const reportMonth = previousReportMonth();
  const monthLabel = formatReportMonth(reportMonth);
  const primaryGroup = leaderGroups[0];

  return (
    <Link
      href={`/groups/${encodeURIComponent(primaryGroup.id)}?report=1`}
      className="block rounded-2xl border border-amber-200/80 bg-gradient-to-r from-amber-50/95 to-orange-50/90 px-4 py-3 ring-1 ring-amber-100 transition hover:border-amber-300 active:scale-[0.99]"
    >
      <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-amber-800">
        Ministry report due
      </p>
      <p className="mt-1 font-display text-base font-semibold text-night-900">
        Submit your {monthLabel} report
      </p>
      <p className="mt-1 text-sm text-night-600">
        {leaderGroups.length === 1
          ? `${primaryGroup.name} · Tap to open the monthly report tab`
          : `${missingCount} team${missingCount === 1 ? "" : "s"} still need ${monthLabel} reports`}
      </p>
    </Link>
  );
}

export function FollowUpHomeBanner() {
  const { permissions, user } = useAuth();
  const [newCount, setNewCount] = useState(0);

  useEffect(() => {
    if (!user || !permissions.canManageGuestSubmissions) return;

    fetch("/api/guests")
      .then((response) => response.json())
      .then((data) => {
        const guests = (data.guests ?? []) as Array<{ status: string }>;
        setNewCount(guests.filter((guest) => guest.status === "new").length);
      })
      .catch(() => undefined);
  }, [permissions.canManageGuestSubmissions, user]);

  if (!permissions.canManageGuestSubmissions || newCount === 0) {
    return null;
  }

  return (
    <Link
      href={`/groups/${encodeURIComponent(FOLLOW_UP_GROUP_ID)}?guests=1`}
      className="block rounded-2xl border border-clay-200/80 bg-gradient-to-r from-clay-50/95 to-orange-50/90 px-4 py-3 ring-1 ring-clay-100 transition hover:border-clay-300 active:scale-[0.99]"
    >
      <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-clay-800">
        Guest follow-up
      </p>
      <p className="mt-1 font-display text-base font-semibold text-night-900">
        {newCount} new guest{newCount === 1 ? "" : "s"} waiting
      </p>
      <p className="mt-1 text-sm text-night-600">
        Open the guest queue and contact visitors within 48 hours.
      </p>
    </Link>
  );
}

export function DevotionBrowseNudge() {
  return (
    <Card className="flex items-center justify-between gap-3 px-4 py-3">
      <div>
        <p className="text-sm font-semibold text-night-900">Keep reading</p>
        <p className="text-xs text-night-600">Browse past devotions anytime.</p>
      </div>
      <Link
        href="/devotions"
        className="shrink-0 rounded-full bg-night-950 px-3 py-1.5 text-xs font-bold text-white"
      >
        Library
      </Link>
    </Card>
  );
}

export function AnniversaryHomeBanner() {
  const { user } = useAuth();
  const [nudge, setNudge] = useState<CoupleLinkStatusResponse["anniversaryNudge"]>(null);

  useEffect(() => {
    if (!user) {
      setNudge(null);
      return;
    }

    fetch("/api/couple-link")
      .then((response) => response.json())
      .then((data: CoupleLinkStatusResponse) => {
        setNudge(data.anniversaryNudge ?? null);
      })
      .catch(() => setNudge(null));
  }, [user]);

  if (!nudge) return null;

  const headline =
    nudge.daysUntil === 0
      ? "Happy anniversary!"
      : nudge.daysUntil === 1
        ? "Anniversary tomorrow"
        : `Anniversary in ${nudge.daysUntil} days`;

  const yearsLine =
    nudge.yearsMarried != null && nudge.yearsMarried > 0
      ? `${nudge.yearsMarried} year${nudge.yearsMarried === 1 ? "" : "s"} together`
      : "Celebrate your marriage this week";

  return (
    <Link
      href={`/groups/${encodeURIComponent(SHANAH_POWER_COUPLES_GROUP_ID)}`}
      className="block rounded-2xl border border-rose-200/80 bg-gradient-to-r from-rose-50/95 to-pink-50/90 px-4 py-3 ring-1 ring-rose-100 transition hover:border-rose-300 active:scale-[0.99]"
    >
      <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-rose-800">
        Power Couples
      </p>
      <p className="mt-1 font-display text-base font-semibold text-night-900">{headline}</p>
      <p className="mt-1 text-sm text-night-600">
        {yearsLine} · Tap for couples devotion and growth resources
      </p>
    </Link>
  );
}
