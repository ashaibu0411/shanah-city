"use client";

import { useEffect, useRef, useState } from "react";
import { Button, Card } from "@/components/ui";
import type { WorshipRehearsalRecording } from "@/lib/worship-types";

type WorshipRehearsalRecordingsProps = {
  serviceDate: string;
  serviceTime: string;
  canManage: boolean;
  userId?: string;
};

function formatDuration(seconds?: number) {
  if (!seconds || !Number.isFinite(seconds)) return null;
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${String(secs).padStart(2, "0")}`;
}

export function WorshipRehearsalRecordings({
  serviceDate,
  serviceTime,
  canManage,
  userId,
}: WorshipRehearsalRecordingsProps) {
  const [recordings, setRecordings] = useState<WorshipRehearsalRecording[]>([]);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState("");
  const [recording, setRecording] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [hasCapture, setHasCapture] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);

  async function loadRecordings() {
    setLoading(true);
    const response = await fetch(
      `/api/worship/rehearsals?serviceDate=${encodeURIComponent(serviceDate)}&serviceTime=${encodeURIComponent(serviceTime)}`,
    );
    const data = await response.json();
    setLoading(false);

    if (response.ok) {
      setRecordings(data.recordings ?? []);
      return;
    }

    setError(data.error ?? "Could not load recordings.");
  }

  useEffect(() => {
    loadRecordings();
  }, [serviceDate, serviceTime]);

  useEffect(() => {
    return () => {
      if (timerRef.current) window.clearInterval(timerRef.current);
      mediaRecorderRef.current?.stop();
    };
  }, []);

  async function startRecording() {
    setError(null);
    setMessage(null);

    if (!navigator.mediaDevices?.getUserMedia) {
      setError("Recording is not supported in this browser.");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : "audio/webm";
      const recorder = new MediaRecorder(stream, { mimeType });
      chunksRef.current = [];
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) chunksRef.current.push(event.data);
      };
    recorder.onstop = () => {
      stream.getTracks().forEach((track) => track.stop());
      setHasCapture(chunksRef.current.length > 0);
    };
      mediaRecorderRef.current = recorder;
      recorder.start(1000);
      setRecording(true);
      setElapsed(0);
      timerRef.current = window.setInterval(() => {
        setElapsed((current) => current + 1);
      }, 1000);
    } catch {
      setError("Microphone access was denied. Allow the mic to record rehearsal.");
    }
  }

  function stopRecording() {
    const recorder = mediaRecorderRef.current;
    if (!recorder || recorder.state === "inactive") return;
    recorder.stop();
    if (timerRef.current) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setRecording(false);
  }

  async function uploadRecording() {
    const chunks = chunksRef.current;
    if (chunks.length === 0) {
      setError("Record something first, then upload.");
      return;
    }

    setUploading(true);
    setError(null);
    setMessage(null);

    const blob = new Blob(chunks, { type: chunks[0]?.type || "audio/webm" });
    const file = new File([blob], `rehearsal-${Date.now()}.webm`, { type: blob.type });
    const formData = new FormData();
    formData.append("file", file);
    formData.append("serviceDate", serviceDate);
    formData.append("serviceTime", serviceTime);
    formData.append("title", title.trim() || `Rehearsal ${new Date().toLocaleString()}`);
    formData.append("durationSeconds", String(elapsed));

    const response = await fetch("/api/worship/rehearsals", { method: "POST", body: formData });
    const data = await response.json();
    setUploading(false);

    if (response.ok) {
      setMessage("Recording uploaded for the team.");
      setTitle("");
      chunksRef.current = [];
      setHasCapture(false);
      setElapsed(0);
      loadRecordings();
      return;
    }

    setError(data.error ?? "Could not upload recording.");
  }

  async function deleteRecording(id: string) {
    const confirmed = window.confirm("Delete this rehearsal recording?");
    if (!confirmed) return;

    const response = await fetch("/api/worship/rehearsals", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    const data = await response.json();

    if (response.ok) {
      setRecordings((current) => current.filter((entry) => entry.id !== id));
      return;
    }

    setError(data.error ?? "Could not delete recording.");
  }

  return (
    <div className="space-y-4">
      <Card>
        <h3 className="font-display text-lg font-semibold text-night-900">Rehearsal recordings</h3>
        <p className="mt-2 text-sm text-night-600">
          Record in rehearsal and upload so the choir can listen back and compare later. Recordings
          stay with this service date and time.
        </p>

        <div className="mt-4 space-y-3">
          <label className="block text-sm text-night-700">
            <span className="font-semibold">Title (optional)</span>
            <input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="e.g. Full run-through, verse 2 focus"
              className="mt-1 block w-full rounded-xl border border-night-900/10 bg-sand-50 px-3 py-2.5 text-sm"
            />
          </label>

          <div className="flex flex-wrap items-center gap-3">
            {!recording ? (
              <Button onClick={startRecording} disabled={uploading}>
                Start recording
              </Button>
            ) : (
              <>
                <Button variant="secondary" onClick={stopRecording}>
                  Stop
                </Button>
                <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-semibold text-red-800">
                  Recording · {formatDuration(elapsed)}
                </span>
              </>
            )}
            <Button
              variant="secondary"
              onClick={uploadRecording}
              disabled={recording || uploading || !hasCapture}
            >
              {uploading ? "Uploading…" : "Upload for team"}
            </Button>
          </div>

          {message && <p className="text-sm text-emerald-700">{message}</p>}
          {error && <p className="text-sm text-red-600">{error}</p>}
        </div>
      </Card>

      <Card>
        <h4 className="font-semibold text-night-900">Saved for this service</h4>
        {loading ? (
          <p className="mt-3 text-sm text-night-500">Loading recordings…</p>
        ) : recordings.length === 0 ? (
          <p className="mt-3 text-sm text-night-500">No recordings yet for this service.</p>
        ) : (
          <ul className="mt-4 space-y-4">
            {recordings.map((entry) => {
              const canDelete = canManage || entry.recordedBy === userId;
              return (
                <li
                  key={entry.id}
                  className="rounded-xl border border-night-900/5 p-4"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-night-900">{entry.title}</p>
                      <p className="mt-1 text-xs text-night-500">
                        {entry.recordedByName}
                        {entry.durationSeconds ? ` · ${formatDuration(entry.durationSeconds)}` : ""}
                        {" · "}
                        {new Date(entry.createdAt).toLocaleString()}
                      </p>
                    </div>
                    {canDelete && (
                      <Button variant="secondary" onClick={() => deleteRecording(entry.id)}>
                        Delete
                      </Button>
                    )}
                  </div>
                  <audio controls preload="metadata" className="mt-3 w-full" src={entry.audioUrl}>
                    Your browser does not support audio playback.
                  </audio>
                </li>
              );
            })}
          </ul>
        )}
      </Card>
    </div>
  );
}
