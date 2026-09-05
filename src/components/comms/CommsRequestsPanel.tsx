"use client";

import { useEffect, useMemo, useState } from "react";
import {
  COMMS_CHANNELS,
  COMMS_REQUEST_STATUSES,
  COMMS_REQUEST_TEMPLATES,
} from "@/lib/comms-constants";
import type { CommsRequest, CommsRequestTemplate, CommsChannelId } from "@/lib/comms-types";
import { isoToDateInputValue, scheduledDateFromInput, weekStartIso } from "@/lib/comms-week-utils";
import { Button, Card } from "@/components/ui";

type CommsRequestSubmitFormProps = {
  onSubmitted?: (request: CommsRequest) => void;
};

export function CommsRequestSubmitForm({ onSubmitted }: CommsRequestSubmitFormProps) {
  const [template, setTemplate] = useState<CommsRequestTemplate>("communications");
  const [title, setTitle] = useState("");
  const [targetAudience, setTargetAudience] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [selectedDeliverables, setSelectedDeliverables] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const templateMeta = useMemo(
    () => COMMS_REQUEST_TEMPLATES.find((entry) => entry.id === template) ?? COMMS_REQUEST_TEMPLATES[3],
    [template],
  );

  async function submit() {
    if (!title.trim() || !description.trim()) {
      setMessage("Add a title and description.");
      return;
    }

    setBusy(true);
    setMessage(null);
    const response = await fetch("/api/comms/requests", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        template,
        title,
        targetAudience,
        description,
        dueDate: dueDate || undefined,
        deliverables: selectedDeliverables.length ? selectedDeliverables : templateMeta.deliverables,
      }),
    });
    const data = await response.json();
    setBusy(false);

    if (!response.ok) {
      setMessage(data.error ?? "Could not submit request.");
      return;
    }

    setTitle("");
    setTargetAudience("");
    setDescription("");
    setDueDate("");
    setSelectedDeliverables([]);
    setMessage("Request submitted. Communications will review it soon.");
    onSubmitted?.(data.request);
  }

  return (
    <Card className="space-y-4">
      <div>
        <label className="text-sm font-semibold text-night-900">Request type</label>
        <select
          value={template}
          onChange={(event) => {
            setTemplate(event.target.value as CommsRequestTemplate);
            setSelectedDeliverables([]);
          }}
          className="mt-1 w-full rounded-xl border border-night-900/10 px-3 py-2"
        >
          {COMMS_REQUEST_TEMPLATES.map((entry) => (
            <option key={entry.id} value={entry.id}>
              {entry.label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="text-sm font-semibold text-night-900">Title</label>
        <input
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="Men's Retreat announcement"
          className="mt-1 w-full rounded-xl border border-night-900/10 px-3 py-2"
        />
      </div>

      <div>
        <label className="text-sm font-semibold text-night-900">Target audience</label>
        <input
          value={targetAudience}
          onChange={(event) => setTargetAudience(event.target.value)}
          placeholder="All campuses, youth, media team..."
          className="mt-1 w-full rounded-xl border border-night-900/10 px-3 py-2"
        />
      </div>

      <div>
        <label className="text-sm font-semibold text-night-900">What do you need?</label>
        <textarea
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          rows={5}
          placeholder="Share the message, dates, links, and anything else the comms team should know."
          className="mt-1 w-full rounded-xl border border-night-900/10 px-3 py-2"
        />
      </div>

      <div>
        <label className="text-sm font-semibold text-night-900">Deliverables</label>
        <div className="mt-2 flex flex-wrap gap-2">
          {templateMeta.deliverables.map((deliverable) => {
            const active = selectedDeliverables.includes(deliverable);
            return (
              <button
                key={deliverable}
                type="button"
                onClick={() =>
                  setSelectedDeliverables((current) =>
                    active
                      ? current.filter((entry) => entry !== deliverable)
                      : [...current, deliverable],
                  )
                }
                className={`rounded-full px-3 py-1 text-sm font-semibold ${
                  active
                    ? "bg-night-900 text-sand-50"
                    : "bg-sand-100 text-night-700 ring-1 ring-night-900/10"
                }`}
              >
                {deliverable}
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <label className="text-sm font-semibold text-night-900">Due date</label>
        <input
          type="date"
          value={dueDate}
          onChange={(event) => setDueDate(event.target.value)}
          className="mt-1 w-full rounded-xl border border-night-900/10 px-3 py-2"
        />
      </div>

      <Button onClick={submit} disabled={busy}>
        {busy ? "Submitting..." : "Submit request"}
      </Button>
      {message ? <p className="text-sm text-emerald-700">{message}</p> : null}
    </Card>
  );
}

export function CommsRequestsAdminPanel() {
  const [requests, setRequests] = useState<CommsRequest[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [schedulingId, setSchedulingId] = useState<string | null>(null);
  const [scheduleChannel, setScheduleChannel] = useState<CommsChannelId>("app_banner");
  const [scheduleDate, setScheduleDate] = useState("");

  async function load() {
    const response = await fetch("/api/comms/requests");
    const data = await response.json();
    if (response.ok) {
      setRequests(data.requests ?? []);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  const visible = requests.filter(
    (request) => statusFilter === "all" || request.status === statusFilter,
  );

  async function updateRequest(id: string, patch: Record<string, unknown>) {
    setBusyId(id);
    setMessage(null);
    const response = await fetch("/api/comms/requests", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, ...patch }),
    });
    const data = await response.json();
    setBusyId(null);
    if (!response.ok) {
      setMessage(data.error ?? "Could not update request.");
      return;
    }
    await load();
  }

  async function scheduleRequest(request: CommsRequest) {
    if (!scheduleDate) {
      setMessage("Pick a date before adding to the calendar.");
      return;
    }

    setBusyId(request.id);
    setMessage(null);
    const scheduledIso = scheduledDateFromInput(scheduleDate);
    const response = await fetch("/api/comms/requests", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: request.id,
        action: "schedule",
        channel: scheduleChannel,
        weekStart: weekStartIso(new Date(`${scheduleDate}T09:00:00`)),
        scheduledDate: scheduledIso,
      }),
    });
    const data = await response.json();
    setBusyId(null);
    if (!response.ok) {
      setMessage(data.error ?? "Could not add to calendar.");
      return;
    }
    const dateLabel = scheduleDate;
    setSchedulingId(null);
    setScheduleDate("");
    setMessage(`Scheduled "${request.title}" on ${dateLabel}. Open the Calendar tab to move or promote it.`);
    await load();
  }

  function openScheduleForm(request: CommsRequest) {
    setSchedulingId(request.id);
    setScheduleChannel("app_banner");
    setScheduleDate(isoToDateInputValue(request.dueDate) || isoToDateInputValue(new Date().toISOString()));
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <select
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value)}
          className="rounded-xl border border-night-900/10 px-3 py-2 text-sm"
        >
          <option value="all">All statuses</option>
          {COMMS_REQUEST_STATUSES.map((status) => (
            <option key={status.id} value={status.id}>
              {status.label}
            </option>
          ))}
        </select>
        <Button variant="secondary" onClick={() => void load()}>
          Refresh
        </Button>
      </div>

      {message ? <p className="text-sm text-emerald-700">{message}</p> : null}

      {visible.length === 0 ? (
        <Card>
          <p className="text-night-600">No ministry requests yet.</p>
        </Card>
      ) : (
        visible.map((request) => (
          <Card key={request.id} className="space-y-3">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-night-500">
                  {request.department ?? request.template}
                </p>
                <h3 className="text-lg font-bold text-night-900">{request.title}</h3>
                <p className="mt-1 text-sm text-night-600">
                  {request.requesterName} ·{" "}
                  {new Date(request.createdAt).toLocaleDateString(undefined, {
                    month: "short",
                    day: "numeric",
                  })}
                </p>
              </div>
              <span className="rounded-full bg-sand-100 px-3 py-1 text-xs font-semibold text-night-700">
                {COMMS_REQUEST_STATUSES.find((entry) => entry.id === request.status)?.label ??
                  request.status}
              </span>
            </div>

            <p className="text-sm text-night-700">{request.description}</p>

            {request.deliverables.length ? (
              <div className="flex flex-wrap gap-2">
                {request.deliverables.map((deliverable) => (
                  <span
                    key={deliverable}
                    className="rounded-full bg-white px-3 py-1 text-xs font-semibold ring-1 ring-night-900/10"
                  >
                    {deliverable}
                  </span>
                ))}
              </div>
            ) : null}

            <div className="grid gap-3 md:grid-cols-2">
              <input
                defaultValue={request.assigneeName ?? ""}
                placeholder="Assignee name"
                className="rounded-xl border border-night-900/10 px-3 py-2 text-sm"
                onBlur={(event) => {
                  const value = event.target.value.trim();
                  if (value !== (request.assigneeName ?? "")) {
                    void updateRequest(request.id, { assigneeName: value });
                  }
                }}
              />
              <select
                value={request.status}
                onChange={(event) => void updateRequest(request.id, { status: event.target.value })}
                className="rounded-xl border border-night-900/10 px-3 py-2 text-sm"
                disabled={busyId === request.id}
              >
                {COMMS_REQUEST_STATUSES.map((status) => (
                  <option key={status.id} value={status.id}>
                    {status.label}
                  </option>
                ))}
              </select>
            </div>

            {request.calendarItemId ? (
              <p className="text-xs font-semibold text-emerald-700">
                On calendar — open the Calendar tab to move or promote.
              </p>
            ) : schedulingId === request.id ? (
              <div className="rounded-2xl bg-sand-50 p-4">
                <p className="text-sm font-semibold text-night-900">Schedule on calendar</p>
                <div className="mt-3 grid gap-3 md:grid-cols-2">
                  <select
                    value={scheduleChannel}
                    onChange={(event) => setScheduleChannel(event.target.value as CommsChannelId)}
                    className="rounded-xl border border-night-900/10 px-3 py-2 text-sm"
                  >
                    {COMMS_CHANNELS.map((entry) => (
                      <option key={entry.id} value={entry.id}>
                        {entry.label}
                      </option>
                    ))}
                  </select>
                  <input
                    type="date"
                    value={scheduleDate}
                    onChange={(event) => setScheduleDate(event.target.value)}
                    className="rounded-xl border border-night-900/10 px-3 py-2 text-sm"
                  />
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Button
                    onClick={() => void scheduleRequest(request)}
                    disabled={busyId === request.id}
                  >
                    Add to calendar
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={() => setSchedulingId(null)}
                    disabled={busyId === request.id}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <Button
                variant="secondary"
                onClick={() => openScheduleForm(request)}
                disabled={busyId === request.id}
              >
                Schedule on calendar
              </Button>
            )}
          </Card>
        ))
      )}
    </div>
  );
}
