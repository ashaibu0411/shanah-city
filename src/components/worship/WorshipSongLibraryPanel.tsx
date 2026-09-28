"use client";

import { useEffect, useState } from "react";
import { editorialPremium } from "@/components/app/editorial-premium";
import { MobilePremiumFrame } from "@/components/app/MobilePremiumFrame";
import { Button } from "@/components/ui";
import { WorshipYouTubeReference } from "@/components/worship/WorshipYouTubeReference";
import { getYouTubeClipThumbnail } from "@/lib/media-clips-utils";
import type { WorshipLibrarySong } from "@/lib/worship-types";

type WorshipSongLibraryPanelProps = {
  onAddToPlan?: (song: WorshipLibrarySong) => void;
  onBackToPlan?: () => void;
};

function LibraryField({
  label,
  children,
  className = "",
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <label className={`block text-sm text-night-700 dark:text-sand-300 ${className}`}>
      <span className="mb-1.5 block text-xs font-bold uppercase tracking-[0.14em] text-night-500 dark:text-sand-400">
        {label}
      </span>
      {children}
    </label>
  );
}

const fieldClass =
  "w-full rounded-[1.05rem] border border-night-900/10 bg-white/90 px-3.5 py-2.5 text-sm text-night-900 outline-none ring-night-900/5 transition focus:border-violet-300 focus:ring-2 focus:ring-violet-200/80 dark:border-white/10 dark:bg-[var(--color-bg-muted)] dark:text-sand-100 dark:focus:border-violet-700 dark:focus:ring-violet-900/40";

