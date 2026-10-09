"use client";

import { useCallback, useEffect, useState } from "react";
import { CouplesHubScreen } from "@/components/couples/CouplesHubScreen";
import { CouplesHubTabRow } from "@/components/couples/CouplesHubTabRow";
import { CouplesLinkGate } from "@/components/couples/CouplesLinkGate";
import { couplesHubPremium } from "@/components/couples/couples-hub-premium";
import { prayerEntryIcon } from "@/lib/couples-hub-ui";
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
    <CouplesHubScreen title="Prayer journal">
        {locked ? (
          <CouplesLinkGate pendingIncoming={hub?.pendingIncomingInvite} />
        ) : (
          <>
            <CouplesHubTabRow
              variant="sheet"
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

            {error ? (
              <p className={couplesHubPremium.sheetStatusError}>{error}</p>
            ) : loading ? (
              <p className="mt-8 text-center text-sm text-[var(--couples-sheet-muted)]">Loading…</p>
            ) : tab === "add" ? (
              <p className="mt-8 text-center text-sm text-[var(--couples-sheet-muted)]">
                Use the Add tab to write a new prayer request.
              </p>
            ) : visible.length === 0 ? (
              <p className={`${couplesHubPremium.sheetStatusInfo} mt-8`}>No prayers in this list yet.</p>
            ) : (
              <ul className="mt-5 space-y-3">
                {visible.map((entry) => {
                  const icon = prayerEntryIcon(entry.title);
                  return (
                  <li key={entry.id} className={couplesHubPremium.sheetCard}>
                    <div className="flex items-start gap-3">
                      <span className={`${couplesHubPremium.iconCircle} ${icon.circle}`} aria-hidden>
                        {icon.emoji}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-stone-900">{entry.title}</p>
                        <p className="text-sm text-[var(--couples-sheet-muted)]">
                          {entry.body.split("\n")[0]?.slice(0, 80) || entry.createdByName}
                        </p>
                      </div>
                      <span
                        className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase ${
                          entry.status === "answered"
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-sky-100 text-sky-800"
                        }`}
                      >
                        {entry.status === "answered" ? "Answered" : "Praying"}
                      </span>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-3">
                      {entry.status === "praying" ? (
                        <button
                          type="button"
                          className="text-xs font-semibold text-emerald-700 underline-offset-2 hover:underline"
                          onClick={() => void markAnswered(entry.id)}
                        >
                          Mark answered
                        </button>
                      ) : null}
                      <button
                        type="button"
                        className="text-xs font-semibold text-red-600 underline-offset-2 hover:underline"
                        onClick={() => void removeEntry(entry.id)}
                      >
                        Delete
                      </button>
                    </div>
                  </li>
                  );
                })}
              </ul>
            )}

            {status ? (
              <p className={couplesHubPremium.sheetStatusOk}>{status}</p>
            ) : null}
          </>
        )}

        {composerOpen && !locked ? (
          <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-4 sm:items-center">
            <div className={couplesHubPremium.sheetModal}>
              <h2 className="font-display text-lg font-semibold text-stone-900">New prayer</h2>
              <label className="mt-4 block text-sm">
                <span className="font-semibold text-[var(--couples-sheet-muted)]">Title</span>
                <input
                  className={`mt-1 ${couplesHubPremium.sheetInput}`}
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                />
              </label>
              <label className="mt-3 block text-sm">
                <span className="font-semibold text-[var(--couples-sheet-muted)]">Prayer</span>
                <textarea
                  rows={5}
                  className={`mt-1 ${couplesHubPremium.sheetInput}`}
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

    </CouplesHubScreen>
  );
}
