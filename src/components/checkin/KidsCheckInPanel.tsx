"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import type { KidCheckIn } from "@/lib/member-types";
import { KidCheckInLabel, printKidCheckInLabel } from "@/components/checkin/KidCheckInLabel";
import { Button, Card } from "@/components/ui";

const ageGroups = ["Nursery (0-2)", "Preschool (3-5)", "Elementary (6-11)", "Youth (12+)"];
const services = ["Friday Evening", "Sunday Morning"];

export function KidsCheckInPanel() {
  const { user } = useAuth();
  const [parentName, setParentName] = useState("");
  const [childName, setChildName] = useState("");
  const [ageGroup, setAgeGroup] = useState(ageGroups[0]);
  const [service, setService] = useState(services[1]);
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [active, setActive] = useState<KidCheckIn[]>([]);
  const [lastLabel, setLastLabel] = useState<KidCheckIn | null>(null);

  async function loadActive() {
    const response = await fetch("/api/checkin/kids");
    const data = await response.json();
    setActive(
      data.checkins
        .filter((entry: KidCheckIn) => !entry.checkedOutAt)
        .slice(0, 10),
    );
  }

  useEffect(() => {
    if (user) {
      setParentName(user.name);
    }
  }, [user]);

  useEffect(() => {
    loadActive();
  }, []);

  async function checkIn() {
    setLoading(true);
    setMessage(null);
    setError(null);

    const response = await fetch("/api/checkin/kids", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ parentName, childName, ageGroup, service, notes }),
    });
    const data = await response.json();
    setLoading(false);

    if (!response.ok) {
      setError(data.error ?? "Check-in failed.");
      return;
    }

    setLastLabel(data.checkin);
    setMessage(`${childName} checked in. Print the label below and attach it for pickup.`);
    setChildName("");
    setNotes("");
    loadActive();

    window.setTimeout(() => printKidCheckInLabel(data.checkin), 300);
  }

  async function checkOut(id: string) {
    await fetch("/api/checkin/kids", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "checkout", id }),
    });
    if (lastLabel?.id === id) {
      setLastLabel(null);
    }
    loadActive();
  }

  return (
    <div className="space-y-6">
      <Card>
        <h2 className="font-display text-xl font-semibold text-night-900">
          Kids check-in
        </h2>
        <p className="mt-2 text-sm text-night-600">
          Check your child in for Friday or Sunday service. A printable label with a
          security code is generated for pickup.
        </p>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <input
            value={parentName}
            onChange={(event) => setParentName(event.target.value)}
            placeholder="Parent / guardian name"
            className="rounded-xl border border-night-900/10 bg-sand-50 px-3 py-2.5 text-sm outline-none ring-night-900/5 focus:ring-2"
          />
          <input
            value={childName}
            onChange={(event) => setChildName(event.target.value)}
            placeholder="Child's name"
            className="rounded-xl border border-night-900/10 bg-sand-50 px-3 py-2.5 text-sm outline-none ring-night-900/5 focus:ring-2"
          />
          <select
            value={ageGroup}
            onChange={(event) => setAgeGroup(event.target.value)}
            className="rounded-xl border border-night-900/10 bg-sand-50 px-3 py-2.5 text-sm outline-none ring-night-900/5 focus:ring-2"
          >
            {ageGroups.map((group) => (
              <option key={group} value={group}>
                {group}
              </option>
            ))}
          </select>
          <select
            value={service}
            onChange={(event) => setService(event.target.value)}
            className="rounded-xl border border-night-900/10 bg-sand-50 px-3 py-2.5 text-sm outline-none ring-night-900/5 focus:ring-2"
          >
            {services.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </div>

        <textarea
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
          placeholder="Allergies or notes (optional)"
          className="mt-3 w-full rounded-xl border border-night-900/10 bg-sand-50 p-3 text-sm outline-none ring-night-900/5 focus:ring-2"
          rows={2}
        />

        {error && (
          <p className="mt-3 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
        )}
        {message && (
          <p className="mt-3 rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            {message}
          </p>
        )}

        <Button className="mt-4" onClick={checkIn} disabled={loading || !parentName.trim() || !childName.trim()}>
          {loading ? "Checking in..." : "Check in & print label"}
        </Button>
      </Card>

      {lastLabel && (
        <Card>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="font-display text-lg font-semibold text-night-900">
                Check-in label
              </h3>
              <p className="text-sm text-night-600">
                Print and attach this label for {lastLabel.childName}.
              </p>
            </div>
            <Button variant="secondary" onClick={() => printKidCheckInLabel(lastLabel)}>
              Print label
            </Button>
          </div>
          <KidCheckInLabel checkIn={lastLabel} />
        </Card>
      )}

      <Card>
        <h3 className="font-semibold text-night-900">Currently checked in</h3>
        {active.length === 0 ? (
          <p className="mt-3 text-sm text-night-500">No active check-ins right now.</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {active.map((entry) => (
              <li
                key={entry.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-sand-50 px-3 py-2 text-sm"
              >
                <div>
                  <p className="font-medium text-night-900">{entry.childName}</p>
                  <p className="text-night-500">
                    {entry.ageGroup} · {entry.service} · Code {entry.securityCode ?? "----"}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="secondary"
                    onClick={() => {
                      setLastLabel(entry);
                      printKidCheckInLabel(entry);
                    }}
                  >
                    Reprint
                  </Button>
                  <Button variant="secondary" onClick={() => checkOut(entry.id)}>
                    Check out
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
