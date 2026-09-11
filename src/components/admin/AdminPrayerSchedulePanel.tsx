"use client";

import { useEffect, useState } from "react";
import { RotationPoolEditor } from "@/components/admin/RotationPoolEditor";
import { Button, Card } from "@/components/ui";
import {
  formatPrayerAssignmentDate,
  SCHEDULE_SLOT_GROUPS,
  SCHEDULE_SLOT_META,
  type PrayerRotationPoolMember,
  type PrayerScheduleRotationConfig,
  type ScheduleSlotType,
} from "@/lib/prayer-schedule-types";

type Assignment = {
  assignmentDate: string;
  userId: string;
  userName: string;
  status: string;
};

export function AdminPrayerSchedulePanel() {
  const [slotType, setSlotType] = useState<ScheduleSlotType>("morning");
  const [config, setConfig] = useState<PrayerScheduleRotationConfig | null>(null);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [pool, setPool] = useState<PrayerRotationPoolMember[]>([]);
  const [weeksAhead, setWeeksAhead] = useState(8);
  const [skipDatesText, setSkipDatesText] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [approving, setApproving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function load(nextSlot = slotType) {
    setLoading(true);
    const response = await fetch(`/api/admin/prayer-schedule?slot=${nextSlot}`);
    const data = await response.json();
    setLoading(false);

    if (!response.ok) {
      setMessage(data.error ?? "Could not load schedule rotation.");
      return;
    }

    setConfig(data.config);
    setAssignments(data.assignments ?? []);
    setPool(data.config.pool ?? []);
    setWeeksAhead(data.config.weeksAhead ?? 8);
    setSkipDatesText((data.config.skipDates ?? []).join("\n"));
  }

  useEffect(() => {
    load(slotType);
  }, [slotType]);

  async function saveConfig() {
    setSaving(true);
    setMessage(null);
    const skipDates = skipDatesText
      .split(/\n|,/)
      .map((entry) => entry.trim())
      .filter(Boolean);

    const response = await fetch("/api/admin/prayer-schedule", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "save_config",
        slotType,
        pool,
        weeksAhead,
        skipDates,
      }),
    });
    const data = await response.json();
    setSaving(false);

    if (response.ok) {
      setConfig(data.config);
      setMessage("Rotation settings saved.");
      load();
      return;
    }

    setMessage(data.error ?? "Could not save settings.");
  }

  async function generateSchedule(overwrite = false) {
    if (pool.length === 0) {
      setMessage("Add at least one member to the rotation pool first.");
      return;
    }

    setGenerating(true);
    setMessage(null);
    const response = await fetch("/api/admin/prayer-schedule", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "generate",
        slotType,
        weeksAhead,
        overwrite,
      }),
    });
    const data = await response.json();
    setGenerating(false);

    if (response.ok) {
      setMessage(
        `Created or updated ${data.createdCount} assignment${data.createdCount === 1 ? "" : "s"}.${
          data.skippedDates?.length
            ? ` Skipped ${data.skippedDates.length} dates that already had assignments.`
            : ""
        }`,
      );
      load();
      return;
    }

    setMessage(data.error ?? "Could not generate schedule.");
  }

  async function approveSchedule() {
    if (assignments.length === 0) {
      setMessage("Generate a schedule before approving it.");
      return;
    }

    const confirmed = window.confirm(
      `Approve and send this ${SCHEDULE_SLOT_META[slotType].label} schedule to everyone on the rotation list?`,
    );
    if (!confirmed) return;

    setApproving(true);
    setMessage(null);
    const response = await fetch("/api/admin/prayer-schedule", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "approve", slotType }),
    });
    const data = await response.json();
    setApproving(false);

    if (response.ok) {
      setMessage(
        `Schedule approved. Sent to ${data.notify?.leaderSent ?? 0} assigned member${
          (data.notify?.leaderSent ?? 0) === 1 ? "" : "s"
        } and ${data.notify?.groupSent ?? 0} group notification${
          (data.notify?.groupSent ?? 0) === 1 ? "" : "s"
        }.`,
      );
      load();
      return;
    }

    setMessage(data.error ?? "Could not approve schedule.");
  }

  if (loading && !config) {
    return <p className="text-sm text-night-500">Loading schedule rotations…</p>;
  }

  return (
    <div className="space-y-6">
      {SCHEDULE_SLOT_GROUPS.map((group) => (
        <div key={group.id}>
          <p className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-night-500">
            {group.label}
          </p>
          <div className="flex flex-wrap gap-2">
            {group.slots.map((slot) => (
              <button
                key={slot}
                type="button"
                onClick={() => setSlotType(slot)}
                className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                  slotType === slot
                    ? "bg-night-900 text-sand-50"
                    : "bg-sand-100 text-night-700 hover:bg-sand-200"
                }`}
              >
                {SCHEDULE_SLOT_META[slot].label}
              </button>
            ))}
          </div>
        </div>
      ))}

      <Card>
        <h3 className="font-display text-lg font-semibold text-night-900">
          {SCHEDULE_SLOT_META[slotType].label} rotation
        </h3>
        <p className="mt-2 text-sm text-night-600">
          Build a leader rotation for {SCHEDULE_SLOT_META[slotType].whenLabel}. Add only the people
          who should be in this pool, generate the schedule, then approve and send it through the
          app.
        </p>

        {config?.status === "published" && (
          <p className="mt-3 rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
            Published schedule is live in the app.
            {config.scheduleNotifiedAt
              ? ` Last sent ${new Date(config.scheduleNotifiedAt).toLocaleString()}.`
              : ""}
          </p>
        )}

        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <label className="text-sm text-night-700">
            <span className="font-semibold">Weeks ahead to generate</span>
            <input
              type="number"
              min={1}
              max={26}
              value={weeksAhead}
              onChange={(event) => setWeeksAhead(Number(event.target.value) || 8)}
              className="mt-1 block w-full rounded-xl border border-night-900/10 bg-white px-3 py-2.5 text-sm"
            />
          </label>
          <label className="text-sm text-night-700 md:col-span-2">
            <span className="font-semibold">Skip dates (one per line)</span>
            <textarea
              value={skipDatesText}
              onChange={(event) => setSkipDatesText(event.target.value)}
              rows={3}
              placeholder="2026-12-25"
              className="mt-1 block w-full rounded-xl border border-night-900/10 bg-white px-3 py-2.5 text-sm"
            />
          </label>
        </div>

        <RotationPoolEditor pool={pool} onChange={setPool} />

        <div className="mt-4 flex flex-wrap gap-2">
          <Button onClick={saveConfig} disabled={saving}>
            {saving ? "Saving…" : "Save rotation settings"}
          </Button>
          <Button variant="secondary" onClick={() => generateSchedule(false)} disabled={generating}>
            {generating ? "Generating…" : "Generate schedule"}
          </Button>
          <Button variant="secondary" onClick={() => generateSchedule(true)} disabled={generating}>
            Overwrite & regenerate
          </Button>
          <Button onClick={approveSchedule} disabled={approving || assignments.length === 0}>
            {approving ? "Sending…" : "Approve & send to members"}
          </Button>
        </div>
      </Card>

      {assignments.length > 0 && (
        <Card>
          <h3 className="font-display text-lg font-semibold text-night-900">Upcoming assignments</h3>
          <ul className="mt-4 space-y-2 text-sm">
            {assignments.map((entry) => (
              <li
                key={entry.assignmentDate}
                className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-night-900/5 px-4 py-3"
              >
                <div>
                  <p className="font-semibold text-night-900">
                    {formatPrayerAssignmentDate(entry.assignmentDate)}
                  </p>
                  <p className="text-xs text-night-500">
                    {entry.userName} · {entry.status}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </Card>
      )}

      {message && <p className="text-sm text-night-700">{message}</p>}
    </div>
  );
}
