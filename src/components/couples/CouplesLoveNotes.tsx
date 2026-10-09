"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { CouplesLinkGate } from "@/components/couples/CouplesLinkGate";
import {
  CouplesLoadingSkeleton,
  CouplesPrimaryButton,
  CouplesSecondaryButton,
} from "@/components/couples/design-system";
import { couplesHubPremium } from "@/components/couples/couples-hub-premium";
import { getMemberAvatarApiUrl } from "@/lib/avatar-utils";
import {
  COUPLE_LOVE_NOTE_TYPES,
  type CoupleLoveNoteType,
  type CoupleLoveNoteView,
} from "@/lib/couple-love-note-types";
import {
  dismissLoveNotesNotifyHint,
  LOVE_NOTE_CARD_BACKGROUNDS,
  LOVE_NOTE_EMPTY_EXAMPLES,
  loveNotesNotifyHintDismissed,
  type LoveNotesTab,
} from "@/lib/couple-love-note-ui";
import type { CouplesHubOverview } from "@/lib/couples-hub-types";

function formatWhen(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function notePreview(body: string) {
  const line = body.trim().split("\n")[0];
  if (line.length <= 120) return line;
  return `${line.slice(0, 117)}…`;
}

function LoveNotesTabSelector({
  active,
  onChange,
  unreadCount,
}: {
  active: LoveNotesTab;
  onChange: (tab: LoveNotesTab) => void;
  unreadCount: number;
}) {
  return (
    <div
      className="flex rounded-full bg-[var(--couples-gold-light)]/55 p-1 ring-1 ring-[var(--couples-border)]"
      role="tablist"
    >
      {(
        [
          { id: "notes" as const, label: "Notes" },
          { id: "shared" as const, label: "Shared With Me" },
        ] as const
      ).map((tab) => (
        <button
          key={tab.id}
          type="button"
          role="tab"
          aria-selected={active === tab.id}
          onClick={() => onChange(tab.id)}
          className={`relative flex-1 rounded-full px-3 py-2.5 text-center text-sm font-semibold transition motion-reduce:transition-none ${
            active === tab.id
              ? "bg-[var(--couples-surface)] text-[var(--couples-text)] shadow-sm"
              : "text-[var(--couples-muted)]"
          }`}
        >
          {tab.label}
          {tab.id === "shared" && unreadCount > 0 ? (
            <span
              className="absolute right-3 top-2 h-2 w-2 rounded-full bg-[var(--couples-gold)]"
              aria-label={`${unreadCount} unread`}
            />
          ) : null}
        </button>
      ))}
    </div>
  );
}

function NoteAvatar({
  name,
  userId,
  avatarUrl,
  updatedAt,
}: {
  name: string;
  userId?: string;
  avatarUrl?: string | null;
  updatedAt?: string | null;
}) {
  const src = userId ? getMemberAvatarApiUrl(userId, avatarUrl ?? undefined, updatedAt ?? undefined) : null;
  const initial = name.trim().charAt(0).toUpperCase() || "♥";
  return (
    <span className="relative flex h-9 w-9 shrink-0 overflow-hidden rounded-full ring-2 ring-white/80">
      {src ? (
        <Image src={src} alt="" fill className="object-cover" sizes="36px" />
      ) : (
        <span className="flex h-full w-full items-center justify-center bg-[var(--couples-mocha)] text-xs font-semibold text-white">
          {initial}
        </span>
      )}
    </span>
  );
}

export function CouplesLoveNotes() {
  const { user } = useAuth();
  const [hub, setHub] = useState<CouplesHubOverview | null>(null);
  const [partnerId, setPartnerId] = useState<string | null>(null);
  const [partnerAvatarUrl, setPartnerAvatarUrl] = useState<string | null>(null);
  const [partnerUpdatedAt, setPartnerUpdatedAt] = useState<string | null>(null);
  const [notes, setNotes] = useState<CoupleLoveNoteView[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [tab, setTab] = useState<LoveNotesTab>("notes");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [composerOpen, setComposerOpen] = useState(false);
  const [detailNote, setDetailNote] = useState<CoupleLoveNoteView | null>(null);
  const [noteType, setNoteType] = useState<CoupleLoveNoteType>("appreciation");
  const [body, setBody] = useState("");
  const [scriptureRef, setScriptureRef] = useState("");
  const [busy, setBusy] = useState(false);
  const [sendPulse, setSendPulse] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [showNotifyHint, setShowNotifyHint] = useState(false);

  const locked = !hub?.hasActiveLink;
  const partnerName = hub?.partnerName ?? "your spouse";
  const apiFilter = tab === "shared" ? "received" : "all";

  const loadHub = useCallback(() => {
    return Promise.all([
      fetch("/api/couples/hub").then(async (response) => {
        const data = await response.json();
        if (response.ok) setHub(data.overview ?? null);
      }),
      fetch("/api/couple-link").then(async (response) => {
        const data = await response.json();
        if (response.ok && data.link?.partnerId) {
          setPartnerId(data.link.partnerId);
          setPartnerAvatarUrl(data.link.partnerAvatarUrl ?? null);
          setPartnerUpdatedAt(data.link.partnerUpdatedAt ?? null);
        }
      }),
    ]).catch(() => undefined);
  }, []);

  const loadNotes = useCallback(() => {
    setLoading(true);
    setError(null);
    const params = new URLSearchParams();
    if (apiFilter !== "all") params.set("filter", apiFilter);

    return fetch(`/api/couples/love-notes?${params.toString()}`)
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
  }, [apiFilter]);

  useEffect(() => {
    void loadHub();
    setShowNotifyHint(!loveNotesNotifyHintDismissed());
  }, [loadHub]);

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
        scriptureRef: scriptureRef.trim() || undefined,
      }),
    });
    const data = await response.json();
    setBusy(false);

    if (!response.ok) {
      setStatus(data.error ?? "Could not send note.");
      return;
    }

    setSendPulse(true);
    window.setTimeout(() => setSendPulse(false), 1200);

    setNotes(Array.isArray(data.notes) ? data.notes : []);
    setUnreadCount(Number(data.unreadCount ?? 0));
    setBody("");
    setScriptureRef("");
    setComposerOpen(false);
    setStatus("Sent with love.");
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

  async function openNote(note: CoupleLoveNoteView) {
    setDetailNote(note);
    await markRead(note);
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
    setDetailNote(null);
  }

  return (
    <div className={`${couplesHubPremium.page} couples-hub-typography min-h-full`}>
      {sendPulse ? (
        <div
          className="pointer-events-none fixed inset-0 z-[60] flex items-center justify-center motion-reduce:hidden"
          aria-hidden
        >
          <span className="love-notes-send-heart text-6xl text-[var(--couples-gold)]">♥</span>
        </div>
      ) : null}

      <div className="mx-auto w-full max-w-lg">
        <header
          className="sticky top-0 z-20 flex min-h-[3.25rem] items-center gap-2 bg-[var(--couples-midnight)] px-[var(--couples-page-padding)] py-3 text-white safe-top"
        >
          <Link
            href="/couples/marriage"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-2xl font-light transition hover:bg-white/10 active:scale-95"
            aria-label="Back to Our Marriage"
          >
            ‹
          </Link>
          <h1
            className="min-w-0 flex-1 truncate text-center font-[family-name:var(--font-couples-display)] text-[1.05rem] font-semibold"
          >
            Love Notes
          </h1>
          <button
            type="button"
            disabled={locked}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[var(--couples-gold)] text-2xl font-light text-white transition hover:brightness-110 active:scale-95 disabled:opacity-40"
            aria-label="Write a new love note"
            onClick={() => setComposerOpen(true)}
          >
            +
          </button>
        </header>

        <div className="px-[var(--couples-page-padding)] pb-28 pt-4">
          <p className="text-sm text-[var(--couples-muted)]">
            Private between you and {partnerName} — never shared on community feeds.
          </p>

          {locked ? (
            <div className="mt-6">
              <CouplesLinkGate tone="sheet" pendingIncoming={hub?.pendingIncomingInvite} />
            </div>
          ) : (
            <>
              <div className="mt-4">
                <LoveNotesTabSelector active={tab} onChange={setTab} unreadCount={unreadCount} />
              </div>

              {unreadCount > 0 && tab === "notes" ? (
                <p className="mt-3 text-xs font-semibold text-[var(--couples-gold)]">
                  {unreadCount} unread from {partnerName}
                </p>
              ) : null}

              {showNotifyHint ? (
                <div className="mt-4 rounded-[1.125rem] border border-[var(--couples-border)] bg-[var(--couples-surface)] px-4 py-3 text-sm text-[var(--couples-muted)]">
                  <p>
                    Push alerts say a note arrived — not the message itself. Manage notifications in{" "}
                    <Link href="/profile" className="font-semibold text-[var(--couples-gold)]">
                      Profile
                    </Link>
                    .
                  </p>
                  <button
                    type="button"
                    className="mt-2 text-xs font-semibold text-[var(--couples-mocha)]"
                    onClick={() => {
                      dismissLoveNotesNotifyHint();
                      setShowNotifyHint(false);
                    }}
                  >
                    Got it
                  </button>
                </div>
              ) : null}

              {error ? (
                <p className="mt-4 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-800">{error}</p>
              ) : loading ? (
                <div className="mt-6">
                  <CouplesLoadingSkeleton rows={4} />
                </div>
              ) : notes.length === 0 ? (
                <div className="mt-8 rounded-[1.375rem] bg-[var(--couples-surface)] px-5 py-8 text-center">
                  <p className="font-[family-name:var(--font-couples-display)] text-xl font-semibold text-[var(--couples-text)]">
                    Send your first note
                  </p>
                  <p className="mt-2 text-sm text-[var(--couples-muted)]">
                    A few words can change their whole day.
                  </p>
                  <ul className="mt-6 space-y-3 text-left text-sm italic text-[var(--couples-muted)]">
                    {LOVE_NOTE_EMPTY_EXAMPLES.map((sample) => (
                      <li key={sample} className="rounded-xl bg-[var(--couples-blush)]/40 px-4 py-3">
                        &ldquo;{sample}&rdquo;
                      </li>
                    ))}
                  </ul>
                  <CouplesPrimaryButton className="mt-6" onClick={() => setComposerOpen(true)}>
                    Write a love note
                  </CouplesPrimaryButton>
                </div>
              ) : (
                <ul className="mt-5 space-y-3">
                  {notes.map((note, index) => {
                    const bg = LOVE_NOTE_CARD_BACKGROUNDS[index % LOVE_NOTE_CARD_BACKGROUNDS.length];
                    const avatarUserId = note.isFromMe ? user?.id : partnerId;
                    const avatarUrl = note.isFromMe ? user?.avatarUrl : partnerAvatarUrl;
                    const avatarUpdated = note.isFromMe ? user?.updatedAt : partnerUpdatedAt;
                    const displayName = note.isFromMe ? "You" : note.fromUserName;
                    return (
                      <li key={note.id}>
                        <button
                          type="button"
                          onClick={() => void openNote(note)}
                          className={`flex w-full gap-3 rounded-[1.375rem] p-4 text-left transition active:scale-[0.99] motion-reduce:transition-none ${
                            note.isUnread ? "ring-2 ring-[var(--couples-gold)]/70" : ""
                          }`}
                          style={{ backgroundColor: bg }}
                        >
                          <span className="text-xl" aria-hidden>
                            {note.noteType === "scripture" ? "📖" : "💌"}
                          </span>
                          <span className="min-w-0 flex-1">
                            <p className="font-[family-name:var(--font-couples-display)] text-[0.9375rem] font-semibold leading-snug text-[var(--couples-text)] line-clamp-3">
                              {notePreview(note.body)}
                            </p>
                            <p className="mt-2 text-xs text-[var(--couples-muted)]">
                              {formatWhen(note.createdAt)}
                              {note.isUnread ? (
                                <span className="ml-2 inline-flex items-center gap-1 font-semibold text-[var(--couples-gold)]">
                                  <span className="h-1.5 w-1.5 rounded-full bg-[var(--couples-gold)]" />
                                  New
                                </span>
                              ) : null}
                            </p>
                          </span>
                          <NoteAvatar
                            name={displayName}
                            userId={avatarUserId ?? undefined}
                            avatarUrl={avatarUrl}
                            updatedAt={avatarUpdated}
                          />
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}

              {status ? (
                <p className="mt-4 rounded-xl bg-[var(--couples-sage)] px-3 py-2 text-sm text-[var(--couples-text)]">
                  {status}
                </p>
              ) : null}
            </>
          )}
        </div>
      </div>

      {composerOpen && !locked ? (
        <div
          className="fixed inset-0 z-50 flex flex-col bg-[var(--couples-background)]"
          role="dialog"
          aria-modal="true"
        >
          <header className="flex items-center justify-between bg-[var(--couples-midnight)] px-[var(--couples-page-padding)] py-3 text-white safe-top">
            <button
              type="button"
              className="text-sm font-semibold text-[var(--couples-gold-light)]"
              onClick={() => setComposerOpen(false)}
            >
              Cancel
            </button>
            <p className="font-[family-name:var(--font-couples-display)] text-base font-semibold">
              New love note
            </p>
            <span className="w-12" />
          </header>

          <div className="flex-1 overflow-y-auto px-[var(--couples-page-padding)] py-5">
            <p className="text-sm text-[var(--couples-muted)]">
              To: <span className="font-semibold text-[var(--couples-text)]">{partnerName}</span>
            </p>

            <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-[var(--couples-muted)]">
              Note theme
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              {COUPLE_LOVE_NOTE_TYPES.map((entry) => (
                <button
                  key={entry.id}
                  type="button"
                  onClick={() => setNoteType(entry.id)}
                  className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                    noteType === entry.id
                      ? "bg-[var(--couples-mocha)] text-white"
                      : "bg-[var(--couples-surface)] text-[var(--couples-text)] ring-1 ring-[var(--couples-border)]"
                  }`}
                >
                  {entry.emoji} {entry.label}
                </button>
              ))}
            </div>

            <label className="mt-5 block">
              <span className="text-xs font-semibold uppercase tracking-wide text-[var(--couples-muted)]">
                Your message
              </span>
              <textarea
                rows={8}
                className="mt-2 w-full resize-none rounded-[1.25rem] border border-[var(--couples-border)] bg-[var(--couples-surface)] px-4 py-4 font-[family-name:var(--font-couples-ui)] text-base leading-relaxed text-[var(--couples-text)] placeholder:text-[var(--couples-muted)]"
                value={body}
                onChange={(event) => setBody(event.target.value)}
                placeholder="Write from the heart…"
              />
            </label>

            <label className="mt-4 block text-sm">
              <span className="font-semibold text-[var(--couples-muted)]">
                Scripture reference {noteType === "scripture" ? "" : "(optional)"}
              </span>
              <input
                className="mt-1 w-full rounded-xl border border-[var(--couples-border)] bg-[var(--couples-surface)] px-3 py-2.5 text-sm"
                value={scriptureRef}
                onChange={(event) => setScriptureRef(event.target.value)}
                placeholder="e.g. 1 Corinthians 13:4–7"
              />
            </label>
          </div>

          <div className="border-t border-[var(--couples-border)] bg-[var(--couples-surface)] px-[var(--couples-page-padding)] py-4 safe-bottom">
            <CouplesPrimaryButton disabled={busy || !body.trim()} onClick={() => void sendNote()}>
              {busy ? "Sending…" : "Send with love"}
            </CouplesPrimaryButton>
          </div>
        </div>
      ) : null}

      {detailNote ? (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-[var(--couples-midnight)]/40 p-4 sm:items-center"
          role="dialog"
          aria-modal="true"
        >
          <div className="max-h-[85dvh] w-full max-w-md overflow-y-auto rounded-[1.375rem] bg-[var(--couples-surface)] p-5 shadow-xl">
            <p className="text-xs text-[var(--couples-muted)]">
              {formatWhen(detailNote.createdAt)} · {detailNote.isFromMe ? "You" : detailNote.fromUserName}
            </p>
            <p className="mt-4 whitespace-pre-wrap font-[family-name:var(--font-couples-display)] text-lg leading-relaxed text-[var(--couples-text)]">
              {detailNote.body}
            </p>
            {detailNote.scriptureRef ? (
              <p className="mt-4 text-sm font-medium text-[var(--couples-gold)]">{detailNote.scriptureRef}</p>
            ) : null}
            <div className="mt-6 flex flex-col gap-2">
              <CouplesSecondaryButton onClick={() => setDetailNote(null)}>Close</CouplesSecondaryButton>
              <button
                type="button"
                className="py-2 text-sm font-semibold text-red-700"
                onClick={() => void removeNote(detailNote)}
              >
                Delete note
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
