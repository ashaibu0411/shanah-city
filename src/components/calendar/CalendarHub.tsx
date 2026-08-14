"use client";

import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import type { UnavailabilityRequest } from "@/lib/member-types";
import type { ChurchEvent } from "@/lib/types";
import { Button, Card } from "@/components/ui";

type CalendarTab = "church" | "choir" | "pastors";

function formatDate(date: string) {
  return new Date(`${date}T12:00:00`).toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

function RequestForm({
  group,
  onSubmitted,
}: {
  group: "choir" | "pastors";
  onSubmitted: () => void;
}) {
  const [personName, setPersonName] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [reason, setReason] = useState("");
  const [message, setMessage] = useState<string | null>(null);

  async function submit() {
    const response = await fetch("/api/unavailability", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ personName, startDate, endDate, reason, group }),
    });
    const data = await response.json();
    if (response.ok) {
      setMessage("Request submitted — waiting for leader approval.");
      setPersonName("");
      setStartDate("");
      setEndDate("");
      setReason("");
      onSubmitted();
    } else {
      setMessage(data.error ?? "Could not submit request.");
    }
  }

  return (
    <Card className="mb-6">
      <h3 className="font-display text-lg font-semibold text-night-900">
        Request time away
      </h3>
      <p className="mt-1 text-sm text-night-600">
        Submit vacation or unavailable dates. Once approved, everyone on this calendar can see it.
      </p>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <input
          value={personName}
          onChange={(event) => setPersonName(event.target.value)}
          placeholder="Your name"
          className="rounded-xl border border-night-900/10 bg-sand-50 px-3 py-2.5 text-sm outline-none ring-night-900/5 focus:ring-2"
        />
        <input
          type="date"
          value={startDate}
          onChange={(event) => setStartDate(event.target.value)}
          className="rounded-xl border border-night-900/10 bg-sand-50 px-3 py-2.5 text-sm outline-none ring-night-900/5 focus:ring-2"
        />
        <input
          type="date"
          value={endDate}
          onChange={(event) => setEndDate(event.target.value)}
          className="rounded-xl border border-night-900/10 bg-sand-50 px-3 py-2.5 text-sm outline-none ring-night-900/5 focus:ring-2"
        />
        <input
          value={reason}
          onChange={(event) => setReason(event.target.value)}
          placeholder="Reason (vacation, travel, etc.)"
          className="rounded-xl border border-night-900/10 bg-sand-50 px-3 py-2.5 text-sm outline-none ring-night-900/5 focus:ring-2"
        />
      </div>
      {message && <p className="mt-3 text-sm text-night-600">{message}</p>}
      <Button className="mt-4" onClick={submit}>
        Submit for approval
      </Button>
    </Card>
  );
}

function LeaderApproval({
  requests,
  onReviewed,
}: {
  requests: UnavailabilityRequest[];
  onReviewed: () => void;
}) {
  const [pin, setPin] = useState("");
  const pending = requests.filter((item) => item.status === "pending");

  async function review(id: string, status: "approved" | "rejected") {
    await fetch("/api/unavailability", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "review",
        id,
        status,
        pin,
        reviewedBy: "Leader",
      }),
    });
    onReviewed();
  }

  if (pending.length === 0) return null;

  return (
    <Card className="mb-6 border-amber-200 bg-amber-50/40">
      <h3 className="font-semibold text-night-900">Leader approval</h3>
      <p className="mt-1 text-sm text-night-600">
        Approve or decline requests. Default PIN: <code>shanahleader</code>
      </p>
      <input
        type="password"
        value={pin}
        onChange={(event) => setPin(event.target.value)}
        placeholder="Leader PIN"
        className="mt-3 w-full max-w-xs rounded-xl border border-night-900/10 bg-white px-3 py-2 text-sm outline-none ring-night-900/5 focus:ring-2"
      />
      <ul className="mt-4 space-y-3">
        {pending.map((item) => (
          <li key={item.id} className="rounded-xl bg-white p-4 ring-1 ring-night-900/5">
            <p className="font-medium text-night-900">{item.personName}</p>
            <p className="text-sm text-night-600">
              {formatDate(item.startDate)} – {formatDate(item.endDate)} · {item.reason}
            </p>
            <div className="mt-3 flex gap-2">
              <Button onClick={() => review(item.id, "approved")}>Approve</Button>
              <Button variant="secondary" onClick={() => review(item.id, "rejected")}>
                Decline
              </Button>
            </div>
          </li>
        ))}
      </ul>
    </Card>
  );
}

