"use client";

import { useEffect, useState } from "react";
import { Button, Card } from "@/components/ui";
import type { WorshipLibrarySong } from "@/lib/worship-types";

type WorshipSongLibraryPanelProps = {
  onAddToPlan?: (song: WorshipLibrarySong) => void;
};

export function WorshipSongLibraryPanel({ onAddToPlan }: WorshipSongLibraryPanelProps) {
  const [songs, setSongs] = useState<WorshipLibrarySong[]>([]);
  const [query, setQuery] = useState("");
  const [editing, setEditing] = useState<WorshipLibrarySong | null>(null);
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
    setTitle(song.title);
    setArtist(song.artist ?? "");
    setDefaultKey(song.defaultKey);
    setBpm(song.bpm ? String(song.bpm) : "");
    setCcliNumber(song.ccliNumber ?? "");
    setNotes(song.notes ?? "");
    setChartUrl(song.chartUrl ?? "");
    setChartFileName(song.chartFileName ?? "");
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
      }),
    });
    const data = await response.json();
    if (response.ok) {
      setMessage(editing ? "Song updated." : "Song added to library.");
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

  return (
    <div className="space-y-6">
      <Card>
        <h3 className="font-display text-lg font-semibold text-night-900">Song library</h3>
        <p className="mt-1 text-sm text-night-600">
          Reuse favorites across services. Store default keys, CCLI numbers, and chord charts.
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
                <div>
                  <p className="font-semibold text-night-900">{song.title}</p>
                  <p className="text-xs text-night-500">
                    Key {song.defaultKey}
                    {song.artist ? ` · ${song.artist}` : ""}
                    {song.ccliNumber ? ` · CCLI ${song.ccliNumber}` : ""}
                    {song.useCount > 0 ? ` · Used ${song.useCount}×` : ""}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
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
          {editing ? "Edit library song" : "Add library song"}
        </h3>
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
          <label className="md:col-span-2 text-sm text-night-700">
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
          <Button onClick={saveSong} disabled={!title.trim()}>
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
