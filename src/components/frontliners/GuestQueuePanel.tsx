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

export function GuestQueuePanel() {
  const { permissions } = useAuth();
  const [guests, setGuests] = useState<GuestSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);
  const [filter, setFilter] = useState<GuestSubmissionStatus | "all">("new");

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
    if (permissions.canManageFrontLiners) {
      loadGuests();
    }
  }, [permissions.canManageFrontLiners]);

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

  if (!permissions.canManageFrontLiners) {
    return (
      <Card>
        <p className="text-sm text-night-600">
          Guest follow-up is managed by FrontLiners group leaders.
        </p>
      </Card>
    );
  }

  const filtered =
    filter === "all" ? guests : guests.filter((guest) => guest.status === filter);

  return (
    <div className="space-y-6">
      <Card className="overflow-hidden p-0 ring-1 ring-night-900/10">
        <div className="bg-gradient-to-br from-emerald-700 to-teal-900 px-6 py-5 text-white">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-200">
            Guest follow-up
          </p>
          <h2 className="mt-1 font-display text-2xl font-semibold">Guest queue</h2>
          <p className="mt-2 text-sm text-emerald-100/90">
            Visitors submit at{" "}
            <a href="/guest" className="font-semibold underline" target="_blank" rel="noreferrer">
              /guest
            </a>{" "}
            — no account needed. Share that link or QR code at the door.
          </p>
        </div>
      </Card>

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
