"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { Button, Card } from "@/components/ui";
import {
  guestStatusLabel,
  serviceTimeLabel,
  type GuestSubmission,
  type GuestSubmissionStatus,
} from "@/lib/frontliners-types";

type GuestQueuePanelProps = {
  variant?: "admin" | "follow-up";
  compactHeader?: boolean;
};

export function GuestQueuePanel({
  variant = "admin",
  compactHeader = false,
}: GuestQueuePanelProps) {
  const { permissions } = useAuth();
  const [guests, setGuests] = useState<GuestSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);
  const [filter, setFilter] = useState<GuestSubmissionStatus | "all">("new");

  const canManage = permissions.canManageGuestSubmissions;
  const isFollowUp = variant === "follow-up";

  async function loadGuests() {
    setLoading(true);
    const response = await fetch("/api/guests");
    const data = await response.json();
    setLoading(false);
    if (response.ok) {
      setGuests(data.guests ?? []);
    }
  }

  useEffect(() => {
    if (canManage) {
      loadGuests();
    }
  }, [canManage]);

  async function updateStatus(id: string, status: GuestSubmissionStatus) {
    const response = await fetch("/api/guests", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status }),
    });
    const data = await response.json();
    if (response.ok) {
      setGuests((current) => current.map((guest) => (guest.id === id ? data.guest : guest)));
      setMessage(`Marked as ${guestStatusLabel(status).toLowerCase()}.`);
    }
  }

  if (!canManage) {
    return (
      <Card>
        <p className="text-sm text-night-600">
          Guest follow-up is managed by the Follow-Up Ministry and Admin Group.
        </p>
      </Card>
    );
  }

  const filtered =
    filter === "all" ? guests : guests.filter((guest) => guest.status === filter);
  const newCount = guests.filter((guest) => guest.status === "new").length;

  return (
    <div className="space-y-6">
      {!compactHeader ? (
        <Card className="overflow-hidden p-0 ring-1 ring-night-900/10">
          <div
            className={
              isFollowUp
                ? "bg-gradient-to-br from-clay-700 via-clay-800 to-night-900 px-6 py-5 text-white"
                : "bg-gradient-to-br from-emerald-700 to-teal-900 px-6 py-5 text-white"
            }
          >
            <p
              className={
                isFollowUp
                  ? "text-xs font-semibold uppercase tracking-[0.2em] text-clay-200"
                  : "text-xs font-semibold uppercase tracking-[0.2em] text-emerald-200"
              }
            >
              {isFollowUp ? "Follow-Up Ministry · Guest care" : "Admin · Guest follow-up"}
            </p>
            <h2 className="mt-1 font-display text-2xl font-semibold">Guest queue</h2>
            <p
              className={
                isFollowUp ? "mt-2 text-sm text-clay-100/90" : "mt-2 text-sm text-emerald-100/90"
              }
            >
              Visitors submit at{" "}
              <a href="/guest" className="font-semibold underline" target="_blank" rel="noreferrer">
                /guest
              </a>{" "}
              — contact new guests within 48 hours, then mark contacted or archive.
            </p>
            {newCount > 0 ? (
              <p className="mt-3 inline-flex rounded-full bg-white/15 px-3 py-1 text-xs font-bold uppercase tracking-[0.14em] text-white">
                {newCount} new guest{newCount === 1 ? "" : "s"} waiting
              </p>
            ) : null}
          </div>
        </Card>
      ) : null}

      <div className="flex flex-wrap gap-2">
        {(
          [
            { id: "new", label: "New" },
            { id: "contacted", label: "Contacted" },
            { id: "archived", label: "Archived" },
            { id: "all", label: "All" },
          ] as const
        ).map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setFilter(item.id)}
            className={`rounded-full px-4 py-1.5 text-sm font-semibold transition ${
              filter === item.id
                ? "bg-night-900 text-sand-50"
                : "bg-white text-night-600 ring-1 ring-night-900/10 hover:bg-sand-100"
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-sm text-night-500">Loading guest submissions…</p>
      ) : filtered.length === 0 ? (
        <Card>
          <p className="text-sm text-night-600">No guest submissions in this view yet.</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map((guest) => (
            <Card key={guest.id}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-display text-lg font-semibold text-night-900">{guest.name}</p>
                  <p className="mt-1 text-sm text-night-600">
                    {guest.isFirstVisit ? "First visit" : "Returning guest"}
                    {guest.visitDate ? ` · ${guest.visitDate}` : ""}
                    {guest.serviceTime ? ` · ${serviceTimeLabel(guest.serviceTime)}` : ""}
                  </p>
                  {(guest.email || guest.phone) && (
                    <p className="mt-1 text-sm text-night-600">
                      {guest.email}
                      {guest.email && guest.phone ? " · " : ""}
                      {guest.phone}
                    </p>
                  )}
                  {guest.notes && (
                    <p className="mt-2 whitespace-pre-wrap text-sm text-night-700">{guest.notes}</p>
                  )}
                  <p className="mt-2 text-xs text-night-500">
                    Submitted {new Date(guest.submittedAt).toLocaleString()}
                  </p>
                </div>
                <span
                  className={`rounded-full px-3 py-1 text-xs font-semibold ${
                    guest.status === "new"
                      ? "bg-amber-100 text-amber-800"
                      : guest.status === "contacted"
                        ? "bg-emerald-100 text-emerald-800"
                        : "bg-sand-100 text-night-600"
                  }`}
                >
                  {guestStatusLabel(guest.status)}
                </span>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                {guest.status !== "contacted" && (
                  <Button variant="secondary" onClick={() => updateStatus(guest.id, "contacted")}>
                    Mark contacted
                  </Button>
                )}
                {guest.status !== "archived" && (
                  <Button variant="secondary" onClick={() => updateStatus(guest.id, "archived")}>
                    Archive
                  </Button>
                )}
                {guest.status !== "new" && (
                  <Button variant="secondary" onClick={() => updateStatus(guest.id, "new")}>
                    Move back to new
                  </Button>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      {message && (
        <p className="rounded-xl bg-sand-100 px-4 py-3 text-sm text-night-700">{message}</p>
      )}
    </div>
  );
}
