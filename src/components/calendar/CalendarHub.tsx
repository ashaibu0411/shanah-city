"use client";

import { useEffect, useMemo, useState } from "react";
import { upcomingEvents } from "@/lib/site";
import type { UnavailabilityRequest } from "@/lib/member-types";
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

      {tab === "church" && (
        <div className="grid gap-4">
          {upcomingEvents.map((event) => (
            <Card key={event.id}>
              <p className="text-sm font-medium text-sand-600">{event.date}</p>
              <h3 className="mt-1 font-display text-xl font-semibold text-night-900">
                {event.title}
              </h3>
              <p className="mt-2 text-sm text-night-600">
                {event.time} · {event.location}
              </p>
            </Card>
          ))}
        </div>
      )}

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
