"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { COMMUNITY_STORY_OVERLAY_AUDIO_MAX_SEC } from "@/lib/community-media-shared";
import { uploadCommunityMediaClient } from "@/lib/community-media-client";

type CommunityStoryMemberAudioPanelProps = {
  mode: "record" | "upload";
  audioUrl: string | null;
  rightsAcknowledged: boolean;
  onAudioUrlChange: (url: string | null) => void;
  onRightsAckChange: (value: boolean) => void;
  onError: (message: string) => void;
};

function preferredRecorderMime() {
  if (typeof MediaRecorder === "undefined") return "";
  const candidates = ["audio/webm;codecs=opus", "audio/webm", "audio/mp4", "audio/ogg;codecs=opus"];
  return candidates.find((type) => MediaRecorder.isTypeSupported(type)) ?? "";
}

export function CommunityStoryMemberAudioPanel({
  mode,
  audioUrl,
  rightsAcknowledged,
  onAudioUrlChange,
  onRightsAckChange,
  onError,
}: CommunityStoryMemberAudioPanelProps) {
  const [recording, setRecording] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [previewPlaying, setPreviewPlaying] = useState(false);
  const [elapsedSec, setElapsedSec] = useState(0);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const previewRef = useRef<HTMLAudioElement | null>(null);
  const timerRef = useRef<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const stopRecording = useCallback(() => {
    if (timerRef.current != null) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
    recorderRef.current?.stop();
    recorderRef.current = null;
    setRecording(false);
  }, []);

  useEffect(() => () => stopRecording(), [stopRecording]);

  const uploadBlob = useCallback(
    async (blob: Blob, fileName: string) => {
      setUploading(true);
      onError("");
      try {
        const file = new File([blob], fileName, { type: blob.type || "audio/webm" });
        const { mediaUrl, mediaType } = await uploadCommunityMediaClient(file);
        if (mediaType !== "audio") {
          onError("Upload must be an audio file.");
          onAudioUrlChange(null);
          return;
        }
        onAudioUrlChange(mediaUrl);
      } catch (error) {
        onError(error instanceof Error ? error.message : "Could not upload audio.");
        onAudioUrlChange(null);
      } finally {
        setUploading(false);
      }
    },
    [onAudioUrlChange, onError],
  );

  const startRecording = useCallback(async () => {
    onError("");
    onAudioUrlChange(null);
    if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
      onError("Recording is not supported in this browser.");
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mime = preferredRecorderMime();
      const recorder = mime ? new MediaRecorder(stream, { mimeType: mime }) : new MediaRecorder(stream);
      chunksRef.current = [];
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) chunksRef.current.push(event.data);
      };
      recorder.onstop = () => {
        stream.getTracks().forEach((track) => track.stop());
        const blob = new Blob(chunksRef.current, { type: recorder.mimeType || "audio/webm" });
        const ext = blob.type.includes("mp4") ? "m4a" : blob.type.includes("ogg") ? "ogg" : "webm";
        void uploadBlob(blob, `story-recording-${Date.now()}.${ext}`);
      };
      recorderRef.current = recorder;
      recorder.start(250);
      setRecording(true);
      setElapsedSec(0);
      timerRef.current = window.setInterval(() => {
        setElapsedSec((value) => {
          if (value + 1 >= COMMUNITY_STORY_OVERLAY_AUDIO_MAX_SEC) {
            stopRecording();
          }
          return value + 1;
        });
      }, 1000);
    } catch {
      onError("Microphone permission is required to record.");
    }
  }, [onAudioUrlChange, onError, stopRecording, uploadBlob]);

  const handleFilePick = useCallback(
    async (file: File | null) => {
      onError("");
      onAudioUrlChange(null);
      if (!file) return;
      if (!file.type.startsWith("audio/") && !/\.(mp3|m4a|wav|ogg|webm|aac|caf)$/i.test(file.name)) {
        onError("Choose an audio file (MP3, M4A, WAV, WebM, OGG).");
        return;
      }
      await uploadBlob(file, file.name);
    },
    [onAudioUrlChange, onError, uploadBlob],
  );

  const togglePreview = useCallback(() => {
    const audio = previewRef.current;
    if (!audio || !audioUrl) return;
    if (previewPlaying) {
      audio.pause();
      setPreviewPlaying(false);
      return;
    }
    audio.src = audioUrl;
    void audio.play().then(() => setPreviewPlaying(true)).catch(() => onError("Could not preview audio."));
  }, [audioUrl, onError, previewPlaying]);

  useEffect(() => {
    if (!previewPlaying) return;
    const audio = previewRef.current;
    if (!audio) return;
    const onEnded = () => setPreviewPlaying(false);
    audio.addEventListener("ended", onEnded);
    return () => audio.removeEventListener("ended", onEnded);
  }, [previewPlaying]);

  return (
    <div className="mt-2 space-y-3 rounded-lg border border-night-900/10 bg-white/80 p-3 dark:border-white/10 dark:bg-night-950/40">
      {mode === "record" ? (
        <div className="space-y-2">
          <p className="text-xs text-night-600 dark:text-sand-400">
            Record up to {COMMUNITY_STORY_OVERLAY_AUDIO_MAX_SEC} seconds for your story. Your video&apos;s own sound
            stays untouched when you share a video.
          </p>
          {recording ? (
            <div className="flex items-center gap-2">
              <span className="inline-flex h-2 w-2 animate-pulse rounded-full bg-red-600" aria-hidden />
              <span className="text-sm font-semibold text-red-700 dark:text-red-300">
                Recording {elapsedSec}s / {COMMUNITY_STORY_OVERLAY_AUDIO_MAX_SEC}s
              </span>
              <button
                type="button"
                className="ml-auto rounded-full bg-night-900 px-3 py-1 text-xs font-semibold text-white dark:bg-sand-100 dark:text-night-900"
                onClick={stopRecording}
              >
                Stop
              </button>
            </div>
          ) : (
            <button
              type="button"
              className="w-full rounded-xl bg-clay-600 px-3 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
              disabled={uploading}
              onClick={() => void startRecording()}
            >
              {uploading ? "Uploading…" : "Start recording"}
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          <p className="text-xs text-night-600 dark:text-sand-400">
            Upload audio you own or have permission to use (not commercial songs ripped from speakers).
          </p>
          <input
            ref={fileInputRef}
            type="file"
            accept="audio/*,.mp3,.m4a,.wav,.ogg,.webm,.aac,.caf"
            className="sr-only"
            onChange={(event) => {
              const file = event.target.files?.[0] ?? null;
              void handleFilePick(file);
              event.target.value = "";
            }}
          />
          <button
            type="button"
            className="w-full rounded-xl border border-clay-600/40 bg-clay-500/10 px-3 py-2.5 text-sm font-semibold text-clay-900 dark:text-clay-100"
            disabled={uploading}
            onClick={() => fileInputRef.current?.click()}
          >
            {uploading ? "Uploading…" : "Choose audio file"}
          </button>
        </div>
      )}

      {audioUrl ? (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold text-emerald-800 dark:text-emerald-200">Audio ready</span>
          <button
            type="button"
            className="rounded-full bg-night-800 px-2.5 py-1 text-[11px] font-semibold text-white dark:bg-sand-200 dark:text-night-900"
            onClick={togglePreview}
          >
            {previewPlaying ? "Stop preview" : "Preview"}
          </button>
          <button
            type="button"
            className="text-[11px] font-semibold text-night-600 underline dark:text-sand-300"
            onClick={() => {
              onAudioUrlChange(null);
              setPreviewPlaying(false);
            }}
          >
            Remove
          </button>
        </div>
      ) : null}

      <audio ref={previewRef} playsInline className="sr-only" aria-hidden tabIndex={-1} />

      <label className="flex items-start gap-2 text-xs text-night-700 dark:text-sand-300">
        <input
          type="checkbox"
          className="mt-0.5"
          checked={rightsAcknowledged}
          onChange={(event) => onRightsAckChange(event.target.checked)}
        />
        <span>
          I confirm I have permission to post this audio (my voice, my content, or authorized material). Singing a
          cover or recording music from a speaker does not make it copyright-free. Report concerns via Messages to church
          leadership.
        </span>
      </label>
    </div>
  );
}
