"use client";

import { useCallback, useEffect, useState } from "react";
import { CouplesHubTabRow } from "@/components/couples/CouplesHubTabRow";
import { CouplesLinkGate } from "@/components/couples/CouplesLinkGate";
import { CouplesSubpageHeader } from "@/components/couples/CouplesSubpageHeader";
import { couplesHubPremium } from "@/components/couples/couples-hub-premium";
import { Button } from "@/components/ui";
import type { CouplePrayerJournalEntryView } from "@/lib/couple-prayer-journal-types";
import type { CouplesHubOverview } from "@/lib/couples-hub-types";

type Tab = "requests" | "answered" | "add";

export function CouplesPrayerJournal() {
  const [hub, setHub] = useState<CouplesHubOverview | null>(null);
  const [entries, setEntries] = useState<CouplePrayerJournalEntryView[]>([]);
  const [tab, setTab] = useState<Tab>("requests");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [composerOpen, setComposerOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  const locked = !hub?.hasActiveLink;

  const loadHub = useCallback(() => {
    return fetch("/api/couples/hub")
      .then(async (response) => {
        const data = await response.json();
        if (response.ok) setHub(data.overview ?? null);
      })
      .catch(() => undefined);
  }, []);

  const loadJournal = useCallback(() => {
    setLoading(true);
    setError(null);
    return fetch("/api/couples/prayer-journal")
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error ?? "Could not load journal.");
        setEntries(Array.isArray(data.entries) ? data.entries : []);
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : "Could not load journal.");
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    void loadHub();
  }, [loadHub]);

  useEffect(() => {
    if (!locked) void loadJournal();
  }, [loadJournal, locked]);

  const visible = entries.filter((entry) => {
    if (tab === "add") return false;
    if (tab === "requests") return entry.status === "praying";
    return entry.status === "answered";
  });

  async function createEntry() {
    setBusy(true);
    setStatus(null);
    const response = await fetch("/api/couples/prayer-journal", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "create", title, body }),
    });
    const data = await response.json();
    setBusy(false);
    if (!response.ok) {
      setStatus(data.error ?? "Could not save.");
      return;
    }
    setEntries(Array.isArray(data.entries) ? data.entries : []);
    setTitle("");
    setBody("");
    setComposerOpen(false);
    setStatus("Prayer added.");
  }

  async function markAnswered(entryId: string) {
    setBusy(true);
    const response = await fetch("/api/couples/prayer-journal", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "update", entryId, status: "answered" }),
    });
    const data = await response.json();
    setBusy(false);
    if (response.ok) setEntries(Array.isArray(data.entries) ? data.entries : []);
  }

  async function removeEntry(entryId: string) {
    if (!window.confirm("Remove this prayer from your shared journal?")) return;
    setBusy(true);
    const response = await fetch("/api/couples/prayer-journal", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "delete", entryId }),
    });
    const data = await response.json();
    setBusy(false);
    if (response.ok) setEntries(Array.isArray(data.entries) ? data.entries : []);
  }

  return (
    <div className={couplesHubPremium.page}>
      <div className={couplesHubPremium.inset}>
        <CouplesSubpageHeader
          title="Prayer journal"
          subtitle="Shared requests and answered prayers — just the two of you."
        />

        {locked ? (
          <div className="mt-6">
            <CouplesLinkGate pendingIncoming={hub?.pendingIncomingInvite} />
          </div>
        ) : (
          <>
            <div className="mt-4">
              <CouplesHubTabRow
                tabs={[
                  { id: "requests", label: "Requests" },
                  { id: "answered", label: "Answered" },
                  { id: "add", label: "Add" },
                ]}
                active={tab}
                onChange={(id) => {
                  if (id === "add") {
                    setComposerOpen(true);
                    return;
                  }
                  setTab(id);
                }}
              />
            </div>

            {error ? (
              <p className="mt-4 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
            ) : loading ? (
              <p className="mt-8 text-center text-sm text-night-500">Loading…</p>
            ) : tab === "add" ? (
              <p className="mt-8 text-center text-sm text-[var(--couples-text-muted)]">
                Use the Add tab to write a new prayer request.
              </p>
            ) : visible.length === 0 ? (
              <p className="mt-8 rounded-xl border border-dashed border-white/15 px-4 py-8 text-center text-sm text-[var(--couples-text-muted)]">
                No prayers in this list yet.
              </p>
            ) : (
              <ul className="mt-4 space-y-3">
                {visible.map((entry) => (
                  <li key={entry.id} className={couplesHubPremium.card}>
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <p className="mt-1 font-semibold">{entry.title}</p>
                        <p className="text-xs text-[var(--couples-text-muted)]">{entry.createdByName}</p>
                        <p className="mt-2 whitespace-pre-wrap text-sm text-[var(--couples-text-muted)]">
                          {entry.body}
                        </p>
                      </div>
                      <span
                        className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase ${
                          entry.status === "answered"
                            ? "bg-emerald-500/20 text-emerald-200"
                            : "bg-sky-500/20 text-sky-200"
                        }`}
                      >
                        {entry.status === "answered" ? "Answered" : "Praying"}
                      </span>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-3">
                      {entry.status === "praying" ? (
                        <button
                          type="button"
                          className="text-xs font-semibold text-emerald-800 underline-offset-2 hover:underline"
                          onClick={() => void markAnswered(entry.id)}
                        >
                          Mark answered
                        </button>
                      ) : null}
                      <button
                        type="button"
                        className="text-xs font-semibold text-night-600 underline-offset-2 hover:underline"
                        onClick={() => void removeEntry(entry.id)}
                      >
                        Delete
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}

            {status ? (
              <p className="mt-4 rounded-xl bg-emerald-50 px-3 py-2 text-sm text-emerald-900">{status}</p>
            ) : null}
          </>
        )}

        {composerOpen && !locked ? (
          <div className="fixed inset-0 z-50 flex items-end justify-center bg-night-950/40 p-4 sm:items-center">
            <div className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl border border-white/10 bg-[var(--couples-surface)] p-5 shadow-xl">
              <h2 className="font-display text-lg font-semibold">New prayer</h2>
              <label className="mt-4 block text-sm">
                <span className="font-semibold">Title</span>
                <input
                  className={`mt-1 ${couplesHubPremium.input}`}
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                />
              </label>
              <label className="mt-3 block text-sm">
                <span className="font-semibold">Prayer</span>
                <textarea
                  rows={5}
                  className={`mt-1 ${couplesHubPremium.input}`}
                  value={body}
                  onChange={(event) => setBody(event.target.value)}
                />
              </label>
              <div className="mt-5 flex flex-col gap-2 sm:flex-row">
                <Button className="flex-1" disabled={busy} onClick={() => void createEntry()}>
                  Save
                </Button>
                <Button variant="secondary" className="flex-1" onClick={() => setComposerOpen(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        ) : null}

      </div>
    </div>
  );
}
