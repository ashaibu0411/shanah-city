"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { CouplesLinkGate } from "@/components/couples/CouplesLinkGate";
import { couplesHubPremium } from "@/components/couples/couples-hub-premium";
import { Button, PageHeader } from "@/components/ui";
import {
  COUPLE_LOVE_NOTE_TYPES,
  type CoupleLoveNoteType,
  type CoupleLoveNoteView,
} from "@/lib/couple-love-note-types";
import type { CouplesHubOverview } from "@/lib/couples-hub-types";

type InboxFilter = "all" | "received" | "sent";

function noteTypeMeta(type: CoupleLoveNoteType) {
  return COUPLE_LOVE_NOTE_TYPES.find((entry) => entry.id === type) ?? COUPLE_LOVE_NOTE_TYPES[0];
}

function formatWhen(iso: string) {
  return new Date(iso).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function CouplesLoveNotes() {
  const [hub, setHub] = useState<CouplesHubOverview | null>(null);
  const [notes, setNotes] = useState<CoupleLoveNoteView[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [filter, setFilter] = useState<InboxFilter>("all");
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [composerOpen, setComposerOpen] = useState(false);
  const [noteType, setNoteType] = useState<CoupleLoveNoteType>("appreciation");
  const [body, setBody] = useState("");
  const [scriptureRef, setScriptureRef] = useState("");
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

  const loadNotes = useCallback(() => {
    setLoading(true);
    setError(null);
    const params = new URLSearchParams();
    if (filter !== "all") params.set("filter", filter);
    if (search.trim()) params.set("q", search.trim());
    const query = params.toString();

    return fetch(`/api/couples/love-notes${query ? `?${query}` : ""}`)
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error ?? "Could not load notes.");
        setNotes(Array.isArray(data.notes) ? data.notes : []);
        setUnreadCount(Number(data.unreadCount ?? 0));
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : "Could not load notes.");
        setNotes([]);
      })
      .finally(() => setLoading(false));
  }, [filter, search]);

  useEffect(() => {
    void loadHub();
  }, [loadHub]);

  useEffect(() => {
    const timer = window.setTimeout(() => setSearch(searchInput), 300);
    return () => window.clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    if (!locked) void loadNotes();
  }, [loadNotes, locked]);

  async function sendNote() {
    setBusy(true);
    setStatus(null);
    const response = await fetch("/api/couples/love-notes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "send",
        noteType,
        body,
        scriptureRef: noteType === "scripture" ? scriptureRef : undefined,
      }),
    });
    const data = await response.json();
    setBusy(false);

    if (!response.ok) {
      setStatus(data.error ?? "Could not send note.");
      return;
    }

    setNotes(Array.isArray(data.notes) ? data.notes : []);
    setUnreadCount(Number(data.unreadCount ?? 0));
    setBody("");
    setScriptureRef("");
    setComposerOpen(false);
    setStatus("Sent to your spouse.");
  }

  async function markRead(note: CoupleLoveNoteView) {
    if (!note.isUnread) return;
    const response = await fetch("/api/couples/love-notes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "markRead", noteId: note.id }),
    });
    const data = await response.json();
    if (response.ok) {
      setNotes(Array.isArray(data.notes) ? data.notes : []);
      setUnreadCount(Number(data.unreadCount ?? 0));
    }
  }

  async function removeNote(note: CoupleLoveNoteView) {
    if (!window.confirm("Remove this note from your shared history?")) return;
    setBusy(true);
    const response = await fetch("/api/couples/love-notes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "delete", noteId: note.id }),
    });
    const data = await response.json();
    setBusy(false);
    if (!response.ok) {
      setStatus(data.error ?? "Could not delete note.");
      return;
    }
    setNotes(Array.isArray(data.notes) ? data.notes : []);
    setUnreadCount(Number(data.unreadCount ?? 0));
  }

  return (
    <div className={couplesHubPremium.page}>
      <div className={couplesHubPremium.inset}>
        <PageHeader variant="flat" eyebrow="Our marriage" title="Love notes" />
        <p className="mt-1 text-sm text-night-600 dark:text-sand-400">
          Private between you and {hub?.partnerName ?? "your spouse"}. Push alerts never include the
          message text.
        </p>

        {locked ? (
          <div className="mt-6">
            <CouplesLinkGate pendingIncoming={hub?.pendingIncomingInvite} />
          </div>
        ) : (
          <>
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <Button onClick={() => setComposerOpen(true)} disabled={busy}>
                Write a note
              </Button>
              {unreadCount > 0 ? (
                <span className="rounded-full bg-rose-100 px-3 py-1 text-xs font-semibold text-rose-900">
                  {unreadCount} unread
                </span>
              ) : null}
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              {(["all", "received", "sent"] as InboxFilter[]).map((entry) => (
                <button
                  key={entry}
                  type="button"
                  onClick={() => setFilter(entry)}
                  className={`rounded-full px-3 py-1.5 text-xs font-semibold capitalize ${
                    filter === entry
                      ? "bg-night-900 text-white dark:bg-sand-100 dark:text-night-950"
                      : "bg-white text-night-700 ring-1 ring-night-900/10 dark:bg-[var(--color-surface)] dark:text-sand-200"
                  }`}
                >
                  {entry}
                </button>
              ))}
            </div>

            <label className="mt-4 block">
              <span className="sr-only">Search notes</span>
              <input
                type="search"
                placeholder="Search notes…"
                value={searchInput}
                onChange={(event) => setSearchInput(event.target.value)}
                className="w-full rounded-xl border border-night-900/10 bg-white px-3 py-2.5 text-sm dark:bg-[var(--color-surface)]"
              />
            </label>

            {error ? (
              <p className="mt-4 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
            ) : loading ? (
              <p className="mt-8 text-center text-sm text-night-500">Loading…</p>
            ) : notes.length === 0 ? (
              <p className="mt-8 rounded-xl border border-dashed border-night-900/15 px-4 py-8 text-center text-sm text-night-600">
                No notes yet. Send the first word of encouragement.
              </p>
            ) : (
              <ul className="mt-4 space-y-3">
                {notes.map((note) => {
                  const meta = noteTypeMeta(note.noteType);
                  return (
                    <li
                      key={note.id}
                      className={`rounded-[1.25rem] border p-4 ${
                        note.isUnread
                          ? "border-rose-200 bg-rose-50/60 dark:border-rose-900/40 dark:bg-rose-950/20"
                          : "border-night-900/8 bg-white dark:border-white/10 dark:bg-[var(--color-surface)]"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="text-xs font-bold uppercase tracking-wide text-night-500">
                            {meta.emoji} {meta.label}
                            {note.isFromMe ? " · You" : ` · ${note.fromUserName}`}
                          </p>
                          <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-night-900 dark:text-sand-100">
                            {note.body}
                          </p>
                          {note.scriptureRef ? (
                            <p className="mt-2 text-sm font-medium text-clay-800 dark:text-clay-200">
                              {note.scriptureRef}
                            </p>
                          ) : null}
                          <p className="mt-2 text-xs text-night-500">{formatWhen(note.createdAt)}</p>
                        </div>
                      </div>
                      <div className="mt-3 flex flex-wrap gap-3">
                        {note.isUnread ? (
                          <button
                            type="button"
                            className="text-xs font-semibold text-rose-800 underline-offset-2 hover:underline"
                            onClick={() => void markRead(note)}
                          >
                            Mark read
                          </button>
                        ) : null}
                        <button
                          type="button"
                          className="text-xs font-semibold text-night-600 underline-offset-2 hover:underline"
                          onClick={() => void removeNote(note)}
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
              <p className="mt-4 rounded-xl bg-emerald-50 px-3 py-2 text-sm text-emerald-900">{status}</p>
            ) : null}
          </>
        )}

        {composerOpen && !locked ? (
          <div
            className="fixed inset-0 z-50 flex items-end justify-center bg-night-950/40 p-4 sm:items-center"
            role="dialog"
            aria-modal="true"
            aria-labelledby="love-note-composer-title"
          >
            <div className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl bg-white p-5 shadow-xl dark:bg-[var(--color-surface)]">
              <h2
                id="love-note-composer-title"
                className="font-display text-lg font-semibold text-night-950 dark:text-sand-100"
              >
                New love note
              </h2>

              <div className="mt-3 flex flex-wrap gap-2">
                {COUPLE_LOVE_NOTE_TYPES.map((entry) => (
                  <button
                    key={entry.id}
                    type="button"
                    onClick={() => setNoteType(entry.id)}
                    className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
                      noteType === entry.id
                        ? "bg-night-900 text-white"
                        : "bg-sand-100 text-night-800"
                    }`}
                  >
                    {entry.emoji} {entry.label}
                  </button>
                ))}
              </div>

              <label className="mt-4 block text-sm">
                <span className="font-semibold text-night-700">Message</span>
                <textarea
                  rows={5}
                  className="mt-1 w-full rounded-xl border border-night-900/10 px-3 py-2.5 text-sm"
                  value={body}
                  onChange={(event) => setBody(event.target.value)}
                  placeholder="I'm grateful for you because…"
                />
              </label>

              {noteType === "scripture" ? (
                <label className="mt-3 block text-sm">
                  <span className="font-semibold text-night-700">Scripture</span>
                  <input
                    className="mt-1 w-full rounded-xl border border-night-900/10 px-3 py-2.5 text-sm"
                    value={scriptureRef}
                    onChange={(event) => setScriptureRef(event.target.value)}
                    placeholder="e.g. 1 Corinthians 13:4–7"
                  />
                </label>
              ) : null}

              <div className="mt-5 flex flex-col gap-2 sm:flex-row">
                <Button className="flex-1" disabled={busy} onClick={() => void sendNote()}>
                  {busy ? "Sending…" : "Send"}
                </Button>
                <Button
                  variant="secondary"
                  className="flex-1"
                  disabled={busy}
                  onClick={() => setComposerOpen(false)}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        ) : null}

        <Link href="/couples/marriage" className={`${couplesHubPremium.secondaryCta} mt-10`}>
          Back to marriage dashboard
        </Link>
      </div>
    </div>
  );
}
