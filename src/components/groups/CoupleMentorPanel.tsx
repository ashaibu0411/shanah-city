"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui";
import type { CoupleMentorRequestView } from "@/lib/couple-mentor-types";

type MentorPanelData = {
  canManage: boolean;
  canRequest: boolean;
  myRequest: CoupleMentorRequestView | null;
  requests: CoupleMentorRequestView[];
  mentorOptions: Array<{ id: string; label: string }>;
};

type CoupleMentorPanelProps = {
  groupId: string;
};

function formatWhen(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function statusLabel(status: CoupleMentorRequestView["status"]) {
  if (status === "open") return "Waiting for match";
  if (status === "matched") return "Matched";
  return "Closed";
}

export function CoupleMentorPanel({ groupId }: CoupleMentorPanelProps) {
  const [data, setData] = useState<MentorPanelData | null>(null);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [matchByRequest, setMatchByRequest] = useState<Record<string, string>>({});

  async function loadPanel() {
    const response = await fetch(
      `/api/groups/couple-mentor?groupId=${encodeURIComponent(groupId)}`,
    );
    const payload = await response.json();
    if (response.ok) {
      setData(payload as MentorPanelData);
    } else {
      setMessage(payload.error ?? "Could not load mentor requests.");
    }
  }

  useEffect(() => {
    void loadPanel();
  }, [groupId]);

  async function post(body: Record<string, unknown>) {
    setBusy(true);
    setMessage(null);
    const response = await fetch("/api/groups/couple-mentor", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ groupId, ...body }),
    });
    const payload = await response.json();
    setBusy(false);
    if (!response.ok) {
      setMessage(payload.error ?? "Could not save.");
      return;
    }
    setData(payload as MentorPanelData);
    setNote("");
    setMessage("Saved.");
  }

  if (!data) {
    return <p className="mt-4 text-sm text-night-600">Loading mentors…</p>;
  }

  const openRequests = data.requests.filter((entry) => entry.status === "open");

  return (
    <div className="mt-4">
      <p className="text-sm text-night-700">
        Request a mentor couple from Power Couples leaders, or get matched with another linked couple
        for encouragement and accountability.
      </p>

      {!data.canRequest && !data.canManage ? (
        <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50/80 p-4 text-sm text-night-700">
          Link your spouse on{" "}
          <Link href="/profile" className="font-semibold text-night-900 underline-offset-2 hover:underline">
            your profile
          </Link>{" "}
          to request a mentor couple.
        </div>
      ) : null}

      {data.canRequest && !data.myRequest ? (
        <div className="mt-4 rounded-2xl border border-teal-200 bg-teal-50/70 p-4">
          <p className="text-sm font-semibold text-night-900">Request a mentor couple</p>
          <textarea
            value={note}
            onChange={(event) => setNote(event.target.value)}
            rows={3}
            placeholder="Optional note for leaders (season of life, what you're hoping for)…"
            className="mt-3 w-full rounded-xl border border-night-900/10 bg-white px-3 py-2.5 text-sm outline-none ring-night-900/5 focus:ring-2"
          />
          <Button className="mt-3" disabled={busy} onClick={() => post({ action: "request", note })}>
            {busy ? "Submitting…" : "Submit request"}
          </Button>
        </div>
      ) : null}

      {data.myRequest ? (
        <div className="mt-4 rounded-2xl border border-night-900/10 bg-white p-4 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm font-semibold text-night-900">Your mentor request</p>
            <span className="text-xs font-semibold uppercase tracking-wide text-teal-800">
              {statusLabel(data.myRequest.status)}
            </span>
          </div>
          {data.myRequest.note ? (
            <p className="mt-2 whitespace-pre-wrap text-sm text-night-700">{data.myRequest.note}</p>
          ) : null}
          {data.myRequest.mentorLabel ? (
            <p className="mt-2 text-sm text-night-800">
              Matched with <strong>{data.myRequest.mentorLabel}</strong>
            </p>
          ) : null}
          <p className="mt-2 text-xs text-night-500">{formatWhen(data.myRequest.createdAt)}</p>
        </div>
      ) : null}

      {data.canManage ? (
        <div className="mt-6">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-night-500">
            Leader queue ({openRequests.length} open)
          </h3>
          {openRequests.length === 0 ? (
            <p className="mt-3 rounded-2xl bg-sand-50 px-4 py-3 text-sm text-night-600">
              No open mentor requests right now.
            </p>
          ) : (
            <ul className="mt-3 space-y-3">
              {openRequests.map((request) => (
                <li
                  key={request.id}
                  className="rounded-2xl border border-night-900/10 bg-white p-4 shadow-sm"
                >
                  <p className="text-sm font-semibold text-night-900">{request.coupleLabel}</p>
                  {request.note ? (
                    <p className="mt-2 whitespace-pre-wrap text-sm text-night-700">{request.note}</p>
                  ) : null}
                  <p className="mt-2 text-xs text-night-500">
                    Requested {formatWhen(request.createdAt)} · {request.requesterName}
                  </p>
                  <div className="mt-3 flex flex-wrap items-end gap-2">
                    <label className="block min-w-[12rem] flex-1">
                      <span className="text-xs font-semibold text-night-600">Mentor couple</span>
                      <select
                        value={matchByRequest[request.id] ?? ""}
                        onChange={(event) =>
                          setMatchByRequest((current) => ({
                            ...current,
                            [request.id]: event.target.value,
                          }))
                        }
                        className="mt-1 w-full rounded-xl border border-night-900/10 bg-white px-3 py-2 text-sm outline-none ring-night-900/5 focus:ring-2"
                      >
                        <option value="">Choose couple…</option>
                        {data.mentorOptions
                          .filter((option) => option.id !== request.coupleLinkId)
                          .map((option) => (
                            <option key={option.id} value={option.id}>
                              {option.label}
                            </option>
                          ))}
                      </select>
                    </label>
                    <Button
                      disabled={busy || !matchByRequest[request.id]}
                      onClick={() =>
                        post({
                          action: "match",
                          requestId: request.id,
                          mentorLinkId: matchByRequest[request.id],
                        })
                      }
                    >
                      Match
                    </Button>
                    <Button
                      variant="secondary"
                      disabled={busy}
                      onClick={() => post({ action: "close", requestId: request.id })}
                    >
                      Close
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}

          {data.requests.some((entry) => entry.status === "matched") ? (
            <div className="mt-6">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-night-500">
                Matched pairs
              </h3>
              <ul className="mt-3 space-y-2">
                {data.requests
                  .filter((entry) => entry.status === "matched")
                  .map((request) => (
                    <li
                      key={request.id}
                      className="rounded-xl bg-sand-50 px-4 py-3 text-sm text-night-800"
                    >
                      <strong>{request.coupleLabel}</strong> ↔{" "}
                      <strong>{request.mentorLabel ?? "Mentor couple"}</strong>
                    </li>
                  ))}
              </ul>
            </div>
          ) : null}
        </div>
      ) : null}

      {message ? <p className="mt-3 text-sm text-night-600">{message}</p> : null}
    </div>
  );
}
