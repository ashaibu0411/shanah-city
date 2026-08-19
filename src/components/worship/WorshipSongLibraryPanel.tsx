"use client";

import { useEffect, useState } from "react";
import { Button, Card } from "@/components/ui";
import { WorshipYouTubeReference } from "@/components/worship/WorshipYouTubeReference";
import { getYouTubeClipThumbnail } from "@/lib/media-clips-utils";
import type { WorshipLibrarySong } from "@/lib/worship-types";

type WorshipSongLibraryPanelProps = {
  onAddToPlan?: (song: WorshipLibrarySong) => void;
};

export function WorshipSongLibraryPanel({ onAddToPlan }: WorshipSongLibraryPanelProps) {
  const [songs, setSongs] = useState<WorshipLibrarySong[]>([]);
  const [query, setQuery] = useState("");
  const [editing, setEditing] = useState<WorshipLibrarySong | null>(null);
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

  async function loadSongs(search = query) {
    const params = search ? `?q=${encodeURIComponent(search)}` : "";
    const response = await fetch(`/api/worship/songs${params}`);
    const data = await response.json();
    if (response.ok) {
      setSongs(data.songs ?? []);
    }
  }

  useEffect(() => {
    loadSongs();
  }, []);

  function resetForm() {
    setEditing(null);
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
    <div className="space-y-6">
      <Card>
        <h3 className="font-display text-lg font-semibold text-night-900">Song library</h3>
        <p className="mt-1 text-sm text-night-600">
          Most songs come from Shanah City YouTube. Paste a link to import, then reuse across
          services with keys, charts, and part tracks.
        </p>

        <div className="mt-4 flex flex-wrap gap-2">
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search songs…"
            className="min-w-[220px] flex-1 rounded-xl border border-night-900/10 bg-white px-3 py-2.5 text-sm outline-none ring-night-900/5 focus:ring-2"
          />
          <Button variant="secondary" onClick={() => loadSongs(query)}>
            Search
          </Button>
        </div>

        <div className="mt-4 space-y-2">
          {songs.length === 0 ? (
            <p className="text-sm text-night-500">No songs in the library yet.</p>
          ) : (
            songs.map((song) => (
              <div
                key={song.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-night-900/5 px-4 py-3"
              >
                <div className="flex min-w-0 items-start gap-3">
                  {song.youtubeVideoId ? (
                    <img
                      src={getYouTubeClipThumbnail(song.youtubeVideoId)}
                      alt=""
                      className="h-12 w-20 shrink-0 rounded-lg object-cover"
                    />
                  ) : (
                    <div className="flex h-12 w-20 shrink-0 items-center justify-center rounded-lg bg-sand-100 text-[10px] font-semibold uppercase tracking-wide text-night-500">
                      Song
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="font-semibold text-night-900">{song.title}</p>
                    <p className="text-xs text-night-500">
                      Key {song.defaultKey}
                      {song.artist ? ` · ${song.artist}` : ""}
                      {song.youtubeVideoId ? " · YouTube" : ""}
                      {song.ccliNumber ? ` · CCLI ${song.ccliNumber}` : ""}
                      {song.useCount > 0 ? ` · Used ${song.useCount}×` : ""}
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {song.youtubeVideoId && (
                    <WorshipYouTubeReference videoId={song.youtubeVideoId} compact />
                  )}
                  {song.chartUrl && (
                    <a
                      href={song.chartUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="rounded-lg bg-sand-100 px-3 py-1.5 text-xs font-semibold text-night-800"
                    >
                      Chart
                    </a>
                  )}
                  {onAddToPlan && (
                    <Button variant="secondary" onClick={() => onAddToPlan(song)}>
                      Add to plan
                    </Button>
                  )}
                  <Button variant="secondary" onClick={() => startEdit(song)}>
                    Edit
                  </Button>
                  <Button variant="secondary" onClick={() => deleteSong(song.id)}>
                    Delete
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </Card>

      <Card>
        <h3 className="font-display text-lg font-semibold text-night-900">
          {editing ? "Edit library song" : "Add from YouTube or manually"}
        </h3>
        <p className="mt-1 text-sm text-night-600">
          Paste a YouTube worship video, live recording, or rehearsal track. We pull the title
          automatically — you add the service key and chart.
        </p>

        <div className="mt-4 rounded-xl bg-red-50 p-4 ring-1 ring-red-100">
          <label className="block text-sm font-semibold text-night-800">YouTube link</label>
          <div className="mt-2 flex flex-wrap gap-2">
            <input
              value={youtubeUrl}
              onChange={(event) => setYoutubeUrl(event.target.value)}
              placeholder="https://www.youtube.com/watch?v=… or youtu.be/…"
              className="min-w-[240px] flex-1 rounded-xl border border-night-900/10 bg-white px-3 py-2.5 text-sm"
            />
            <Button variant="secondary" onClick={lookupYouTube} disabled={lookingUp}>
              {lookingUp ? "Loading…" : "Load from YouTube"}
            </Button>
          </div>
          {youtubeVideoId && (
            <p className="mt-2 text-xs text-night-600">Video ID: {youtubeVideoId}</p>
          )}
        </div>

        {youtubeVideoId && (
          <WorshipYouTubeReference videoId={youtubeVideoId} title={title || undefined} />
        )}

        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Song title"
            className="rounded-xl border border-night-900/10 bg-white px-3 py-2.5 text-sm"
          />
          <input
            value={artist}
            onChange={(event) => setArtist(event.target.value)}
            placeholder="Artist / writer"
            className="rounded-xl border border-night-900/10 bg-white px-3 py-2.5 text-sm"
          />
          <input
            value={defaultKey}
            onChange={(event) => setDefaultKey(event.target.value)}
            placeholder="Default key"
            className="rounded-xl border border-night-900/10 bg-white px-3 py-2.5 text-sm"
          />
          <input
            value={bpm}
            onChange={(event) => setBpm(event.target.value)}
            placeholder="BPM"
            className="rounded-xl border border-night-900/10 bg-white px-3 py-2.5 text-sm"
          />
          <input
            value={ccliNumber}
            onChange={(event) => setCcliNumber(event.target.value)}
            placeholder="CCLI # (optional)"
            className="rounded-xl border border-night-900/10 bg-white px-3 py-2.5 text-sm md:col-span-2"
          />
          <textarea
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            placeholder="Arrangement notes"
            rows={2}
            className="rounded-xl border border-night-900/10 bg-white px-3 py-2.5 text-sm md:col-span-2"
          />
          <label className="text-sm text-night-700 md:col-span-2">
            <span className="font-semibold">Chord chart (PDF or image)</span>
            <input
              type="file"
              accept=".pdf,image/*"
              disabled={uploading}
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) uploadChart(file);
              }}
              className="mt-1 block w-full text-sm"
            />
            {chartFileName && (
              <span className="mt-1 block text-xs text-night-500">{chartFileName}</span>
            )}
          </label>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <Button onClick={saveSong} disabled={!canSave}>
            {editing ? "Update song" : "Save to library"}
          </Button>
          {editing && (
            <Button variant="secondary" onClick={resetForm}>
              Cancel edit
            </Button>
          )}
        </div>
        {message && <p className="mt-3 text-sm text-night-600">{message}</p>}
      </Card>
    </div>
  );
}
