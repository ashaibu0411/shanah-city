"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/components/auth/AuthProvider";
import { Card } from "@/components/ui";
import {
  formatReportMonth,
  previousReportMonth,
} from "@/lib/ministry-report-types";

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

export function DevotionBrowseNudge() {
  return (
    <Card className="flex items-center justify-between gap-3 px-4 py-3">
      <div>
        <p className="text-sm font-semibold text-night-900">Keep reading</p>
        <p className="text-xs text-night-600">Browse past devotions anytime.</p>
      </div>
      <Link
        href="/devotions"
        className="shrink-0 rounded-full bg-teal-700 px-3 py-1.5 text-xs font-bold text-white"
      >
        Library
      </Link>
    </Card>
  );
}
