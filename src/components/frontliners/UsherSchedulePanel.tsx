"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/components/auth/AuthProvider";
import { Button, Card } from "@/components/ui";
import {
  nextServiceSundayIso,
  serviceDateTimeLabel,
  usherRoleLabel,
  USHER_ROLES,
  USHER_SERVICE_TIMES,
  type UsherAssignment,
  type UsherRole,
  type UsherSchedule,
} from "@/lib/frontliners-types";

type RosterMember = { id: string; name: string };

export function UsherSchedulePanel({
  initialDate,
  initialTime,
}: {
  initialDate?: string;
  initialTime?: string;
} = {}) {
  const { permissions } = useAuth();
  const canManage = permissions.canManageFrontLiners;
  const [serviceDate, setServiceDate] = useState(initialDate || nextServiceSundayIso());
  const [serviceTime, setServiceTime] = useState(initialTime || "10:00");
  const [schedule, setSchedule] = useState<UsherSchedule | null>(null);
  const [ushers, setUshers] = useState<UsherAssignment[]>([]);
  const [notes, setNotes] = useState("");
  const [status, setStatus] = useState<UsherSchedule["status"]>("draft");
  const [roster, setRoster] = useState<RosterMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [copying, setCopying] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [hidden, setHidden] = useState(false);

  async function loadSchedule() {
    setLoading(true);
    const response = await fetch(
      `/api/frontliners/schedule?serviceDate=${encodeURIComponent(serviceDate)}&serviceTime=${encodeURIComponent(serviceTime)}`,
    );
    const data = await response.json();
    setLoading(false);

    if (!response.ok) {
      setMessage(data.error ?? "Could not load usher schedule.");
      return;
    }

    setHidden(Boolean(data.hidden));
    if (data.schedule) {
      setSchedule(data.schedule);
      setUshers(data.schedule.ushers);
      setNotes(data.schedule.notes ?? "");
      setStatus(data.schedule.status);
    } else {
      setSchedule(null);
      setUshers([]);
      setNotes("");
      setStatus("draft");
    }
    setMessage(null);
  }

  async function loadRoster() {
    if (!canManage) return;
    const response = await fetch("/api/frontliners/schedule?roster=1");
    const data = await response.json();
    if (response.ok) {
      setRoster(data.members ?? []);
    }
  }

  useEffect(() => {
    loadSchedule();
    loadRoster();
  }, []);

  useEffect(() => {
    loadSchedule();
  }, [serviceDate, serviceTime]);

  async function saveSchedule(action: "save" | "publish" | "unpublish" | "delete") {
    setMessage(null);
    const response = await fetch("/api/frontliners/schedule", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action,
        serviceDate,
        serviceTime,
        ushers,
        notes,
        status,
      }),
    });
    const data = await response.json();

    if (response.ok) {
      if (action === "delete") {
        setMessage("Schedule deleted.");
      } else if (action === "publish") {
        setMessage("Schedule published for the team.");
      } else if (action === "unpublish") {
        setMessage("Schedule moved back to draft.");
      } else {
        setMessage("Schedule saved.");
      }
      loadSchedule();
      return;
    }

    setMessage(data.error ?? "Could not save usher schedule.");
  }

  async function copyFromLastSunday() {
    if (ushers.length > 0) {
      const confirmed = window.confirm(
        "Replace the current roster with ushers from the previous Sunday?",
      );
      if (!confirmed) return;
    }

    setCopying(true);
    const response = await fetch("/api/frontliners/schedule", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "copy_from_previous",
        serviceDate,
        serviceTime,
      }),
    });
    const data = await response.json();
    setCopying(false);

    if (response.ok) {
      setMessage(
        data.copiedFrom
          ? `Copied roster from ${data.copiedFrom}. Review and save when ready.`
          : "Copied from previous Sunday.",
      );
      loadSchedule();
      return;
    }

    setMessage(data.error ?? "Could not copy from previous Sunday.");
  }

  function addUsher(memberId: string, role: UsherRole) {
    const member = roster.find((entry) => entry.id === memberId);
    if (!member || ushers.some((entry) => entry.userId === memberId)) return;
    setUshers((current) => [
      ...current,
      { userId: member.id, name: member.name, role, ready: false },
    ]);
  }

  function removeUsher(userId: string) {
    setUshers((current) => current.filter((usher) => usher.userId !== userId));
  }

  if (loading) {
    return <p className="text-sm text-night-500">Loading usher schedule…</p>;
  }

  if (hidden) {
    return (
      <Card>
        <h2 className="font-display text-xl font-semibold text-night-900">Schedule not published</h2>
        <p className="mt-2 text-sm text-night-600">
          Your FrontLiners leader has not published this Sunday&apos;s usher schedule yet.
        </p>
      </Card>
    );
  }

  const showEditor = canManage;

  return (
    <div className="space-y-6">
      <Card className="overflow-hidden p-0 ring-1 ring-night-900/10">
        <div className="bg-gradient-to-br from-emerald-700 to-teal-900 px-6 py-5 text-white">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-200">
            FrontLiners
          </p>
          <h2 className="mt-1 font-display text-2xl font-semibold">Usher schedule</h2>
          <p className="mt-2 text-sm text-emerald-100/90">
            Who is serving at the door each Sunday.
          </p>
        </div>

        <div className="space-y-4 p-6">
          <div className="flex flex-wrap items-end gap-3">
            <label className="text-sm text-night-700">
              <span className="font-semibold">Service date</span>
              <input
                type="date"
                value={serviceDate}
                onChange={(event) => setServiceDate(event.target.value)}
                disabled={!showEditor}
                className="mt-1 block rounded-xl border border-night-900/10 bg-sand-50 px-3 py-2.5 text-sm outline-none ring-night-900/5 focus:ring-2 disabled:opacity-70"
              />
            </label>
            <div>
              <p className="text-sm font-semibold text-night-700">Service time</p>
              <div className="mt-1 flex flex-wrap gap-2">
                {USHER_SERVICE_TIMES.map((slot) => (
                  <button
                    key={slot.value}
                    type="button"
                    onClick={() => setServiceTime(slot.value)}
                    className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                      serviceTime === slot.value
                        ? "bg-night-900 text-sand-50"
                        : "bg-sand-100 text-night-700 hover:bg-sand-200"
                    }`}
                  >
                    {slot.label}
                  </button>
                ))}
              </div>
            </div>
            <p className="text-sm text-night-600">
              {serviceDateTimeLabel(serviceDate, serviceTime)}
            </p>
            {showEditor && (
              <Button variant="secondary" onClick={copyFromLastSunday} disabled={copying}>
                {copying ? "Copying…" : "Copy from last Sunday"}
              </Button>
            )}
            {status === "published" ? (
              <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-800">
                Published
              </span>
            ) : (
              <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-800">
                Draft
              </span>
            )}
          </div>
        </div>
      </Card>

      <Card>
        <h3 className="font-display text-lg font-semibold text-night-900">Team roster</h3>
        {showEditor && (
          <div className="mt-4">
            <select
              defaultValue=""
              className="rounded-xl border border-night-900/10 bg-white px-3 py-2.5 text-sm"
              onChange={(event) => {
                const memberId = event.target.value;
                if (!memberId) return;
                addUsher(memberId, "usher");
                event.currentTarget.value = "";
              }}
            >
              <option value="">Add FrontLiners member…</option>
              {roster
                .filter((member) => !ushers.some((entry) => entry.userId === member.id))
                .map((member) => (
                  <option key={member.id} value={member.id}>
                    {member.name}
                  </option>
                ))}
            </select>
          </div>
        )}

        <div className="mt-4 space-y-2">
          {ushers.length === 0 ? (
            <p className="text-sm text-night-500">No ushers assigned yet.</p>
          ) : (
            ushers.map((usher) => (
              <div
                key={usher.userId}
                className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-sand-50 px-4 py-3"
              >
                <div>
                  <p className="font-semibold text-night-900">{usher.name}</p>
                  {showEditor ? (
                    <select
                      value={usher.role}
                      onChange={(event) =>
                        setUshers((current) =>
                          current.map((entry) =>
                            entry.userId === usher.userId
                              ? { ...entry, role: event.target.value as UsherRole }
                              : entry,
                          ),
                        )
                      }
                      className="mt-1 rounded-lg border border-night-900/10 bg-white px-2 py-1 text-xs"
                    >
                      {USHER_ROLES.map((role) => (
                        <option key={role.value} value={role.value}>
                          {role.label}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <p className="text-xs text-night-500">{usherRoleLabel(usher.role)}</p>
                  )}
                </div>
                {showEditor && (
                  <Button variant="secondary" onClick={() => removeUsher(usher.userId)}>
                    Remove
                  </Button>
                )}
              </div>
            ))
          )}
        </div>
      </Card>

      {(showEditor || notes) && (
        <Card>
          {showEditor ? (
            <>
              <label className="block text-sm font-semibold text-night-700">
                Notes
                <textarea
                  value={notes}
                  onChange={(event) => setNotes(event.target.value)}
                  rows={3}
                  placeholder="Arrival time, special instructions, greeter stations…"
                  className="mt-2 w-full rounded-xl border border-night-900/10 bg-sand-50 p-3 text-sm outline-none ring-night-900/5 focus:ring-2"
                />
              </label>
              <div className="mt-4 flex flex-wrap gap-2">
                <Button onClick={() => saveSchedule("save")}>Save draft</Button>
                <Button variant="secondary" onClick={() => saveSchedule("publish")}>
                  Publish for team
                </Button>
                {schedule && status === "published" && (
                  <Button variant="secondary" onClick={() => saveSchedule("unpublish")}>
                    Unpublish
                  </Button>
                )}
                {schedule && (
                  <Button variant="secondary" onClick={() => saveSchedule("delete")}>
                    Delete
                  </Button>
                )}
              </div>
            </>
          ) : (
            <>
              <h3 className="font-display text-lg font-semibold text-night-900">Notes</h3>
              <p className="mt-3 whitespace-pre-wrap text-sm text-night-700">{notes}</p>
            </>
          )}
        </Card>
      )}

      <p className="text-sm text-night-500">
        Need access? Join{" "}
        <Link href="/groups" className="font-semibold text-night-800 underline">
          FrontLiners
        </Link>{" "}
        under Groups. Leaders are set by group admins.
      </p>

      {message && (
        <p className="rounded-xl bg-sand-100 px-4 py-3 text-sm text-night-700">{message}</p>
      )}
    </div>
  );
}