export function WorshipSongLibraryPanel({ onAddToPlan, onBackToPlan }: WorshipSongLibraryPanelProps) {
  const [songs, setSongs] = useState<WorshipLibrarySong[]>([]);
  const [query, setQuery] = useState("");
  const [editing, setEditing] = useState<WorshipLibrarySong | null>(null);
  const [editorOpen, setEditorOpen] = useState(false);
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [youtubeVideoId, setYoutubeVideoId] = useState("");
  const [title, setTitle] = useState("");
  const [artist, setArtist] = useState("");
  const [defaultKey, setDefaultKey] = useState("C");
  const [bpm, setBpm] = useState("");
  const [ccliNumber, setCcliNumber] = useState("");
  const [notes, setNotes] = useState("");
  const [chartUrl, setChartUrl] = useState("");
  const [chartFileName, setChartFileName] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [lookingUp, setLookingUp] = useState(false);
  const [loading, setLoading] = useState(true);

  async function loadSongs(search = query) {
    setLoading(true);
    const params = search ? `?q=${encodeURIComponent(search)}` : "";
    const response = await fetch(`/api/worship/songs${params}`);
    const data = await response.json();
    setLoading(false);
    if (response.ok) {
      setSongs(data.songs ?? []);
    }
  }

  useEffect(() => {
    loadSongs();
  }, []);

  function resetForm() {
    setEditing(null);
    setEditorOpen(false);
    setYoutubeUrl("");
    setYoutubeVideoId("");
    setTitle("");
    setArtist("");
    setDefaultKey("C");
    setBpm("");
    setCcliNumber("");
    setNotes("");
    setChartUrl("");
    setChartFileName("");
  }

  function startEdit(song: WorshipLibrarySong) {
    setEditing(song);
    setEditorOpen(true);
    setYoutubeUrl(song.youtubeUrl ?? "");
    setYoutubeVideoId(song.youtubeVideoId ?? "");
    setTitle(song.title);
    setArtist(song.artist ?? "");
    setDefaultKey(song.defaultKey);
    setBpm(song.bpm ? String(song.bpm) : "");
    setCcliNumber(song.ccliNumber ?? "");
    setNotes(song.notes ?? "");
    setChartUrl(song.chartUrl ?? "");
    setChartFileName(song.chartFileName ?? "");
    setMessage(null);
    if (typeof window !== "undefined") {
      window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" });
    }
  }

  function openNewSongEditor() {
    resetForm();
    setEditorOpen(true);
    setMessage(null);
  }

  async function lookupYouTube() {
    if (!youtubeUrl.trim()) {
      setMessage("Paste a YouTube link first.");
      return;
    }

    setLookingUp(true);
    setMessage(null);
    const response = await fetch("/api/worship/songs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "lookup_youtube", url: youtubeUrl.trim() }),
    });
    const data = await response.json();
    setLookingUp(false);

    if (!response.ok) {
      setMessage(data.error ?? "Could not load YouTube video.");
      return;
    }

    const { lookup, existing } = data;
    setYoutubeVideoId(lookup.videoId);
    setYoutubeUrl(lookup.watchUrl);
    if (lookup.title) setTitle(lookup.title);
    if (lookup.artist) setArtist(lookup.artist);
    setEditorOpen(true);

    if (existing) {
      startEdit(existing);
      setMessage("This YouTube song is already in the library — loaded for editing.");
      return;
    }

    setMessage("YouTube details loaded. Set the key and save to library.");
  }

  async function saveSong() {
    setMessage(null);
    const response = await fetch("/api/worship/songs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "save",
        id: editing?.id,
        title,
        artist,
        defaultKey,
        bpm: bpm ? Number(bpm) : undefined,
        ccliNumber,
        notes,
        chartUrl,
        chartFileName,
        youtubeUrl: youtubeUrl || undefined,
        youtubeVideoId: youtubeVideoId || undefined,
      }),
    });
    const data = await response.json();
    if (response.ok) {
      setMessage(
        data.mergedExisting
          ? "This YouTube song was already in the library — details updated."
          : editing
            ? "Song updated."
            : youtubeVideoId
              ? "YouTube song added to library."
              : "Song added to library.",
      );
      resetForm();
      loadSongs();
    } else {
      setMessage(data.error ?? "Could not save song.");
    }
  }

  async function deleteSong(id: string) {
    const response = await fetch("/api/worship/songs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "delete", id }),
    });
    if (response.ok) {
      if (editing?.id === id) resetForm();
      loadSongs();
    }
  }

  async function uploadChart(file: File) {
    setUploading(true);
    const formData = new FormData();
    formData.set("file", file);
    const response = await fetch("/api/worship/charts", {
      method: "POST",
      body: formData,
    });
    const data = await response.json();
    setUploading(false);
    if (response.ok) {
      setChartUrl(data.url);
      setChartFileName(data.fileName);
    } else {
      setMessage(data.error ?? "Could not upload chart.");
    }
  }

  const canSave = Boolean(title.trim() || youtubeVideoId || youtubeUrl.trim());

  return (
    <div className="space-y-5">
      <MobilePremiumFrame
        variant="surface"
        className="overflow-hidden rounded-[1.35rem] border border-night-900/8 shadow-[0_1px_2px_rgba(45,36,24,0.04),0_12px_32px_rgba(45,36,24,0.08)] ring-1 ring-night-900/5 dark:border-white/10 dark:ring-white/10"
      >
        <div className="bg-gradient-to-br from-violet-700 via-indigo-800 to-indigo-950 px-5 py-6 text-white">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-violet-200/90">
            Shanah Worship
          </p>
          <h2 className="mt-1 font-display text-2xl font-semibold leading-tight">Song library</h2>
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-violet-100/90">
            Import from YouTube, store keys and charts once, then add songs to any service setlist.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            {onBackToPlan ? (
              <button
                type="button"
                onClick={onBackToPlan}
                className="rounded-full bg-white/15 px-4 py-2 text-xs font-bold uppercase tracking-wide text-white ring-1 ring-white/20 transition hover:bg-white/25"
              >
                ← Setlist
              </button>
            ) : null}
            <button
              type="button"
              onClick={openNewSongEditor}
              className="rounded-full bg-white px-4 py-2 text-xs font-bold uppercase tracking-wide text-indigo-900 shadow-sm transition hover:bg-violet-100"
            >
              Add song
            </button>
          </div>
        </div>

        <div className="border-b border-night-900/6 bg-sand-50/80 px-4 py-3 dark:border-white/10 dark:bg-[var(--color-bg-soft)]">
          <div className="flex flex-wrap items-center gap-2">
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") void loadSongs(query);
              }}
              placeholder="Search title, artist, CCLI…"
              className={`${fieldClass} min-w-[200px] flex-1`}
            />
            <Button variant="secondary" onClick={() => loadSongs(query)}>
              Search
            </Button>
          </div>
          <p className="mt-2 text-xs text-night-500 dark:text-sand-400">
            {loading
              ? "Loading library…"
              : `${songs.length} song${songs.length === 1 ? "" : "s"}${query.trim() ? " matching search" : ""}`}
          </p>
        </div>

        <div className="p-4">
          {!loading && songs.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-violet-200/90 bg-violet-50/40 px-4 py-10 text-center dark:border-violet-900/40 dark:bg-violet-950/20">
              <p className="font-display text-lg font-semibold text-night-900 dark:text-sand-100">
                No songs yet
              </p>
              <p className="mt-2 text-sm text-night-600 dark:text-sand-300">
                Paste a YouTube link below or add a song manually to build your library.
              </p>
              <Button className="mt-4" onClick={openNewSongEditor}>
                Add first song
              </Button>
            </div>
          ) : (
            <ul className="space-y-2">
              {songs.map((song) => (
                <li key={song.id}>
                  <div className="flex flex-col gap-3 rounded-[1.15rem] border border-night-900/8 bg-white p-3 shadow-sm ring-1 ring-night-900/5 transition hover:ring-violet-200/80 dark:border-white/10 dark:bg-[var(--color-surface)] dark:ring-white/10 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex min-w-0 items-start gap-3">
                      {song.youtubeVideoId ? (
                        <img
                          src={getYouTubeClipThumbnail(song.youtubeVideoId)}
                          alt=""
                          className="h-14 w-24 shrink-0 rounded-xl object-cover ring-1 ring-night-900/10"
                        />
                      ) : (
                        <div className="flex h-14 w-24 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-violet-100 to-indigo-100 text-[10px] font-bold uppercase tracking-wide text-violet-800 dark:from-violet-950/50 dark:to-indigo-950/50 dark:text-violet-200">
                          Song
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="font-display text-base font-semibold leading-snug text-night-900 dark:text-sand-100">
                          {song.title}
                        </p>
                        {song.artist ? (
                          <p className="mt-0.5 text-sm text-night-600 dark:text-sand-300">
                            {song.artist}
                          </p>
                        ) : null}
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          <span className={editorialPremium.badgeOutline}>Key {song.defaultKey}</span>
                          {song.youtubeVideoId ? (
                            <span className="rounded-full bg-red-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-red-800 ring-1 ring-red-100 dark:bg-red-950/40 dark:text-red-200 dark:ring-red-900/40">
                              YouTube
                            </span>
                          ) : null}
                          {song.chartUrl ? (
                            <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-emerald-800 ring-1 ring-emerald-100 dark:bg-emerald-950/30 dark:text-emerald-200">
                              Chart
                            </span>
                          ) : null}
                          {song.useCount > 0 ? (
                            <span className="rounded-full bg-sand-100 px-2 py-0.5 text-[10px] font-semibold text-night-600 dark:bg-[var(--color-bg-muted)] dark:text-sand-300">
                              Used {song.useCount}×
                            </span>
                          ) : null}
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2 sm:shrink-0 sm:justify-end">
                      {onAddToPlan ? (
                        <Button onClick={() => onAddToPlan(song)}>Add to plan</Button>
                      ) : null}
                      <Button variant="secondary" onClick={() => startEdit(song)}>
                        Edit
                      </Button>
                      <Button variant="secondary" onClick={() => deleteSong(song.id)}>
                        Remove
                      </Button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </MobilePremiumFrame>

      {(editorOpen || editing) && (
        <MobilePremiumFrame
          variant="surface"
          className="overflow-hidden rounded-[1.35rem] border border-night-900/8 shadow-[0_12px_40px_rgba(45,36,24,0.08)] ring-1 ring-night-900/5 dark:border-white/10"
        >
          <div className="border-b border-night-900/6 bg-gradient-to-br from-sand-50 via-white to-violet-50/50 px-5 py-4 dark:border-white/10 dark:from-[var(--color-bg-soft)] dark:via-[var(--color-surface)] dark:to-violet-950/30">
            <p className={editorialPremium.sectionLabel}>
              {editing ? "Edit entry" : "New entry"}
            </p>
            <h3 className={`${editorialPremium.sectionTitle} mt-1`}>
              {editing ? editing.title : "Add from YouTube or manually"}
            </h3>
            <p className="mt-1 text-sm text-night-600 dark:text-sand-300">
              Reference video, default key, and chord chart travel with the song into every plan.
            </p>
          </div>

          <div className="space-y-4 p-5">
            <div className="rounded-[1.15rem] border border-red-200/80 bg-gradient-to-br from-red-50/90 to-white p-4 dark:border-red-900/30 dark:from-red-950/25 dark:to-[var(--color-surface)]">
              <LibraryField label="YouTube link">
                <div className="flex flex-wrap gap-2">
                  <input
                    value={youtubeUrl}
                    onChange={(event) => setYoutubeUrl(event.target.value)}
                    placeholder="https://www.youtube.com/watch?v=…"
                    className={`${fieldClass} min-w-[220px] flex-1`}
                  />
                  <Button variant="secondary" onClick={lookupYouTube} disabled={lookingUp}>
                    {lookingUp ? "Loading…" : "Load from YouTube"}
                  </Button>
                </div>
              </LibraryField>
              {youtubeVideoId ? (
                <p className="mt-2 text-xs text-night-500">Video ID: {youtubeVideoId}</p>
              ) : null}
            </div>

            {youtubeVideoId ? (
              <WorshipYouTubeReference videoId={youtubeVideoId} title={title || undefined} />
            ) : null}

            <div className="grid gap-4 sm:grid-cols-2">
              <LibraryField label="Song title">
                <input
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  placeholder="Title"
                  className={fieldClass}
                />
              </LibraryField>
              <LibraryField label="Artist / writer">
                <input
                  value={artist}
                  onChange={(event) => setArtist(event.target.value)}
                  placeholder="Optional"
                  className={fieldClass}
                />
              </LibraryField>
              <LibraryField label="Default key">
                <input
                  value={defaultKey}
                  onChange={(event) => setDefaultKey(event.target.value)}
                  placeholder="C"
                  className={fieldClass}
                />
              </LibraryField>
              <LibraryField label="BPM">
                <input
                  value={bpm}
                  onChange={(event) => setBpm(event.target.value)}
                  placeholder="Optional"
                  className={fieldClass}
                />
              </LibraryField>
              <LibraryField label="CCLI number" className="sm:col-span-2">
                <input
                  value={ccliNumber}
                  onChange={(event) => setCcliNumber(event.target.value)}
                  placeholder="Optional"
                  className={fieldClass}
                />
              </LibraryField>
              <LibraryField label="Arrangement notes" className="sm:col-span-2">
                <textarea
                  value={notes}
                  onChange={(event) => setNotes(event.target.value)}
                  placeholder="Medley notes, who leads, etc."
                  rows={3}
                  className={`${fieldClass} resize-y`}
                />
              </LibraryField>
              <LibraryField label="Chord chart (PDF or image)" className="sm:col-span-2">
                <input
                  type="file"
                  accept=".pdf,image/*"
                  disabled={uploading}
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (file) uploadChart(file);
                  }}
                  className="mt-1 block w-full text-sm file:mr-3 file:rounded-full file:border-0 file:bg-night-900 file:px-4 file:py-2 file:text-xs file:font-semibold file:text-sand-50"
                />
                {chartFileName ? (
                  <span className="mt-2 block text-xs font-medium text-emerald-700 dark:text-emerald-300">
                    {chartFileName}
                  </span>
                ) : null}
              </LibraryField>
            </div>

            <div className="flex flex-wrap gap-2 border-t border-night-900/8 pt-4 dark:border-white/10">
              <Button onClick={saveSong} disabled={!canSave}>
                {editing ? "Update library song" : "Save to library"}
              </Button>
              <Button variant="secondary" onClick={resetForm}>
                Cancel
              </Button>
            </div>

            {message ? (
              <p
                className={`rounded-xl px-3 py-2 text-sm ${
                  message.includes("Could not") || message.includes("Paste")
                    ? "bg-amber-50 text-amber-900 ring-1 ring-amber-100 dark:bg-amber-950/30 dark:text-amber-100"
                    : "bg-emerald-50 text-emerald-900 ring-1 ring-emerald-100 dark:bg-emerald-950/30 dark:text-emerald-100"
                }`}
              >
                {message}
              </p>
            ) : null}
          </div>
        </MobilePremiumFrame>
      )}

      {!editorOpen && !editing ? (
        <button
          type="button"
          onClick={openNewSongEditor}
          className="w-full rounded-[1.25rem] border border-dashed border-night-900/15 px-4 py-4 text-sm font-semibold text-night-700 transition hover:border-violet-300 hover:bg-violet-50/50 dark:border-white/15 dark:text-sand-200 dark:hover:border-violet-700 dark:hover:bg-violet-950/20"
        >
          + Add or import a song
        </button>
      ) : null}
    </div>
  );
}
