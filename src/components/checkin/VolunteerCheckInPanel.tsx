"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { site } from "@/lib/site";
import type { VolunteerCheckIn } from "@/lib/member-types";
import { Button, Card } from "@/components/ui";

export function VolunteerCheckInPanel() {
  const { user } = useAuth();
  const [name, setName] = useState("");
  const [ministry, setMinistry] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [denied, setDenied] = useState<{ distanceMeters?: number } | null>(null);
  const [recent, setRecent] = useState<VolunteerCheckIn[]>([]);

  async function loadRecent() {
    const response = await fetch("/api/checkin/volunteer");
    const data = await response.json();
    setRecent(data.checkins.slice(0, 5));
  }

  useEffect(() => {
    if (user) {
      setName(user.name);
    }
  }, [user]);

  useEffect(() => {
    loadRecent();
  }, []);

  async function clockIn() {
    setLoading(true);
    setMessage(null);
    setError(null);
    setDenied(null);

    if (!name.trim() || !ministry.trim()) {
      setError("Enter your name and ministry before clocking in.");
      setLoading(false);
      return;
    }

    if (!navigator.geolocation) {
      setError("Location is not supported on this device.");
      setLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const response = await fetch("/api/checkin/volunteer", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name,
            ministry,
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          }),
        });
        const data = await response.json();
        setLoading(false);

        if (response.status === 403) {
          setDenied({ distanceMeters: data.distanceMeters });
          setError(
            data.error ??
              "Check-in denied. You must be at the church to volunteer clock-in.",
          );
          return;
        }

        if (!response.ok) {
          setError(data.error ?? "Clock-in failed.");
          return;
        }

        setMessage(
          `Clocked in at ${new Date(data.checkin.checkedInAt).toLocaleTimeString()} — welcome, ${data.checkin.name}!`,
        );
        setName("");
        setMinistry("");
        loadRecent();
      },
      () => {
        setLoading(false);
        setError("Allow location access to verify you are at the church.");
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <h2 className="font-display text-xl font-semibold text-night-900">
          Volunteer clock-in
        </h2>
        <p className="mt-2 text-sm text-night-600">
          Clock in when you arrive at{" "}
          <span className="font-medium">{site.address}</span>. Check-in is{" "}
          <strong>denied automatically</strong> if you are more than{" "}
          {site.coordinates.radiusMeters} meters away.
        </p>

        <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          Proximity required — volunteers cannot clock in from home or off-site.
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Your name"
            className="rounded-xl border border-night-900/10 bg-sand-50 px-3 py-2.5 text-sm outline-none ring-night-900/5 focus:ring-2"
          />
          <input
            value={ministry}
            onChange={(event) => setMinistry(event.target.value)}
            placeholder="Ministry (Ushering, Media, etc.)"
            className="rounded-xl border border-night-900/10 bg-sand-50 px-3 py-2.5 text-sm outline-none ring-night-900/5 focus:ring-2"
          />
        </div>

        {denied && (
          <div className="mt-3 rounded-xl border border-red-200 bg-red-50 px-4 py-4 text-sm text-red-800">
            <p className="font-semibold">Check-in denied — not at church</p>
            <p className="mt-1">
              {typeof denied.distanceMeters === "number"
                ? `You are about ${denied.distanceMeters} meters from ${site.address}. Move closer and try again.`
                : "Your location is outside the allowed church area."}
            </p>
          </div>
        )}

        {error && !denied && (
          <p className="mt-3 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
        )}
        {message && (
          <p className="mt-3 rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            {message}
          </p>
        )}

        <Button className="mt-4" onClick={clockIn} disabled={loading}>
          {loading ? "Checking location..." : "Clock in at church"}
        </Button>
      </Card>

      {recent.length > 0 && (
        <Card>
          <h3 className="font-semibold text-night-900">Recent volunteer arrivals</h3>
          <ul className="mt-3 space-y-2 text-sm text-night-600">
            {recent.map((entry) => (
              <li key={entry.id} className="flex justify-between gap-3 rounded-lg bg-sand-50 px-3 py-2">
                <span>
                  {entry.name} · {entry.ministry}
                </span>
                <span>{new Date(entry.checkedInAt).toLocaleString()}</span>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}
