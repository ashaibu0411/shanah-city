"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import type { VolunteerCheckIn } from "@/lib/member-types";
import { formatDenverTime, getZonedDateParts } from "@/lib/denver-time";
import { Card } from "@/components/ui";

export function AdminVolunteerArrivalsReport() {
  const { permissions } = useAuth();
  const [dateKey, setDateKey] = useState(() => getZonedDateParts().dateKey);
  const [arrivals, setArrivals] = useState<VolunteerCheckIn[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canView = permissions.canManageAdmin;

  useEffect(() => {
    if (!canView) return;

    let cancelled = false;
    setLoading(true);
    setError(null);

    fetch(`/api/admin/volunteer-checkins?date=${encodeURIComponent(dateKey)}`)
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.error ?? "Could not load FrontLiners arrivals.");
        }
        if (!cancelled) {
          setArrivals(data.arrivals ?? []);
        }
      })
      .catch((caught) => {
        if (!cancelled) {
          setError(caught instanceof Error ? caught.message : "Could not load arrivals.");
          setArrivals([]);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [canView, dateKey]);

  if (!canView) {
    return null;
  }

  return (
    <Card className="p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="font-display text-xl font-semibold text-night-900">
            FrontLiners check-in
          </h2>
          <p className="mt-1 text-sm text-night-600">
            Sunday arrival reports (Mountain time). The live list on Check-in / FrontLiners hides
            after 2:00 PM; history stays here.
          </p>
        </div>
        <label className="block shrink-0">
          <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-night-500">
            Service date
          </span>
          <input
            type="date"
            value={dateKey}
            onChange={(event) => setDateKey(event.target.value)}
            className="rounded-xl border border-night-900/10 bg-sand-50 px-3 py-2 text-sm outline-none ring-night-900/5 focus:ring-2"
          />
        </label>
      </div>

      {error ? (
        <p className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
      ) : loading ? (
        <p className="mt-4 text-sm text-night-600">Loading arrivals…</p>
      ) : arrivals.length === 0 ? (
        <p className="mt-4 text-sm text-night-500">No FrontLiners reported for this date.</p>
      ) : (
        <ul className="mt-4 space-y-2 text-sm text-night-700">
          {arrivals.map((entry) => (
            <li
              key={entry.id}
              className="flex justify-between gap-3 rounded-lg bg-sand-50 px-3 py-2.5"
            >
              <span>
                <span className="font-medium text-night-900">{entry.name}</span>
                <span className="text-night-500"> · {entry.ministry}</span>
              </span>
              <span className="shrink-0 font-medium text-night-800">
                {formatDenverTime(entry.checkedInAt)}
              </span>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
