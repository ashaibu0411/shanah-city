"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/components/auth/AuthProvider";
import { Card } from "@/components/ui";

type OverviewData = {
  monthLabel: string;
  guests?: { total: number; new: number; contacted: number; thisMonth: number };
  people?: { total: number; newThisMonth: number };
  groups?: { total: number; members: number };
  volunteersToday?: number;
  ministryReports?: { total: number; submitted: number; reviewed: number; missing: number };
  giving?: { totalAmount: number; count: number };
  comms?: { pendingApproval: number; inProgress: number };
  kids?: { checkedIn: number; rooms: { ageGroup: string; count: number }[] };
};

function MetricCard({
  label,
  value,
  detail,
  href,
}: {
  label: string;
  value: string | number;
  detail?: string;
  href?: string;
}) {
  const content = (
    <Card className="h-full">
      <p className="text-sm font-semibold text-night-500">{label}</p>
      <p className="mt-2 text-3xl font-bold text-night-900">{value}</p>
      {detail ? <p className="mt-2 text-sm text-night-600">{detail}</p> : null}
    </Card>
  );

  if (href) {
    return (
      <Link href={href} className="block transition hover:opacity-90">
        {content}
      </Link>
    );
  }

  return content;
}

export function AdminOverviewPanel() {
  const { permissions } = useAuth();
  const [overview, setOverview] = useState<OverviewData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const response = await fetch("/api/admin/overview");
      const data = await response.json();
      if (!response.ok) {
        setError(data.error ?? "Could not load overview.");
        return;
      }
      setOverview(data.overview ?? null);
    }
    void load();
  }, []);

  if (error) {
    return <Card><p className="text-sm text-red-700">{error}</p></Card>;
  }

  if (!overview) {
    return <Card><p className="text-sm text-night-600">Loading dashboard...</p></Card>;
  }

  return (
    <div className="space-y-6">
      <Card>
        <h2 className="text-xl font-bold text-night-900">Pastor dashboard</h2>
        <p className="mt-1 text-sm text-night-600">
          Snapshot for {overview.monthLabel}. Metrics refresh when you open this page.
        </p>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {overview.guests ? (
          <MetricCard
            label="Guests"
            value={overview.guests.new}
            detail={`${overview.guests.new} new · ${overview.guests.contacted} contacted · ${overview.guests.thisMonth} this month`}
            href="/admin/guests"
          />
        ) : null}

        {overview.people ? (
          <MetricCard
            label="People"
            value={overview.people.total}
            detail={`${overview.people.newThisMonth} joined this month`}
            href="/admin/people"
          />
        ) : null}

        {overview.ministryReports && permissions.canManageAdmin ? (
          <MetricCard
            label="Leader reports"
            value={overview.ministryReports.missing}
            detail={`${overview.ministryReports.submitted} submitted · ${overview.ministryReports.reviewed} reviewed`}
            href="/admin/reports?section=leaders"
          />
        ) : null}

        {overview.giving ? (
          <MetricCard
            label="Giving this month"
            value={overview.giving.totalAmount.toLocaleString(undefined, {
              style: "currency",
              currency: "USD",
              maximumFractionDigits: 0,
            })}
            detail={`${overview.giving.count} gifts recorded`}
            href="/admin/giving"
          />
        ) : null}

        {typeof overview.volunteersToday === "number" ? (
          <MetricCard
            label="Volunteers today"
            value={overview.volunteersToday}
            detail="FrontLiners check-ins for today"
            href="/frontliners"
          />
        ) : null}

        {overview.kids ? (
          <MetricCard
            label="Kids checked in"
            value={overview.kids.checkedIn}
            detail={overview.kids.rooms.map((room) => `${room.ageGroup}: ${room.count}`).join(" · ")}
            href="/kids-ministry"
          />
        ) : null}

        {overview.groups ? (
          <MetricCard
            label="Groups"
            value={overview.groups.total}
            detail={`${overview.groups.members} total memberships`}
            href="/groups"
          />
        ) : null}

        {overview.comms ? (
          <MetricCard
            label="Comms queue"
            value={overview.comms.pendingApproval}
            detail={`${overview.comms.inProgress} in progress on the calendar`}
            href="/admin/comms"
          />
        ) : null}
      </div>
    </div>
  );
}
