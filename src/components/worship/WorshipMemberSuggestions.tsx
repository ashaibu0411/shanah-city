"use client";

import { useState } from "react";
import { Button, Card } from "@/components/ui";
import {
  WORSHIP_PART_ROLES,
  worshipPartLabel,
  type WorshipMemberSuggestion,
  type WorshipSong,
} from "@/lib/worship-types";

type WorshipMemberSuggestionsProps = {
  serviceDate: string;
  serviceTime: string;
  songs: WorshipSong[];
  suggestions: WorshipMemberSuggestion[];
  canManage: boolean;
  defaultPartRole?: string;
  onUpdated: (plan: { memberSuggestions?: WorshipMemberSuggestion[]; songs?: WorshipSong[] }) => void;
};

export function WorshipMemberSuggestions({
  serviceDate,
  serviceTime,
  songs,
  suggestions,
  canManage,
  defaultPartRole,
  onUpdated,
}: WorshipMemberSuggestionsProps) {
  const [songId, setSongId] = useState("");
  const [partRole, setPartRole] = useState(defaultPartRole ?? "");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function submitSuggestion() {
    setSubmitting(true);
    setMessage(null);
    const response = await fetch("/api/worship", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "submit_suggestion",
        serviceDate,
        serviceTime,
        songId: songId || undefined,
        partRole: partRole || undefined,
        notes,
      }),
    });
    const data = await response.json();
    setSubmitting(false);

    if (response.ok) {
      setNotes("");
      onUpdated(data.plan);
      setMessage("Suggestion sent to your worship leader.");
      return;
    }

    setMessage(data.error ?? "Could not send suggestion.");
  }

  async function reviewSuggestion(suggestionId: string, decision: "approve" | "dismiss") {
    const response = await fetch("/api/worship", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "review_suggestion",
        serviceDate,
        serviceTime,
        suggestionId,
        decision,
      }),
    });
    const data = await response.json();
    if (response.ok) {
      onUpdated(data.plan);
    } else {
      setMessage(data.error ?? "Could not review suggestion.");
    }
  }

  const pending = suggestions.filter((entry) => entry.status === "pending");
  const reviewed = suggestions.filter((entry) => entry.status !== "pending");

  return (
    <div className="space-y-4">
      <Card>
        <h3 className="font-display text-lg font-semibold text-night-900">Part suggestions</h3>
        <p className="mt-2 text-sm text-night-600">
          Tell your leader which side you want to sing, harmonies you plan to take, or other notes
          for a song.
        </p>

        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <label className="text-sm text-night-700">
            <span className="font-semibold">Song (optional)</span>
            <select
              value={songId}
              onChange={(event) => setSongId(event.target.value)}
              className="mt-1 block w-full rounded-xl border border-night-900/10 bg-white px-3 py-2.5 text-sm"
            >
              <option value="">General / whole service</option>
              {songs.map((song) => (
                <option key={song.id} value={song.id}>
                  {song.title}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm text-night-700">
            <span className="font-semibold">Your part</span>
            <select
              value={partRole}
              onChange={(event) => setPartRole(event.target.value)}
              className="mt-1 block w-full rounded-xl border border-night-900/10 bg-white px-3 py-2.5 text-sm"
            >
              <option value="">Select part…</option>
              {WORSHIP_PART_ROLES.map((part) => (
                <option key={part.value} value={part.value}>
                  {part.label}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm text-night-700 md:col-span-2">
            <span className="font-semibold">Your note</span>
            <textarea
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              rows={3}
              placeholder="I'll take alto on the chorus, or lead the bridge in tenor…"
              className="mt-1 block w-full rounded-xl border border-night-900/10 bg-white px-3 py-2.5 text-sm"
            />
          </label>
        </div>

        <Button className="mt-4" onClick={submitSuggestion} disabled={submitting || !notes.trim()}>
          {submitting ? "Sending…" : "Send suggestion"}
        </Button>
      </Card>

      {canManage && pending.length > 0 && (
        <Card>
          <h4 className="font-semibold text-night-900">Pending suggestions</h4>
          <div className="mt-3 space-y-3">
            {pending.map((entry) => (
              <div key={entry.id} className="rounded-xl bg-amber-50 p-4">
                <p className="text-sm font-semibold text-night-900">{entry.userName}</p>
                <p className="text-xs text-night-500">
                  {entry.songTitle ? entry.songTitle : "General"}
                  {entry.partRole ? ` · ${worshipPartLabel(entry.partRole)}` : ""}
                </p>
                <p className="mt-2 text-sm text-night-800">{entry.notes}</p>
                <div className="mt-3 flex gap-2">
                  <Button onClick={() => reviewSuggestion(entry.id, "approve")}>Approve</Button>
                  <Button variant="secondary" onClick={() => reviewSuggestion(entry.id, "dismiss")}>
                    Dismiss
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {reviewed.length > 0 && (
        <Card>
          <h4 className="font-semibold text-night-900">Previous suggestions</h4>
          <ul className="mt-3 space-y-2 text-sm text-night-600">
            {reviewed.slice(0, 8).map((entry) => (
              <li key={entry.id}>
                <span className="font-medium text-night-800">{entry.userName}</span> — {entry.notes}{" "}
                <span className="text-xs capitalize text-night-400">({entry.status})</span>
              </li>
            ))}
          </ul>
        </Card>
      )}

      {message && (
        <p className="rounded-xl bg-sand-100 px-4 py-3 text-sm text-night-700">{message}</p>
      )}
    </div>
  );
}
