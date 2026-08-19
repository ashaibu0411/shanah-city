"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { site } from "@/lib/site";
import type { VolunteerCheckIn } from "@/lib/member-types";
import { formatDenverTime, isDenverSunday } from "@/lib/denver-time";
import {
  todaysVolunteerArrivals,
  VOLUNTEER_MINISTRIES,
} from "@/lib/volunteer-checkin";
import { Button, Card } from "@/components/ui";

type DirectoryMember = { id: string; name: string };

export function VolunteerCheckInPanel() {
  const { user } = useAuth();
  const [name, setName] = useState("");
  const [memberId, setMemberId] = useState("");
  const [ministry, setMinistry] = useState("");
  const [members, setMembers] = useState<DirectoryMember[]>([]);
  const [nameOpen, setNameOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [denied, setDenied] = useState<{ distanceMeters?: number } | null>(null);
  const [checkins, setCheckins] = useState<VolunteerCheckIn[]>([]);
  const nameBoxRef = useRef<HTMLDivElement>(null);
  const sunday = isDenverSunday();
  const todaysArrivals = useMemo(
    () => todaysVolunteerArrivals(checkins),
    [checkins],
  );
  const alreadyHere = todaysArrivals.find(
    (entry) => entry.name.trim().toLowerCase() === name.trim().toLowerCase(),
  );
  const matchingNames = useMemo(() => {
    const query = name.trim().toLowerCase();
    const list = members.filter((member) =>
      query ? member.name.toLowerCase().includes(query) : true,
    );
    return list.slice(0, 8);
  }, [members, name]);

  async function loadRecent() {
    const response = await fetch("/api/checkin/volunteer");
    const data = await response.json();
    setCheckins(data.checkins ?? []);
    setMembers(data.members ?? []);
  }

  useEffect(() => {
    if (user) {
      setName(user.name);
      setMemberId(user.id);
    }
  }, [user]);

  useEffect(() => {
    loadRecent();
  }, []);

  useEffect(() => {
    function onPointerDown(event: MouseEvent) {
      if (!nameBoxRef.current?.contains(event.target as Node)) {
        setNameOpen(false);
      }
    }
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, []);

  function selectMember(member: DirectoryMember) {
    setName(member.name);
    setMemberId(member.id);
    setNameOpen(false);
  }

  async function reportArrival() {
    setLoading(true);
    setMessage(null);
    setError(null);
    setDenied(null);

    if (!name.trim() || !ministry.trim()) {
      setError("Select your name and ministry before reporting.");
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
            memberId,
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
              "Arrival not recorded. You must be at the church to report.",
          );
          return;
        }

        if (!response.ok) {
          setError(data.error ?? "Could not record your arrival.");
          return;
        }

        const time = formatDenverTime(data.checkin.checkedInAt);
        setMessage(
          data.alreadyReported
            ? `You're already on today's list. Arrival time: ${time}.`
            : `Reported at ${time}. You're on today's Sunday list — no checkout needed.`,
        );
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
          Sunday arrival
        </h2>
        <p className="mt-2 text-sm text-night-600">
          FrontLiners report when they arrive at{" "}
          <span className="font-medium">{site.address}</span>. We only save your
          arrival time so the team knows who reported. There is no checkout.
        </p>

        <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          {sunday
            ? "You must be at the church to report. Arrival only — do not check out later."
            : "This list is for Sunday service. If you are serving today, you can still report your arrival at the church."}
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <label className="block">
            <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-night-500">
              Name
            </span>
            <div className="relative" ref={nameBoxRef}>
              <input
                value={name}
                onChange={(event) => {
                  const value = event.target.value;
                  setName(value);
                  const match = members.find(
                    (member) => member.name.toLowerCase() === value.trim().toLowerCase(),
                  );
                  setMemberId(match?.id ?? "");
                  setNameOpen(true);
                }}
                onFocus={() => setNameOpen(true)}
                placeholder="Start typing your name"
                autoComplete="off"
                autoCorrect="off"
                className="w-full rounded-xl border border-night-900/10 bg-sand-50 px-3 py-2.5 text-sm outline-none ring-night-900/5 focus:ring-2"
              />
              {nameOpen && matchingNames.length > 0 && (
                <ul className="absolute z-10 mt-2 max-h-56 w-full overflow-y-auto rounded-xl border border-night-900/10 bg-white py-1 shadow-lg">
                  {matchingNames.map((member) => (
                    <li key={member.id}>
                      <button
                        type="button"
                        onClick={() => selectMember(member)}
                        className="flex w-full px-3 py-2.5 text-left text-sm font-medium text-night-900 hover:bg-sand-50"
                      >
                        {member.name}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-night-500">
              Ministry
            </span>
            <select
              value={ministry}
              onChange={(event) => setMinistry(event.target.value)}
              className="w-full rounded-xl border border-night-900/10 bg-sand-50 px-3 py-2.5 text-sm outline-none ring-night-900/5 focus:ring-2"
            >
              <option value="">Select ministry</option>
              {VOLUNTEER_MINISTRIES.map((team) => (
                <option key={team} value={team}>
                  {team}
                </option>
              ))}
            </select>
          </label>
        </div>

        {denied && (
          <div className="mt-3 rounded-xl border border-red-200 bg-red-50 px-4 py-4 text-sm text-red-800">
            <p className="font-semibold">Not recorded — not at church</p>
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
        {!message && alreadyHere && (
          <p className="mt-3 rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            You reported at {formatDenverTime(alreadyHere.checkedInAt)}. No checkout needed.
          </p>
        )}

        <Button className="mt-4" onClick={reportArrival} disabled={loading || Boolean(alreadyHere)}>
          {loading
            ? "Checking location..."
            : alreadyHere
              ? "Already reported today"
              : "I'm here"}
        </Button>
      </Card>

      <Card>
        <h3 className="font-semibold text-night-900">Today&apos;s arrivals</h3>
        <p className="mt-1 text-sm text-night-500">
          Arrival times only. FrontLiners do not check out.
        </p>
        {todaysArrivals.length === 0 ? (
          <p className="mt-3 text-sm text-night-500">No FrontLiners have reported yet today.</p>
        ) : (
          <ul className="mt-3 space-y-2 text-sm text-night-600">
            {todaysArrivals.map((entry) => (
              <li
                key={entry.id}
                className="flex justify-between gap-3 rounded-lg bg-sand-50 px-3 py-2"
              >
                <span>
                  {entry.name} · {entry.ministry}
                </span>
                <span className="font-medium text-night-800">
                  {formatDenverTime(entry.checkedInAt)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
