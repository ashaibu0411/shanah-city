"use client";

import { useEffect, useState } from "react";
import { RotationPoolEditor } from "@/components/admin/RotationPoolEditor";
import { Button, Card } from "@/components/ui";
import {
  WORSHIP_SERVICE_TIMES,
  serviceDateTimeLabel,
  type WorshipRotationPoolMember,
  type WorshipScheduleRotationConfig,
} from "@/lib/worship-types";

type Assignment = {
  serviceDate: string;
  serviceTime: string;
  status: string;
  leader?: { userId: string; name: string; role: string };
  uploadDutyUserId?: string | null;
  uploadDutyUserName?: string | null;
};

export function WorshipSchedulePanel({
  onOpenService,
  readOnly = false,
}: {
  onOpenService?: (serviceDate: string, serviceTime: string) => void;
  readOnly?: boolean;
}) {
  const [config, setConfig] = useState<WorshipScheduleRotationConfig | null>(null);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [pool, setPool] = useState<WorshipRotationPoolMember[]>([]);
  const [serviceTime, setServiceTime] = useState("10:00");
  const [serviceKind, setServiceKind] = useState<"sunday" | "friday">("sunday");
  const [weeksAhead, setWeeksAhead] = useState(8);
  const [uploadDutyLeadDays, setUploadDutyLeadDays] = useState(4);
  const [skipDatesText, setSkipDatesText] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [approving, setApproving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    const response = await fetch("/api/worship/schedule");
    const data = await response.json();
    setLoading(false);

    if (!response.ok) {
      setMessage(data.error ?? "Could not load schedule settings.");
      return;
    }

    setConfig(data.config);
    setAssignments(data.assignments ?? []);
    setPool(data.config.pool ?? []);
    setServiceTime(data.config.serviceTime ?? "10:00");
    setServiceKind(data.config.serviceKind ?? "sunday");
    setWeeksAhead(data.config.weeksAhead ?? 8);
    setUploadDutyLeadDays(data.config.uploadDutyLeadDays ?? 4);
    setSkipDatesText((data.config.skipDates ?? []).join("\n"));
  }

  useEffect(() => {
    load();
  }, []);

  async function saveConfig() {
    setSaving(true);
    setMessage(null);
    const skipDates = skipDatesText
      .split(/\n|,/)
      .map((entry) => entry.trim())
      .filter(Boolean);

    const response = await fetch("/api/worship/schedule", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "save_config",
        pool,
        serviceTime,
        serviceKind,
        weeksAhead,
        uploadDutyLeadDays,
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
      setMessage("Add at least one worship leader to the rotation pool first.");
      return;
    }

    if (!overwrite && assignments.some((entry) => entry.leader)) {
      const confirmed = window.confirm(
        "Some dates already have leaders assigned. Generate only empty slots, or cancel and choose overwrite?",
      );
      if (!confirmed) return;
    }

    setGenerating(true);
    setMessage(null);
    const response = await fetch("/api/worship/schedule", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "generate",
        weeksAhead,
        overwrite,
      }),
    });
    const data = await response.json();
    setGenerating(false);

    if (response.ok) {
      setMessage(
        `Created or updated ${data.createdCount} service plan${data.createdCount === 1 ? "" : "s"}.${
          data.skippedDates?.length
            ? ` Skipped ${data.skippedDates.length} dates that already had plans.`
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
      "Approve this worship leader rotation and send it to everyone in Shanah Worship (Choir)?",
    );
    if (!confirmed) return;

    setApproving(true);
    setMessage(null);
    const response = await fetch("/api/worship/schedule", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "approve" }),
    });
    const data = await response.json();
    setApproving(false);

    if (response.ok) {
      setMessage(
        `Schedule approved. Published ${data.publishedCount ?? 0} service plan${
          (data.publishedCount ?? 0) === 1 ? "" : "s"
        } and sent ${data.notify?.groupSent ?? 0} choir notification${
          (data.notify?.groupSent ?? 0) === 1 ? "" : "s"
        }.`,
      );
      load();
      return;
    }

    setMessage(data.error ?? "Could not approve schedule.");
  }

  if (loading) {
    return <p className="text-sm text-night-500">Loading schedule settings…</p>;
  }

  return (
    <div className="space-y-6">
      {!readOnly && (
      <Card>
        <h3 className="font-display text-lg font-semibold text-night-900">
          Monthly leader rotation
        </h3>
        <p className="mt-2 text-sm text-night-600">
          Search and add only the worship leaders who belong in this rotation. Generate the
          schedule, then approve and send it to the choir.
        </p>

        {config?.status === "published" && (
          <p className="mt-3 rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
            Published rotation is visible to the choir in the app.
            {config.scheduleNotifiedAt
              ? ` Last sent ${new Date(config.scheduleNotifiedAt).toLocaleString()}.`
              : ""}
          </p>
        )}

        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <label className="text-sm text-night-700">
            <span className="font-semibold">Default service time</span>
            <select
              value={serviceTime}
              onChange={(event) => setServiceTime(event.target.value)}
              className="mt-1 block w-full rounded-xl border border-night-900/10 bg-white px-3 py-2.5 text-sm"
            >
              {WORSHIP_SERVICE_TIMES.map((slot) => (
                <option key={slot.value} value={slot.value}>
                  {slot.label}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm text-night-700">
            <span className="font-semibold">Service day</span>
            <select
              value={serviceKind}
              onChange={(event) =>
                setServiceKind(event.target.value === "friday" ? "friday" : "sunday")
              }
              className="mt-1 block w-full rounded-xl border border-night-900/10 bg-white px-3 py-2.5 text-sm"
            >
              <option value="sunday">Sunday</option>
              <option value="friday">Friday</option>
            </select>
          </label>
          <label className="text-sm text-night-700">
            <span className="font-semibold">Weeks ahead to generate</span>
            <input
              type="number"
              min={1}
              max={52}
              value={weeksAhead}
              onChange={(event) => setWeeksAhead(Number(event.target.value) || 8)}
              className="mt-1 block w-full rounded-xl border border-night-900/10 bg-white px-3 py-2.5 text-sm"
            />
          </label>
          <label className="text-sm text-night-700">
            <span className="font-semibold">Upload reminder (days before service)</span>
            <input
              type="number"
              min={1}
              max={14}
              value={uploadDutyLeadDays}
              onChange={(event) => setUploadDutyLeadDays(Number(event.target.value) || 4)}
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

        <RotationPoolEditor
          pool={pool}
          onChange={setPool}
          lookupUrl="/api/worship/schedule"
          chipClassName="bg-violet-700"
        />

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
            {approving ? "Sending…" : "Approve & send to choir"}
          </Button>
        </div>
      </Card>
      )}

      {readOnly && config?.status === "published" && (
        <Card>
          <h3 className="font-display text-lg font-semibold text-night-900">Leader rotation</h3>
          <p className="mt-2 text-sm text-night-600">
            Upcoming worship leaders for the published choir schedule.
          </p>
        </Card>
      )}

      {assignments.length > 0 && (
        <Card>
          <h3 className="font-display text-lg font-semibold text-night-900">Upcoming assignments</h3>
          <ul className="mt-4 space-y-2 text-sm">
            {assignments.map((entry) => (
              <li
                key={`${entry.serviceDate}-${entry.serviceTime}`}
                className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-night-900/5 px-4 py-3"
              >
                <div>
                  <p className="font-semibold text-night-900">
                    {serviceDateTimeLabel(entry.serviceDate, entry.serviceTime)}
                  </p>
                  <p className="text-xs text-night-500">
                    Leader: {entry.leader?.name ?? "Not set"}
                    {entry.uploadDutyUserName ? ` · Upload duty: ${entry.uploadDutyUserName}` : ""}
                  </p>
                </div>
                {onOpenService && (
                  <button
                    type="button"
                    onClick={() => onOpenService(entry.serviceDate, entry.serviceTime)}
                    className="text-sm font-semibold text-violet-700 hover:underline"
                  >
                    Open plan
                  </button>
                )}
              </li>
            ))}
          </ul>
        </Card>
      )}

      {config && (
        <p className="text-xs text-night-500">
          Next rotation index: {config.rotationIndex + 1} (continues where the last generate left off).
        </p>
      )}

      {message && (
        <p className="rounded-xl bg-sand-100 px-4 py-3 text-sm text-night-700">{message}</p>
      )}
    </div>
  );
}
