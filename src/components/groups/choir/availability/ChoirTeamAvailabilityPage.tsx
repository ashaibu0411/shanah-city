"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { ChoirSetlistHeader } from "@/components/groups/choir/setlist/ChoirSetlistHeader";
import { choirAvailabilityHref } from "@/lib/choir-availability-links";
import { SHANAH_WORSHIP_GROUP_ID } from "@/lib/choir-group-constants";
import "../choir-premium.css";

type Dashboard = {
  events: Array<{
    event: { id: string; title: string; dateKey: string; timeLabel: string };
    totals: {
      eligible: number;
      available: number;
      unavailable: number;
      maybe: number;
      notResponded: number;
    };
  }>;
  pendingChangeRequests: Array<{ id: string; memberName: string; reason: string; status: string }>;
  managePlannerHref: string;
};

export function ChoirTeamAvailabilityPage({ groupId }: { groupId: string }) {
  const [dashboard, setDashboard] = useState<Dashboard | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    fetch(`/api/groups/choir-availability?groupId=${encodeURIComponent(groupId)}&view=team_dashboard`)
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) {
          setError(data.error ?? "Access denied.");
          setDashboard(null);
        } else {
          setDashboard(data.dashboard);
          setError(null);
        }
      })
      .catch(() => setError("Could not load team availability."));
  }, [groupId]);

  useEffect(() => {
    load();
    window.scrollTo(0, 0);
  }, [load]);

  async function reviewChange(id: string, status: "approved" | "declined") {
    await fetch("/api/groups/choir-availability", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "review_change",
        groupId: SHANAH_WORSHIP_GROUP_ID,
        id,
        status,
      }),
    });
    load();
  }

  if (error) {
    return <p className="px-4 py-3 text-sm text-red-700">{error}</p>;
  }

  if (!dashboard) {
    return <p className="px-4 py-3 text-sm text-[var(--choir-muted)]">Loading…</p>;
  }

  return (
    <div className="choir-group-home choir-availability-page choir-page-shell space-y-4 pb-10">
      <ChoirSetlistHeader groupId={groupId} chatHref={`/groups/${groupId}?chat=1`} />
      <Link href={choirAvailabilityHref(groupId)} className="text-sm font-semibold text-[#AA751D]">
        ← Availability center
      </Link>
      <h1 className="font-display text-2xl font-bold text-[var(--choir-heading)]">Team availability</h1>
      <Link href={dashboard.managePlannerHref} className="choir-setlist-manage-link block text-center">
        Open worship planner →
      </Link>

      <section className="space-y-3">
        {dashboard.events.length === 0 ? (
          <p className="text-sm text-[var(--choir-muted)]">No upcoming events.</p>
        ) : (
          dashboard.events.map((row) => (
            <div key={row.event.id} className="choir-card p-4">
              <p className="font-display text-lg font-bold text-[var(--choir-heading)]">{row.event.title}</p>
              <p className="text-sm text-[var(--choir-muted)]">
                {row.event.dateKey} · {row.event.timeLabel}
              </p>
              <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
                <span className="choir-avail-status-available rounded-full px-2 py-1 text-center">
                  Available {row.totals.available}
                </span>
                <span className="choir-avail-status-unavailable rounded-full px-2 py-1 text-center">
                  Unavailable {row.totals.unavailable}
                </span>
                <span className="choir-avail-status-maybe rounded-full px-2 py-1 text-center">
                  Maybe {row.totals.maybe}
                </span>
                <span className="choir-avail-status-pending rounded-full px-2 py-1 text-center">
                  No response {row.totals.notResponded}
                </span>
              </div>
            </div>
          ))
        )}
      </section>

      <section>
        <h2 className="font-display text-lg font-bold text-[var(--choir-heading)]">Change requests</h2>
        {dashboard.pendingChangeRequests.length === 0 ? (
          <p className="text-sm text-[var(--choir-muted)]">No pending requests.</p>
        ) : (
          <ul className="mt-2 space-y-2">
            {dashboard.pendingChangeRequests.map((request) => (
              <li key={request.id} className="choir-card p-3">
                <p className="text-sm font-semibold text-[var(--choir-heading)]">{request.memberName}</p>
                <p className="text-sm text-[var(--choir-body)]">{request.reason}</p>
                <div className="mt-2 flex gap-2">
                  <button
                    type="button"
                    className="choir-btn-primary px-3 py-2 text-xs"
                    onClick={() => reviewChange(request.id, "approved")}
                  >
                    Mark reviewed
                  </button>
                  <button
                    type="button"
                    className="choir-btn-secondary px-3 py-2 text-xs"
                    onClick={() => reviewChange(request.id, "declined")}
                  >
                    Decline
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
