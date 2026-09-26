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
import { formatRecordingElapsed, useAudioRecorder } from "@/lib/use-audio-recorder";
import { WorshipAudioPlayer } from "@/components/worship/WorshipAudioPlayer";

type WorshipPracticeStemEditorProps = {
  song: WorshipSong;
  onChange: (stems: WorshipPracticeStem[]) => void;
  readOnly?: boolean;
  canReviewMemberUploads?: boolean;
  onReviewStem?: (partRole: string, decision: "approve" | "remove") => void;
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
  canReviewMemberUploads = false,
  onReviewStem,
}: WorshipPracticeStemEditorProps) {
  const [uploadingRole, setUploadingRole] = useState<string | null>(null);
  const [activeRole, setActiveRole] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const recorder = useAudioRecorder();

  async function uploadStem(role: string, file: File) {
    setUploadingRole(role);
    setError(null);
    recorder.setError(null);
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
    if (activeRole === role) {
      recorder.clearCapture();
      setActiveRole(null);
    }
  }

  function removeStem(role: string) {
    onChange(removePracticeStem(song.practiceStems, role));
  }

  async function startRecording(role: string) {
    if (uploadingRole) return;
    if (recorder.recording && activeRole !== role) return;
    setActiveRole(role);
    recorder.clearCapture();
    const started = await recorder.start();
    if (!started) {
      setActiveRole(null);
    }
  }

  function stopRecording() {
    recorder.stop();
  }

  async function attachRecording(role: string) {
    const file = recorder.buildFile(`practice-${role}`);
    if (!file) {
      setError("Record something first, then attach.");
      return;
    }
    await uploadStem(role, file);
  }

  const stemCount = song.practiceStems?.length ?? 0;
  const displayError = error ?? recorder.error;

  return (
    <div>
      <p className="text-sm font-semibold text-night-800">Practice tracks</p>
      <p className="mt-1 text-xs leading-relaxed text-night-500">
        Record a part here or upload from your phone (voice memo, Moises, DAW, etc.). Soprano hears
        soprano, alto hears alto — save the plan after attaching tracks. Reference tracks (full mix,
        instrumental) help everyone practice too.
      </p>

      {displayError && <p className="mt-2 text-xs text-red-600">{displayError}</p>}

      <div className="mt-3 space-y-3">
        {UPLOAD_SLOTS.map((slot) => {
          const stem = getSongPracticeStem(song, slot.value);
          const label = worshipPracticeStemLabel(slot.value);
          const isActive = activeRole === slot.value;
          const isRecording = isActive && recorder.recording;
          const canAttach = isActive && recorder.hasCapture && !recorder.recording;
          const busy = uploadingRole !== null || (recorder.recording && !isActive);

          return (
            <div
              key={slot.value}
              className="rounded-xl border border-night-900/5 bg-white p-3"
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-medium text-night-900">{label}</p>
                  {stem ? (
                    <p className="mt-0.5 text-xs text-night-500">
                      {stem.fileName}
                      {stem.uploadedByName ? ` · ${stem.uploadedByName}` : ""}
                      {stem.status === "pending" ? " · Pending approval" : ""}
                    </p>
                  ) : (
                    <p className="mt-0.5 text-xs text-night-400">No track yet</p>
                  )}
                </div>
                {!readOnly && (
                  <div className="flex flex-wrap items-center gap-2">
                    {!isRecording ? (
                      <Button
                        type="button"
                        variant="secondary"
                        disabled={busy || uploadingRole === slot.value}
                        onClick={() => startRecording(slot.value)}
                      >
                        Record
                      </Button>
                    ) : (
                      <>
                        <Button type="button" variant="secondary" onClick={stopRecording}>
                          Stop
                        </Button>
                        <span className="rounded-full bg-red-100 px-2.5 py-0.5 text-[10px] font-semibold text-red-800">
                          {formatRecordingElapsed(recorder.elapsed)}
                        </span>
                      </>
                    )}
                    {canAttach && (
                      <Button
                        type="button"
                        onClick={() => attachRecording(slot.value)}
                        disabled={uploadingRole === slot.value}
                      >
                        {uploadingRole === slot.value ? "Attaching…" : "Attach recording"}
                      </Button>
                    )}
                    <label
                      className={`cursor-pointer rounded-full bg-violet-100 px-3 py-1 text-xs font-semibold text-violet-900 hover:bg-violet-200 ${
                        busy ? "pointer-events-none opacity-50" : ""
                      }`}
                    >
                      {uploadingRole === slot.value ? "Uploading…" : stem ? "Replace file" : "Upload file"}
                      <input
                        type="file"
                        accept="audio/*,.mp3,.m4a,.wav,.ogg,.webm"
                        className="hidden"
                        disabled={busy || uploadingRole !== null}
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
                    {canReviewMemberUploads && stem?.status === "pending" && onReviewStem && (
                      <>
                        <Button onClick={() => onReviewStem(slot.value, "approve")}>Approve</Button>
                        <Button variant="secondary" onClick={() => onReviewStem(slot.value, "remove")}>
                          Reject
                        </Button>
                      </>
                    )}
                  </div>
                )}
              </div>
              {stem && (
                <WorshipAudioPlayer
                  className="mt-2 w-full"
                  src={stem.audioUrl}
                  fileName={stem.fileName}
                />
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
