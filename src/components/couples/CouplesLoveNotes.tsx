"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { CouplesHubScreen } from "@/components/couples/CouplesHubScreen";
import { CouplesHubTabRow } from "@/components/couples/CouplesHubTabRow";
import { CouplesLinkGate } from "@/components/couples/CouplesLinkGate";
import { couplesHubPremium } from "@/components/couples/couples-hub-premium";
import { Button } from "@/components/ui";
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
    <CouplesHubScreen
      title="Love notes"
      fab={
        locked
          ? undefined
          : { label: "Write a love note", onClick: () => setComposerOpen(true) }
      }
    >
        <p className={`${couplesHubPremium.sheetSubtitle} -mt-1`}>
          Private between you and {hub?.partnerName ?? "your spouse"}.
        </p>

        {locked ? (
          <div className="mt-6">
            <CouplesLinkGate pendingIncoming={hub?.pendingIncomingInvite} />
          </div>
        ) : (
          <>
            {unreadCount > 0 ? (
              <p className="mt-2 text-xs font-semibold text-rose-200">
                {unreadCount} unread from your spouse
              </p>
            ) : null}

            <CouplesHubTabRow
              variant="underline"
              tabs={[
                { id: "all", label: "Notes" },
                { id: "received", label: "Shared with me" },
              ]}
              active={filter === "sent" ? "all" : filter}
              onChange={(id) => setFilter(id)}
            />

            <label className="mt-4 block">
              <span className="sr-only">Search notes</span>
              <input
                type="search"
                placeholder="Search notes…"
                value={searchInput}
                onChange={(event) => setSearchInput(event.target.value)}
                className={couplesHubPremium.sheetInput}
              />
            </label>

            {error ? (
              <p className={couplesHubPremium.sheetStatusError}>{error}</p>
            ) : loading ? (
              <p className="mt-8 text-center text-sm text-[var(--couples-sheet-muted)]">Loading…</p>
            ) : notes.length === 0 ? (
              <p className={`${couplesHubPremium.sheetStatusInfo} mt-8`}>
                No notes yet. Send the first word of encouragement.
              </p>
            ) : (
              <ul className="mt-4 space-y-3">
                {notes.map((note, index) => {
                  const meta = noteTypeMeta(note.noteType);
                  const noteTones = [
                    "couples-tile-tone-love-notes",
                    "couples-tile-tone-date-night",
                    "couples-tile-tone-check-in",
                    "couples-tile-tone-devotionals",
                  ];
                  const tone = noteTones[index % noteTones.length];
                  return (
                    <li
                      key={note.id}
                      className={`rounded-2xl border border-stone-200/50 p-4 ${tone} ${
                        note.isUnread ? "ring-2 ring-rose-300/60" : ""
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <span className="text-2xl" aria-hidden>{meta.emoji}</span>
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold text-stone-900 line-clamp-2">
                            {note.body.split("\n")[0]}
                          </p>
                          <p className="mt-1 text-xs text-[var(--couples-sheet-muted)]">
                            {formatWhen(note.createdAt)}
                            {note.isFromMe ? " · You" : ` · ${note.fromUserName}`}
                          </p>
                          <p className="mt-2 hidden whitespace-pre-wrap text-sm leading-relaxed text-stone-800 sm:block">
                            {note.body}
                          </p>
                          {note.scriptureRef ? (
                            <p className="mt-2 text-sm font-medium text-amber-200/90">
                              {note.scriptureRef}
                            </p>
                          ) : null}
                        </div>
                        <span
                          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-stone-300/50 text-xs font-bold text-stone-700"
                          aria-hidden
                        >
                          {(note.isFromMe ? "You" : note.fromUserName).slice(0, 1)}
                        </span>
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
              <p className={couplesHubPremium.sheetStatusOk}>{status}</p>
            ) : null}
          </>
        )}

        {composerOpen && !locked ? (
          <div
            className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-4 sm:items-center"
            role="dialog"
            aria-modal="true"
            aria-labelledby="love-note-composer-title"
          >
            <div className={couplesHubPremium.sheetModal}>
              <h2
                id="love-note-composer-title"
                className="font-display text-lg font-semibold text-stone-900"
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
                        ? "bg-stone-900 text-white"
                        : "bg-stone-100 text-stone-800"
                    }`}
                  >
                    {entry.emoji} {entry.label}
                  </button>
                ))}
              </div>

              <label className="mt-4 block text-sm">
                <span className="font-semibold text-[var(--couples-sheet-muted)]">Message</span>
                <textarea
                  rows={5}
                  className={`mt-1 ${couplesHubPremium.sheetInput}`}
                  value={body}
                  onChange={(event) => setBody(event.target.value)}
                  placeholder="I'm grateful for you because…"
                />
              </label>

              {noteType === "scripture" ? (
                <label className="mt-3 block text-sm">
                  <span className="font-semibold text-[var(--couples-text-muted)]">Scripture</span>
                  <input
                    className={`mt-1 ${couplesHubPremium.input}`}
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

    </CouplesHubScreen>
  );
}
