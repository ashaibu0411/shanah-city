"use client";

import { useEffect, useMemo, useState } from "react";
import { Button, Card } from "@/components/ui";
import {
  CHOIR_LEAD_ROLES,
  CHOIR_SERVICE_PROGRAMS,
  choirServiceProgramLabel,
  formatChoirSchedulePreview,
  type ChoirLeadRole,
  type ChoirServiceProgram,
  type ChoirServiceScheduleEntry,
} from "@/lib/choir-service-schedule-types";
import { WORSHIP_SERVICE_TIMES } from "@/lib/worship-types";

type RosterMember = { id: string; name: string };

const emptyForm = {
  serviceDate: "",
  serviceTime: "10:00",
  program: "sunday-service" as ChoirServiceProgram,
  leadRole: "worship" as ChoirLeadRole,
  worshipLeaderName: "",
  praiseLeaderName: "",
  ministration: false,
  ministrationBy: "",
};

export function ChoirServiceSchedulePanel({ onChanged }: { onChanged?: () => void }) {
  const [entries, setEntries] = useState<ChoirServiceScheduleEntry[]>([]);
  const [roster, setRoster] = useState<RosterMember[]>([]);
  const [canManage, setCanManage] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [message, setMessage] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    const response = await fetch("/api/choir/service-schedule");
    const data = await response.json();
    setLoading(false);
    if (!response.ok) {
      setMessage(data.error ?? "Could not load schedule.");
      return;
    }
    setEntries(data.entries ?? []);
    setRoster(data.roster ?? []);
    setCanManage(Boolean(data.canManage));
  }

  useEffect(() => {
    void load();
  }, []);

  const upcoming = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    return entries.filter((entry) => entry.serviceDate >= today);
  }, [entries]);

  function resetForm() {
    setEditId(null);
    setForm(emptyForm);
  }

  function startEdit(entry: ChoirServiceScheduleEntry) {
    setEditId(entry.id);
    setForm({
      serviceDate: entry.serviceDate,
      serviceTime: entry.serviceTime,
      program: entry.program,
      leadRole: entry.leadRole,
      worshipLeaderName: entry.worshipLeaderName ?? "",
      praiseLeaderName: entry.praiseLeaderName ?? "",
      ministration: entry.ministration,
      ministrationBy: entry.ministrationBy ?? "",
    });
  }

  async function saveEntry() {
    setSaving(true);
    setMessage(null);
    const response = await fetch("/api/choir/service-schedule", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "save",
        id: editId ?? undefined,
        ...form,
      }),
    });
    const data = await response.json();
    setSaving(false);
    if (!response.ok) {
      setMessage(data.error ?? "Could not save.");
      return;
    }
    setMessage(editId ? "Schedule updated on the calendar." : "Added to the choir calendar.");
    resetForm();
    await load();
    onChanged?.();
  }

  async function removeEntry(id: string) {
    if (!window.confirm("Remove this service from the schedule and calendar?")) return;
    const response = await fetch("/api/choir/service-schedule", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "delete", id }),
    });
    if (response.ok) {
      await load();
      onChanged?.();
      return;
    }
    const data = await response.json();
    setMessage(data.error ?? "Could not remove.");
  }

  function pickRosterName(
    field: "worshipLeaderName" | "praiseLeaderName" | "ministrationBy",
    memberId: string,
  ) {
    const member = roster.find((item) => item.id === memberId);
    if (!member) return;
    setForm((current) => ({ ...current, [field]: member.name }));
  }

  if (loading) {
    return (
      <Card className="mb-6">
        <p className="text-sm text-night-500">Loading service schedule…</p>
      </Card>
    );
  }

  return (
    <div className="mb-6 space-y-6">
      {canManage ? (
        <Card>
          <h3 className="font-display text-lg font-semibold text-night-900">Service schedule</h3>
          <p className="mt-1 text-sm text-night-600">
            Add who is leading worship, praise, or both for each service. Entries appear on the
            calendar below with names.
          </p>

          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <label className="text-sm text-night-700">
              <span className="font-semibold">Date</span>
              <input
                type="date"
                value={form.serviceDate}
                onChange={(event) => setForm((c) => ({ ...c, serviceDate: event.target.value }))}
                className="mt-1 block w-full rounded-xl border border-night-900/10 bg-white px-3 py-2.5 text-sm"
              />
            </label>
            <label className="text-sm text-night-700">
              <span className="font-semibold">Service time</span>
              <select
                value={form.serviceTime}
                onChange={(event) => setForm((c) => ({ ...c, serviceTime: event.target.value }))}
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
              <span className="font-semibold">Kind of service</span>
              <select
                value={form.program}
                onChange={(event) =>
                  setForm((c) => ({
                    ...c,
                    program: event.target.value as ChoirServiceProgram,
                  }))
                }
                className="mt-1 block w-full rounded-xl border border-night-900/10 bg-white px-3 py-2.5 text-sm"
              >
                {CHOIR_SERVICE_PROGRAMS.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-sm text-night-700">
              <span className="font-semibold">Leading</span>
              <select
                value={form.leadRole}
                onChange={(event) =>
                  setForm((c) => ({
                    ...c,
                    leadRole: event.target.value as ChoirLeadRole,
                  }))
                }
                className="mt-1 block w-full rounded-xl border border-night-900/10 bg-white px-3 py-2.5 text-sm"
              >
                {CHOIR_LEAD_ROLES.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>
            </label>

            {(form.leadRole === "worship" || form.leadRole === "both") && (
              <label className="text-sm text-night-700 md:col-span-2">
                <span className="font-semibold">Worship leader name</span>
                <div className="mt-1 flex flex-wrap gap-2">
                  <input
                    value={form.worshipLeaderName}
                    onChange={(event) =>
                      setForm((c) => ({ ...c, worshipLeaderName: event.target.value }))
                    }
                    placeholder="e.g. Sarah Johnson"
                    className="min-w-[12rem] flex-1 rounded-xl border border-night-900/10 bg-white px-3 py-2.5 text-sm"
                  />
                  {roster.length > 0 ? (
                    <select
                      defaultValue=""
                      onChange={(event) => {
                        pickRosterName("worshipLeaderName", event.target.value);
                        event.currentTarget.value = "";
                      }}
                      className="rounded-xl border border-night-900/10 bg-sand-50 px-3 py-2.5 text-sm"
                    >
                      <option value="">Pick from roster…</option>
                      {roster.map((member) => (
                        <option key={member.id} value={member.id}>
                          {member.name}
                        </option>
                      ))}
                    </select>
                  ) : null}
                </div>
              </label>
            )}

            {(form.leadRole === "praise" || form.leadRole === "both") && (
              <label className="text-sm text-night-700 md:col-span-2">
                <span className="font-semibold">Praise leader name</span>
                <div className="mt-1 flex flex-wrap gap-2">
                  <input
                    value={form.praiseLeaderName}
                    onChange={(event) =>
                      setForm((c) => ({ ...c, praiseLeaderName: event.target.value }))
                    }
                    placeholder="e.g. Michael Okon"
                    className="min-w-[12rem] flex-1 rounded-xl border border-night-900/10 bg-white px-3 py-2.5 text-sm"
                  />
                  {roster.length > 0 ? (
                    <select
                      defaultValue=""
                      onChange={(event) => {
                        pickRosterName("praiseLeaderName", event.target.value);
                        event.currentTarget.value = "";
                      }}
                      className="rounded-xl border border-night-900/10 bg-sand-50 px-3 py-2.5 text-sm"
                    >
                      <option value="">Pick from roster…</option>
                      {roster.map((member) => (
                        <option key={member.id} value={member.id}>
                          {member.name}
                        </option>
                      ))}
                    </select>
                  ) : null}
                </div>
              </label>
            )}

            <label className="flex items-center gap-2 text-sm text-night-800 md:col-span-2">
              <input
                type="checkbox"
                checked={form.ministration}
                onChange={(event) =>
                  setForm((c) => ({ ...c, ministration: event.target.checked }))
                }
              />
              Ministration on this service
            </label>

            {form.ministration ? (
              <label className="text-sm text-night-700 md:col-span-2">
                <span className="font-semibold">Ministering</span>
                <input
                  value={form.ministrationBy}
                  onChange={(event) =>
                    setForm((c) => ({ ...c, ministrationBy: event.target.value }))
                  }
                  placeholder="e.g. Pastor James"
                  className="mt-1 block w-full rounded-xl border border-night-900/10 bg-white px-3 py-2.5 text-sm"
                />
              </label>
            ) : null}
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <Button onClick={() => void saveEntry()} disabled={saving}>
              {saving ? "Saving…" : editId ? "Update calendar" : "Add to calendar"}
            </Button>
            {editId ? (
              <Button variant="secondary" onClick={resetForm}>
                Cancel edit
              </Button>
            ) : null}
          </div>
        </Card>
      ) : (
        <Card className="mb-6">
          <p className="text-sm text-night-600">
            Upcoming leaders and ministers for choir services. Leaders and assistants can update the
            schedule in this tab.
          </p>
        </Card>
      )}

      <Card>
        <h3 className="font-display text-lg font-semibold text-night-900">Upcoming services</h3>
        {upcoming.length === 0 ? (
          <p className="mt-3 text-sm text-night-500">No upcoming entries yet.</p>
        ) : (
          <ul className="mt-4 space-y-3">
            {upcoming.map((entry) => (
              <li
                key={entry.id}
                className="rounded-xl border border-night-900/8 bg-sand-50/80 px-4 py-3 text-sm"
              >
                <p className="font-semibold text-night-900">
                  {new Date(`${entry.serviceDate}T12:00:00`).toLocaleDateString(undefined, {
                    weekday: "long",
                    month: "short",
                    day: "numeric",
                  })}{" "}
                  · {choirServiceProgramLabel(entry.program)}
                </p>
                <pre className="mt-2 whitespace-pre-wrap font-sans text-night-700">
                  {formatChoirSchedulePreview(entry)}
                </pre>
                {canManage ? (
                  <div className="mt-3 flex flex-wrap gap-2">
                    <button
                      type="button"
                      className="text-sm font-semibold text-violet-700 hover:underline"
                      onClick={() => startEdit(entry)}
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      className="text-sm font-semibold text-red-700 hover:underline"
                      onClick={() => void removeEntry(entry.id)}
                    >
                      Remove
                    </button>
                  </div>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </Card>

      {message ? (
        <p className="rounded-xl bg-sand-100 px-4 py-3 text-sm text-night-700">{message}</p>
      ) : null}
    </div>
  );
}
