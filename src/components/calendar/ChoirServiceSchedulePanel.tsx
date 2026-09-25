"use client";

import { useEffect, useMemo, useState } from "react";
import { Button, Card } from "@/components/ui";
import {
  CHOIR_ASSIGNMENT_ROLES,
  CHOIR_SERVICE_PROGRAMS,
  choirServiceProgramLabel,
  formatChoirSchedulePreview,
  type ChoirAssignmentRole,
  type ChoirScheduleAssignment,
  type ChoirServiceProgram,
  type ChoirServiceScheduleEntry,
} from "@/lib/choir-service-schedule-types";
import { WORSHIP_SERVICE_TIMES } from "@/lib/worship-types";

type RosterMember = { id: string; name: string };

type AssignmentRow = { role: ChoirAssignmentRole; personName: string };

const emptyAssignment = (): AssignmentRow => ({
  role: "worship",
  personName: "",
});

const emptyForm = {
  serviceDate: "",
  serviceTime: "10:00",
  program: "sunday-service" as ChoirServiceProgram,
  assignments: [emptyAssignment()] as AssignmentRow[],
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
    setForm({ ...emptyForm, assignments: [emptyAssignment()] });
  }

  function startEdit(entry: ChoirServiceScheduleEntry) {
    setEditId(entry.id);
    setForm({
      serviceDate: entry.serviceDate,
      serviceTime: entry.serviceTime,
      program: entry.program,
      assignments:
        entry.assignments.length > 0
          ? entry.assignments.map((item) => ({
              role: item.role,
              personName: item.personName,
            }))
          : [emptyAssignment()],
    });
  }

  function updateAssignment(index: number, patch: Partial<AssignmentRow>) {
    setForm((current) => ({
      ...current,
      assignments: current.assignments.map((row, i) =>
        i === index ? { ...row, ...patch } : row,
      ),
    }));
  }

  function addAssignmentRow() {
    setForm((current) => ({
      ...current,
      assignments: [...current.assignments, emptyAssignment()],
    }));
  }

  function removeAssignmentRow(index: number) {
    setForm((current) => {
      const next = current.assignments.filter((_, i) => i !== index);
      return {
        ...current,
        assignments: next.length > 0 ? next : [emptyAssignment()],
      };
    });
  }

  function pickRosterName(index: number, memberId: string) {
    const member = roster.find((item) => item.id === memberId);
    if (!member) return;
    updateAssignment(index, { personName: member.name });
  }

  async function saveEntry() {
    const assignments: ChoirScheduleAssignment[] = form.assignments
      .filter((row) => row.personName.trim())
      .map((row) => ({
        role: row.role,
        personName: row.personName.trim(),
      }));

    if (!form.serviceDate || assignments.length === 0) {
      setMessage("Pick a date and add at least one person with a role.");
      return;
    }

    setSaving(true);
    setMessage(null);
    const response = await fetch("/api/choir/service-schedule", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "save",
        id: editId ?? undefined,
        serviceDate: form.serviceDate,
        serviceTime: form.serviceTime,
        program: form.program,
        assignments,
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
            Choir leaders, assistants, and church admins can add services and assign who is on
            worship, praise, praise &amp; worship, or ministration song. The calendar shows each
            person&apos;s name and role.
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
            <label className="text-sm text-night-700 md:col-span-2">
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
          </div>

          <div className="mt-4 space-y-3">
            <p className="text-sm font-semibold text-night-800">People on this service</p>
            {form.assignments.map((row, index) => (
              <div
                key={`assignment-${index}`}
                className="flex flex-col gap-2 rounded-xl border border-night-900/8 bg-sand-50/60 p-3 sm:flex-row sm:items-end"
              >
                <label className="flex-1 text-sm text-night-700">
                  <span className="font-semibold">Role</span>
                  <select
                    value={row.role}
                    onChange={(event) =>
                      updateAssignment(index, {
                        role: event.target.value as ChoirAssignmentRole,
                      })
                    }
                    className="mt-1 block w-full rounded-xl border border-night-900/10 bg-white px-3 py-2.5 text-sm"
                  >
                    {CHOIR_ASSIGNMENT_ROLES.map((item) => (
                      <option key={item.value} value={item.value}>
                        {item.label}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="flex-[2] text-sm text-night-700">
                  <span className="font-semibold">Name</span>
                  <div className="mt-1 flex flex-wrap gap-2">
                    <input
                      value={row.personName}
                      onChange={(event) =>
                        updateAssignment(index, { personName: event.target.value })
                      }
                      placeholder="Person's name"
                      className="min-w-[10rem] flex-1 rounded-xl border border-night-900/10 bg-white px-3 py-2.5 text-sm"
                    />
                    {roster.length > 0 ? (
                      <select
                        defaultValue=""
                        onChange={(event) => {
                          pickRosterName(index, event.target.value);
                          event.currentTarget.value = "";
                        }}
                        className="rounded-xl border border-night-900/10 bg-white px-3 py-2.5 text-sm"
                      >
                        <option value="">Roster…</option>
                        {roster.map((member) => (
                          <option key={member.id} value={member.id}>
                            {member.name}
                          </option>
                        ))}
                      </select>
                    ) : null}
                  </div>
                </label>
                {form.assignments.length > 1 ? (
                  <button
                    type="button"
                    className="text-sm font-semibold text-red-700 hover:underline sm:pb-2.5"
                    onClick={() => removeAssignmentRow(index)}
                  >
                    Remove
                  </button>
                ) : null}
              </div>
            ))}
            <Button type="button" variant="secondary" onClick={addAssignmentRow}>
              Add another person
            </Button>
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
            Upcoming choir service assignments. Only choir leaders, assistants, and church admins
            can change the schedule.
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