function ChurchEventsPanel() {
  const { user } = useAuth();
  const [events, setEvents] = useState<ChurchEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [pin, setPin] = useState("");
  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [location, setLocation] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const canManage = user?.role === "leader";

  async function loadEvents() {
    setLoading(true);
    const response = await fetch("/api/events");
    const data = await response.json();
    setEvents(data.events ?? []);
    setLoading(false);
  }

  useEffect(() => {
    loadEvents();
  }, []);

  async function addEvent() {
    const response = await fetch("/api/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, date, time, location, pin: pin || undefined }),
    });
    const data = await response.json();
    if (response.ok) {
      setMessage("Event added.");
      setTitle("");
      setDate("");
      setTime("");
      setLocation("");
      loadEvents();
    } else {
      setMessage(data.error ?? "Could not add event.");
    }
  }

  async function removeEvent(id: string) {
    const response = await fetch("/api/events", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, pin: pin || undefined }),
    });
    const data = await response.json();
    if (response.ok) {
      loadEvents();
    } else {
      setMessage(data.error ?? "Could not delete event.");
    }
  }

  return (
    <>
      {(canManage || pin) && (
        <Card className="mb-6">
          <h3 className="font-display text-lg font-semibold text-night-900">
            Manage church events
          </h3>
          <p className="mt-1 text-sm text-night-600">
            Leaders can add or remove events. Non-leaders can enter the leader PIN.
          </p>
          {!canManage && (
            <input
              type="password"
              value={pin}
              onChange={(event) => setPin(event.target.value)}
              placeholder="Leader PIN"
              className="mt-3 w-full max-w-xs rounded-xl border border-night-900/10 bg-white px-3 py-2 text-sm outline-none ring-night-900/5 focus:ring-2"
            />
          )}
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Title"
              className="rounded-xl border border-night-900/10 bg-sand-50 px-3 py-2.5 text-sm outline-none ring-night-900/5 focus:ring-2"
            />
            <input
              value={date}
              onChange={(event) => setDate(event.target.value)}
              placeholder="Date label (e.g. Every Friday)"
              className="rounded-xl border border-night-900/10 bg-sand-50 px-3 py-2.5 text-sm outline-none ring-night-900/5 focus:ring-2"
            />
            <input
              value={time}
              onChange={(event) => setTime(event.target.value)}
              placeholder="Time"
              className="rounded-xl border border-night-900/10 bg-sand-50 px-3 py-2.5 text-sm outline-none ring-night-900/5 focus:ring-2"
            />
            <input
              value={location}
              onChange={(event) => setLocation(event.target.value)}
              placeholder="Location"
              className="rounded-xl border border-night-900/10 bg-sand-50 px-3 py-2.5 text-sm outline-none ring-night-900/5 focus:ring-2"
            />
          </div>
          {message && <p className="mt-3 text-sm text-night-600">{message}</p>}
          <Button className="mt-4" onClick={addEvent}>
            Add event
          </Button>
        </Card>
      )}

      <div className="grid gap-4">
        {loading ? (
          <Card>
            <p className="text-sm text-night-500">Loading events…</p>
          </Card>
        ) : events.length === 0 ? (
          <Card>
            <p className="text-sm text-night-500">No events listed yet.</p>
          </Card>
        ) : (
          events.map((event) => (
            <Card key={event.id}>
              <p className="text-sm font-medium text-sand-600">{event.date}</p>
              <h3 className="mt-1 font-display text-xl font-semibold text-night-900">
                {event.title}
              </h3>
              <p className="mt-2 text-sm text-night-600">
                {event.time} · {event.location}
              </p>
              {(canManage || pin) && (
                <Button
                  variant="secondary"
                  className="mt-4"
                  onClick={() => removeEvent(event.id)}
                >
                  Remove
                </Button>
              )}
            </Card>
          ))
        )}
      </div>
    </>
  );
}

export function CalendarHub() {
  const [tab, setTab] = useState<CalendarTab>("church");
  const [requests, setRequests] = useState<UnavailabilityRequest[]>([]);

  async function loadRequests(group?: "choir" | "pastors") {
    const query = group ? `?group=${group}` : "";
    const response = await fetch(`/api/unavailability${query}`);
    const data = await response.json();
    setRequests(data.requests);
  }

  useEffect(() => {
    if (tab === "choir") loadRequests("choir");
    if (tab === "pastors") loadRequests("pastors");
  }, [tab]);

  const approved = useMemo(
    () => requests.filter((item) => item.status === "approved"),
    [requests],
  );

  const tabs: { id: CalendarTab; label: string }[] = [
    { id: "church", label: "Church" },
    { id: "choir", label: "Choir" },
    { id: "pastors", label: "Pastors" },
  ];

  return (
    <div>
      <div className="mb-6 flex flex-wrap gap-2">
        {tabs.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setTab(item.id)}
            className={`rounded-full px-4 py-1.5 text-sm font-semibold transition ${
              tab === item.id
                ? "bg-night-900 text-sand-50"
                : "bg-white text-night-600 ring-1 ring-night-900/10 hover:bg-sand-100"
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {tab === "church" && <ChurchEventsPanel />}

      {tab === "choir" && (
        <>
          <RequestForm group="choir" onSubmitted={() => loadRequests("choir")} />
          <LeaderApproval requests={requests} onReviewed={() => loadRequests("choir")} />
          <Card>
            <h3 className="font-display text-lg font-semibold text-night-900">
              Choir availability
            </h3>
            <ul className="mt-4 space-y-3">
              {approved.length === 0 ? (
                <li className="text-sm text-night-500">No approved absences yet.</li>
              ) : (
                approved.map((item) => (
                  <li key={item.id} className="rounded-xl bg-rose-50 px-4 py-3 text-sm">
                    <span className="font-semibold text-night-900">{item.personName}</span>{" "}
                    unavailable {formatDate(item.startDate)} – {formatDate(item.endDate)}
                    <span className="block text-night-500">{item.reason}</span>
                  </li>
                ))
              )}
            </ul>
          </Card>
        </>
      )}

      {tab === "pastors" && (
        <>
          <RequestForm group="pastors" onSubmitted={() => loadRequests("pastors")} />
          <LeaderApproval requests={requests} onReviewed={() => loadRequests("pastors")} />
          <Card>
            <h3 className="font-display text-lg font-semibold text-night-900">
              Pastor availability
            </h3>
            <ul className="mt-4 space-y-3">
              {approved.length === 0 ? (
                <li className="text-sm text-night-500">No approved absences yet.</li>
              ) : (
                approved.map((item) => (
                  <li key={item.id} className="rounded-xl bg-rose-50 px-4 py-3 text-sm">
                    <span className="font-semibold text-night-900">{item.personName}</span>{" "}
                    unavailable {formatDate(item.startDate)} – {formatDate(item.endDate)}
                    <span className="block text-night-500">{item.reason}</span>
                  </li>
                ))
              )}
            </ul>
          </Card>
        </>
      )}
    </div>
  );
}
