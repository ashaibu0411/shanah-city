"use client";

import { useState } from "react";
import { Button } from "@/components/ui";
import { getSongPracticeStem, worshipPartLabel, type WorshipSong } from "@/lib/worship-types";

type WorshipMemberPartRecordingProps = {
  serviceDate: string;
  serviceTime: string;
  song: WorshipSong;
  partRole: string;
  userId?: string;
  onUpdated?: (song: WorshipSong) => void;
};

export function WorshipMemberPartRecording({
  serviceDate,
  serviceTime,
  song,
  partRole,
  userId,
  onUpdated,
}: WorshipMemberPartRecordingProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const stem = getSongPracticeStem(song, partRole);
  const isOwnPending = stem?.status === "pending" && stem.uploadedBy === userId;
  const isOwnApproved = stem?.status === "approved" && stem.uploadedBy === userId;

  async function uploadRecording(file: File) {
    setUploading(true);
    setError(null);
    setMessage(null);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("serviceDate", serviceDate);
    formData.append("serviceTime", serviceTime);
    formData.append("songId", song.id);
    formData.append("partRole", partRole);

    const response = await fetch("/api/worship/practice-audio", { method: "POST", body: formData });
    const data = await response.json();
    setUploading(false);

    if (!response.ok) {
      setError(data.error ?? "Could not upload recording.");
      return;
    }

    if (data.plan && onUpdated) {
      const updatedSong = data.plan.songs.find((entry: WorshipSong) => entry.id === song.id);
      if (updatedSong) onUpdated(updatedSong);
    }

    setMessage(
      data.status === "pending"
        ? "Recording uploaded — your leader will review it."
        : "Recording uploaded.",
    );
  }

  return (
    <div className="mt-4 rounded-xl border border-night-900/5 bg-white p-4">
      <p className="text-sm font-semibold text-night-900">
        Record your {worshipPartLabel(partRole).toLowerCase()} line
      </p>
      <p className="mt-1 text-xs text-night-500">
        Record or upload a short clip of your part so leaders can hear your approach. Use a voice
        memo or sing along to the YouTube reference — we do not download from YouTube.
      </p>

      {stem && (
        <div className="mt-3">
          <p className="text-xs text-night-500">
            {stem.fileName}
            {isOwnPending && " · Awaiting leader approval"}
            {isOwnApproved && " · Approved"}
          </p>
          {(stem.status === "approved" || stem.uploadedBy === userId) && (
            <audio controls preload="metadata" className="mt-2 w-full" src={stem.audioUrl}>
              Your browser does not support audio playback.
            </audio>
          )}
        </div>
      )}

      {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
      {message && <p className="mt-2 text-xs text-emerald-700">{message}</p>}

      <label className="mt-3 inline-block cursor-pointer rounded-full bg-violet-100 px-4 py-2 text-xs font-semibold text-violet-900 hover:bg-violet-200">
        {uploading ? "Uploading…" : stem ? "Replace recording" : "Upload recording"}
        <input
          type="file"
          accept="audio/*,.mp3,.m4a,.wav,.ogg,.webm"
          className="hidden"
          disabled={uploading}
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) uploadRecording(file);
            event.currentTarget.value = "";
          }}
        />
      </label>
    </div>
  );
}
