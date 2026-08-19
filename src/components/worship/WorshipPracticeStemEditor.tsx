"use client";

import { useState } from "react";
import { Button } from "@/components/ui";
import {
  WORSHIP_PART_ROLES,
  WORSHIP_PRACTICE_REFERENCE_STEMS,
  getSongPracticeStem,
  removePracticeStem,
  upsertPracticeStem,
  worshipPracticeStemLabel,
  type WorshipPracticeStem,
  type WorshipSong,
} from "@/lib/worship-types";

type WorshipPracticeStemEditorProps = {
  song: WorshipSong;
  onChange: (stems: WorshipPracticeStem[]) => void;
  readOnly?: boolean;
};

const UPLOAD_SLOTS = [
  ...WORSHIP_PART_ROLES.filter((entry) => entry.kind === "vocal"),
  ...WORSHIP_PRACTICE_REFERENCE_STEMS,
  ...WORSHIP_PART_ROLES.filter((entry) => entry.kind === "instrument"),
];

export function WorshipPracticeStemEditor({
  song,
  onChange,
  readOnly = false,
}: WorshipPracticeStemEditorProps) {
  const [uploadingRole, setUploadingRole] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function uploadStem(role: string, file: File) {
    setUploadingRole(role);
    setError(null);
    const formData = new FormData();
    formData.append("file", file);
    const response = await fetch("/api/worship/practice-audio", { method: "POST", body: formData });
    const data = await response.json();
    setUploadingRole(null);

    if (!response.ok) {
      setError(data.error ?? "Could not upload practice track.");
      return;
    }

    onChange(
      upsertPracticeStem(song.practiceStems, role, {
        audioUrl: data.url,
        fileName: data.fileName,
        uploadedAt: data.uploadedAt,
      }),
    );
  }

  function removeStem(role: string) {
    onChange(removePracticeStem(song.practiceStems, role));
  }

  const stemCount = song.practiceStems?.length ?? 0;

  return (
    <div>
      <p className="text-sm font-semibold text-night-800">Practice tracks</p>
      <p className="mt-1 text-xs leading-relaxed text-night-500">
        Upload isolated part recordings (from your DAW, Moises, etc.). Soprano hears soprano, alto
        hears alto — save the plan after uploading. Reference tracks (full mix, instrumental) help
        everyone practice too.
      </p>

      {error && <p className="mt-2 text-xs text-red-600">{error}</p>}

      <div className="mt-3 space-y-3">
        {UPLOAD_SLOTS.map((slot) => {
          const stem = getSongPracticeStem(song, slot.value);
          const label = worshipPracticeStemLabel(slot.value);

          return (
            <div
              key={slot.value}
              className="rounded-xl border border-night-900/5 bg-white p-3"
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-medium text-night-900">{label}</p>
                  {stem ? (
                    <p className="mt-0.5 text-xs text-night-500">{stem.fileName}</p>
                  ) : (
                    <p className="mt-0.5 text-xs text-night-400">No track uploaded</p>
                  )}
                </div>
                {!readOnly && (
                  <div className="flex flex-wrap gap-2">
                    <label className="cursor-pointer rounded-full bg-violet-100 px-3 py-1 text-xs font-semibold text-violet-900 hover:bg-violet-200">
                      {uploadingRole === slot.value ? "Uploading…" : stem ? "Replace" : "Upload"}
                      <input
                        type="file"
                        accept="audio/*,.mp3,.m4a,.wav,.ogg,.webm"
                        className="hidden"
                        disabled={uploadingRole !== null}
                        onChange={(event) => {
                          const file = event.target.files?.[0];
                          if (file) uploadStem(slot.value, file);
                          event.currentTarget.value = "";
                        }}
                      />
                    </label>
                    {stem && (
                      <Button variant="secondary" onClick={() => removeStem(slot.value)}>
                        Remove
                      </Button>
                    )}
                  </div>
                )}
              </div>
              {stem && (
                <audio controls preload="metadata" className="mt-2 w-full" src={stem.audioUrl}>
                  Your browser does not support audio playback.
                </audio>
              )}
            </div>
          );
        })}
      </div>

      {stemCount > 0 && readOnly && (
        <p className="mt-2 text-xs text-night-500">
          {stemCount} practice track{stemCount === 1 ? "" : "s"} available for this song.
        </p>
      )}
    </div>
  );
}
