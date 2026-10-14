"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { WorshipAudioPlayer } from "@/components/worship/WorshipAudioPlayer";
import {
  CHOIR_RECORDING_CATEGORIES,
  choirRecordingCategoryLabel,
  formatRecordingDurationHms,
  type ChoirRecordingCategory,
  type ChoirRehearsalLibraryRecording,
} from "@/lib/choir-rehearsal-recording-types";

type LibraryFilter =
  | "all"
  | "mine"
  | ChoirRecordingCategory;

type RehearsalRecordingLibraryProps = {
  groupId: string;
  initialFilter?: LibraryFilter;
};

function formatRecordedDate(iso: string) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

export function RehearsalRecordingLibrary({ groupId, initialFilter = "all" }: RehearsalRecordingLibraryProps) {
  const [filter, setFilter] = useState<LibraryFilter>(initialFilter);
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<"newest" | "oldest" | "title" | "duration">("newest");
  const [recordings, setRecordings] = useState<ChoirRehearsalLibraryRecording[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [canManage, setCanManage] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");

  const load = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams({ groupId });
    if (filter === "mine") params.set("mine", "1");
    else if (filter !== "all") params.set("category", filter);
    if (query.trim()) params.set("q", query.trim());

    fetch(`/api/groups/choir/rehearsal-recordings?${params.toString()}`)
      .then((response) => response.json())
      .then((data) => {
        if (data.error) {
          setError(data.error);
          setRecordings([]);
        } else {
          setError(null);
          setRecordings(data.recordings ?? []);
          setCanManage(Boolean(data.canManage));
        }
        setLoading(false);
      })
      .catch(() => {
        setError("Could not load recordings.");
        setLoading(false);
      });
  }, [groupId, filter, query]);

  useEffect(() => {
    load();
  }, [load]);

  const sorted = useMemo(() => {
    const copy = [...recordings];
    copy.sort((a, b) => {
      if (sort === "title") return a.title.localeCompare(b.title);
      if (sort === "duration") return (b.durationSeconds ?? 0) - (a.durationSeconds ?? 0);
      if (sort === "oldest") return Date.parse(a.createdAt) - Date.parse(b.createdAt);
      return Date.parse(b.createdAt) - Date.parse(a.createdAt);
    });
    return copy;
  }, [recordings, sort]);

  async function renameRecording(id: string) {
    const nextTitle = editTitle.trim();
    if (!nextTitle) return;
    const response = await fetch("/api/groups/choir/rehearsal-recordings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, title: nextTitle }),
    });
    const data = await response.json();
    if (!response.ok) {
      setError(data.error ?? "Rename failed.");
      return;
    }
    setEditingId(null);
    load();
  }

  async function deleteRecording(id: string, title: string) {
    if (!window.confirm(`Remove “${title}” from the library? Leaders may restore shared items from backup.`)) {
      return;
    }
    const response = await fetch(`/api/groups/choir/rehearsal-recordings?id=${encodeURIComponent(id)}`, {
      method: "DELETE",
    });
    const data = await response.json();
    if (!response.ok) {
      setError(data.error ?? "Delete failed.");
      return;
    }
    load();
  }

  return (
    <div className="space-y-4">
      <div className="choir-card p-4">
        <h2 className="font-display text-lg font-bold text-[var(--choir-heading)]">Recording library</h2>
        <p className="mt-1 text-sm text-[var(--choir-muted)]">
          Saved rehearsal audio for Shanah Worship. Song-linked part recordings still appear on each song.
        </p>

        <div className="mt-3 flex flex-wrap gap-2">
          {(
            [
              ["all", "All"],
              ["mine", "My recordings"],
              ...CHOIR_RECORDING_CATEGORIES.map((c) => [c, choirRecordingCategoryLabel(c)] as const),
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              className={`rounded-full px-3 py-1.5 text-xs font-bold ${
                filter === id
                  ? "bg-[var(--choir-gold)] text-[var(--choir-heading)]"
                  : "bg-black/5 text-[var(--choir-body)]"
              }`}
              onClick={() => setFilter(id as LibraryFilter)}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="mt-3 flex flex-col gap-2 sm:flex-row">
          <input
            className="choir-input min-h-[44px] flex-1"
            placeholder="Search title or uploader"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
          <select
            className="choir-input min-h-[44px]"
            value={sort}
            onChange={(event) => setSort(event.target.value as typeof sort)}
          >
            <option value="newest">Newest first</option>
            <option value="oldest">Oldest first</option>
            <option value="title">Title</option>
            <option value="duration">Duration</option>
          </select>
        </div>
      </div>

      {loading ? <p className="text-sm text-[var(--choir-muted)]">Loading recordings…</p> : null}
      {error ? <p className="text-sm text-red-700">{error}</p> : null}

      {!loading && !sorted.length ? (
        <div className="choir-card p-5 text-center text-sm text-[var(--choir-muted)]">
          No recordings yet. Use the Record tab to capture a rehearsal session.
        </div>
      ) : null}

      <ul className="space-y-3">
        {sorted.map((entry) => (
          <li key={entry.id} className="choir-card p-4">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                {editingId === entry.id ? (
                  <div className="flex flex-col gap-2 sm:flex-row">
                    <input
                      className="choir-input min-h-[44px] flex-1"
                      value={editTitle}
                      onChange={(event) => setEditTitle(event.target.value)}
                    />
                    <button
                      type="button"
                      className="choir-rehearsal-resource-btn min-h-[44px] px-4"
                      onClick={() => void renameRecording(entry.id)}
                    >
                      Save
                    </button>
                  </div>
                ) : (
                  <h3 className="font-bold text-[var(--choir-heading)]">{entry.title}</h3>
                )}
                <p className="mt-1 text-xs text-[var(--choir-muted)]">
                  {choirRecordingCategoryLabel(entry.category)} · {formatRecordingDurationHms(entry.durationSeconds)} ·{" "}
                  {formatRecordedDate(entry.createdAt)} · {entry.recordedByName}
                </p>
                {entry.uploadStatus !== "ready" ? (
                  <p className="mt-1 text-xs font-semibold text-amber-800">Upload: {entry.uploadStatus}</p>
                ) : null}
              </div>
              <span className="text-lg" aria-hidden>
                {entry.mediaType === "video" ? "🎬" : "🎙️"}
              </span>
            </div>

            {entry.uploadStatus === "ready" ? (
              <WorshipAudioPlayer
                className="mt-3"
                src={entry.audioUrl}
                fileName={entry.fileName}
                globalPlayer={{
                  id: entry.id,
                  title: entry.title,
                  artist: entry.recordedByName,
                  kind: "worship-rehearsal",
                }}
              />
            ) : null}

            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                className="text-xs font-bold text-[var(--choir-gold-dark)] underline"
                onClick={() => {
                  setEditingId(entry.id);
                  setEditTitle(entry.title);
                }}
              >
                Rename
              </button>
              {(canManage || entry.visibility !== "official") && (
                <button
                  type="button"
                  className="text-xs font-bold text-red-700 underline"
                  onClick={() => void deleteRecording(entry.id, entry.title)}
                >
                  Delete
                </button>
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
