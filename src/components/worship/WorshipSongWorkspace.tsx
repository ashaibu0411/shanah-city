"use client";

import { useState } from "react";
import {
  WORSHIP_PART_ROLES,
  worshipPartLabel,
  type WorshipSong,
  type WorshipSongPart,
} from "@/lib/worship-types";
import { WorshipPracticeStemEditor } from "@/components/worship/WorshipPracticeStemEditor";

type WorshipSongWorkspaceProps = {
  song: WorshipSong;
  expanded: boolean;
  onToggle: () => void;
  onChange: (patch: Partial<WorshipSong>) => void;
  readOnly?: boolean;
};

function updatePartNotes(parts: WorshipSongPart[] | undefined, role: string, notes: string) {
  const current = parts ?? [];
  const existing = current.find((part) => part.role === role);
  if (existing) {
    return current.map((part) => (part.role === role ? { ...part, notes } : part));
  }
  return [...current, { role, notes }];
}

export function WorshipSongWorkspace({
  song,
  expanded,
  onToggle,
  onChange,
  readOnly = false,
}: WorshipSongWorkspaceProps) {
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  async function uploadChart(file: File) {
    setUploading(true);
    setUploadError(null);
    const formData = new FormData();
    formData.append("file", file);
    const response = await fetch("/api/worship/charts", { method: "POST", body: formData });
    const data = await response.json();
    setUploading(false);

    if (!response.ok) {
      setUploadError(data.error ?? "Could not upload chart.");
      return;
    }

    onChange({ chartUrl: data.url, chartFileName: data.fileName });
  }

  const vocalParts = WORSHIP_PART_ROLES.filter((entry) => entry.kind === "vocal");
  const instrumentParts = WORSHIP_PART_ROLES.filter((entry) => entry.kind === "instrument");

  return (
    <div className="mt-3 border-t border-night-900/5 pt-3">
      <button
        type="button"
        onClick={onToggle}
        className="text-sm font-semibold text-violet-700 hover:underline"
      >
        {expanded ? "Hide song workspace" : "Open song workspace (lyrics, parts & tracks)"}
      </button>

      {expanded && (
        <div className="mt-4 space-y-4 rounded-xl bg-sand-50 p-4">
          <div className="grid gap-3 md:grid-cols-2">
            <label className="text-sm text-night-700">
              <span className="font-semibold">Service key</span>
              {readOnly ? (
                <p className="mt-1 font-medium text-night-900">{song.key}</p>
              ) : (
                <input
                  value={song.key}
                  onChange={(event) => onChange({ key: event.target.value })}
                  className="mt-1 block w-full rounded-xl border border-night-900/10 bg-white px-3 py-2 text-sm"
                />
              )}
            </label>
            <label className="text-sm text-night-700">
              <span className="font-semibold">Original key</span>
              {readOnly ? (
                <p className="mt-1 font-medium text-night-900">{song.originalKey ?? song.key}</p>
              ) : (
                <input
                  value={song.originalKey ?? song.key}
                  onChange={(event) => onChange({ originalKey: event.target.value })}
                  className="mt-1 block w-full rounded-xl border border-night-900/10 bg-white px-3 py-2 text-sm"
                />
              )}
            </label>
          </div>

          <label className="block text-sm text-night-700">
            <span className="font-semibold">Lyrics</span>
            {readOnly ? (
              <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-night-800">
                {song.lyrics?.trim() || "No lyrics added yet."}
              </p>
            ) : (
              <textarea
                value={song.lyrics ?? ""}
                onChange={(event) => onChange({ lyrics: event.target.value })}
                rows={6}
                placeholder="Paste lyrics for the team to learn from…"
                className="mt-2 w-full rounded-xl border border-night-900/10 bg-white p-3 text-sm outline-none ring-night-900/5 focus:ring-2"
              />
            )}
          </label>

          {!readOnly && (
            <label className="block text-sm text-night-700">
              <span className="font-semibold">Chord chart</span>
              <input
                type="file"
                accept=".pdf,image/*"
                disabled={uploading}
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file) uploadChart(file);
                  event.currentTarget.value = "";
                }}
                className="mt-2 block w-full text-sm"
              />
              {uploadError && <p className="mt-1 text-xs text-red-600">{uploadError}</p>}
            </label>
          )}

          <div>
            <p className="text-sm font-semibold text-night-800">Vocal parts</p>
            <div className="mt-2 space-y-2">
              {vocalParts.map((entry) => {
                const notes =
                  song.parts?.find((part) => part.role === entry.value)?.notes ?? "";
                return (
                  <label key={entry.value} className="block text-sm text-night-700">
                    <span className="font-medium">{entry.label}</span>
                    {readOnly ? (
                      <p className="mt-1 whitespace-pre-wrap text-sm text-night-800">
                        {notes.trim() || "—"}
                      </p>
                    ) : (
                      <textarea
                        value={notes}
                        onChange={(event) =>
                          onChange({
                            parts: updatePartNotes(song.parts, entry.value, event.target.value),
                          })
                        }
                        rows={2}
                        placeholder={`Notes for ${entry.label.toLowerCase()}…`}
                        className="mt-1 w-full rounded-xl border border-night-900/10 bg-white p-2 text-sm"
                      />
                    )}
                  </label>
                );
              })}
            </div>
          </div>

          <div>
            <p className="text-sm font-semibold text-night-800">Band parts</p>
            <div className="mt-2 space-y-2">
              {instrumentParts.map((entry) => {
                const notes =
                  song.parts?.find((part) => part.role === entry.value)?.notes ?? "";
                return (
                  <label key={entry.value} className="block text-sm text-night-700">
                    <span className="font-medium">{entry.label}</span>
                    {readOnly ? (
                      <p className="mt-1 whitespace-pre-wrap text-sm text-night-800">
                        {notes.trim() || "—"}
                      </p>
                    ) : (
                      <textarea
                        value={notes}
                        onChange={(event) =>
                          onChange({
                            parts: updatePartNotes(song.parts, entry.value, event.target.value),
                          })
                        }
                        rows={2}
                        placeholder={`Notes for ${entry.label.toLowerCase()}…`}
                        className="mt-1 w-full rounded-xl border border-night-900/10 bg-white p-2 text-sm"
                      />
                    )}
                  </label>
                );
              })}
            </div>
          </div>

          <WorshipPracticeStemEditor
            song={song}
            readOnly={readOnly}
            onChange={(practiceStems) => onChange({ practiceStems })}
          />

          {readOnly && song.parts?.some((part) => part.notes.trim()) && (
            <p className="text-xs text-night-500">
              Parts:{" "}
              {song.parts
                .filter((part) => part.notes.trim())
                .map((part) => worshipPartLabel(part.role))
                .join(", ")}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
