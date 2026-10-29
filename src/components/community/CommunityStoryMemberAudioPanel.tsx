"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { COMMUNITY_STORY_OVERLAY_AUDIO_MAX_SEC, normalizeCommunityFileMime } from "@/lib/community-media-shared";
import { uploadCommunityMediaClient } from "@/lib/community-media-client";
import {
  createAudioMediaRecorder,
  extensionForRecorderMime,
  getWorshipRecordingMediaStream,
  isMediaRecorderSupported,
} from "@/lib/worship-audio-shared";

type CommunityStoryMemberAudioPanelProps = {
  mode: "record" | "upload";
  audioUrl: string | null;
  rightsAcknowledged: boolean;
  onAudioUrlChange: (url: string | null) => void;
  onRightsAckChange: (value: boolean) => void;
  onError: (message: string) => void;
};

function storyRecordingFileName(mimeType: string) {
  const ext = extensionForRecorderMime(mimeType).replace(/^\./, "") || "webm";
  return `story-recording-${Date.now()}.${ext}`;
}

function normalizeRecordingMime(mimeType: string) {
  const base = normalizeCommunityFileMime(mimeType);
  if (base === "video/webm") return "audio/webm";
  if (base.startsWith("audio/")) return base;
  return mimeType.trim() || "audio/webm";
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
  const recorderMimeRef = useRef("");
  const chunksRef = useRef<BlobPart[]>([]);
  const previewRef = useRef<HTMLAudioElement | null>(null);
  const timerRef = useRef<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const pendingRecordingRef = useRef<{ blob: Blob; fileName: string; mimeType: string } | null>(null);
  const [localPreviewUrl, setLocalPreviewUrl] = useState<string | null>(null);
  const [uploadFailed, setUploadFailed] = useState(false);

  const revokeLocalPreview = useCallback(() => {
    if (localPreviewUrl?.startsWith("blob:")) {
      URL.revokeObjectURL(localPreviewUrl);
    }
    setLocalPreviewUrl(null);
    pendingRecordingRef.current = null;
    setUploadFailed(false);
  }, [localPreviewUrl]);

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

  useEffect(() => () => revokeLocalPreview(), [revokeLocalPreview]);

  const uploadBlob = useCallback(
    async (blob: Blob, fileName: string, mimeType: string, options?: { keepLocalPreview?: boolean }) => {
      setUploading(true);
      onError("");
      setUploadFailed(false);
      try {
        const normalizedType = normalizeRecordingMime(mimeType || blob.type);
        const file = new File([blob], fileName, { type: normalizedType });
        if (file.size < 256) {
          onError("Recording was too short. Try again and speak for a few seconds.");
          onAudioUrlChange(null);
          revokeLocalPreview();
          return;
        }
        pendingRecordingRef.current = { blob, fileName, mimeType: normalizedType };
        if (options?.keepLocalPreview !== false) {
          const preview = URL.createObjectURL(blob);
          setLocalPreviewUrl((previous) => {
            if (previous?.startsWith("blob:")) URL.revokeObjectURL(previous);
            return preview;
          });
        }
        const { mediaUrl, mediaType } = await uploadCommunityMediaClient(file);
        if (mediaType !== "audio") {
          onError("Upload must be an audio file.");
          onAudioUrlChange(null);
          setUploadFailed(true);
          return;
        }
        revokeLocalPreview();
        onAudioUrlChange(mediaUrl);
      } catch (error) {
        onError(error instanceof Error ? error.message : "Could not upload audio.");
        onAudioUrlChange(null);
        setUploadFailed(true);
      } finally {
        setUploading(false);
      }
    },
    [onAudioUrlChange, onError, revokeLocalPreview],
  );

  const retryUpload = useCallback(() => {
    const pending = pendingRecordingRef.current;
    if (!pending) return;
    void uploadBlob(pending.blob, pending.fileName, pending.mimeType, { keepLocalPreview: false });
  }, [uploadBlob]);

  const startRecording = useCallback(async () => {
    onError("");
    onAudioUrlChange(null);
    revokeLocalPreview();
    if (!isMediaRecorderSupported()) {
      onError("Recording is not supported in this browser.");
      return;
    }
    try {
      const stream = await getWorshipRecordingMediaStream();
      const recorder = createAudioMediaRecorder(stream);
      const mimeType = recorder.mimeType || "audio/webm";
      recorderMimeRef.current = mimeType;
      chunksRef.current = [];
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) chunksRef.current.push(event.data);
      };
      recorder.onstop = () => {
        stream.getTracks().forEach((track) => track.stop());
        const blobType = normalizeRecordingMime(recorderMimeRef.current || "audio/webm");
        const blob = new Blob(chunksRef.current, { type: blobType });
        const fileName = storyRecordingFileName(recorderMimeRef.current || blobType);
        void uploadBlob(blob, fileName, blobType);
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
  }, [onAudioUrlChange, onError, revokeLocalPreview, stopRecording, uploadBlob]);

  const handleFilePick = useCallback(
    async (file: File | null) => {
      onError("");
      onAudioUrlChange(null);
      revokeLocalPreview();
      if (!file) return;
      if (!file.type.startsWith("audio/") && !/\.(mp3|m4a|wav|ogg|webm|aac|caf)$/i.test(file.name)) {
        onError("Choose an audio file (MP3, M4A, WAV, WebM, OGG).");
        return;
      }
      await uploadBlob(file, file.name, file.type);
    },
    [onAudioUrlChange, onError, revokeLocalPreview, uploadBlob],
  );

  const previewSourceUrl = audioUrl ?? localPreviewUrl;

  const togglePreview = useCallback(() => {
    const audio = previewRef.current;
    if (!audio || !previewSourceUrl) return;
    if (previewPlaying) {
      audio.pause();
      setPreviewPlaying(false);
      return;
    }
    audio.src = previewSourceUrl;
    void audio.play().then(() => setPreviewPlaying(true)).catch(() => onError("Could not preview audio."));
  }, [onError, previewPlaying, previewSourceUrl]);

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

      {previewSourceUrl ? (
        <div
          className={`flex flex-wrap items-center gap-2 rounded-lg px-3 py-2 ${
            audioUrl ? "bg-emerald-500/10" : "bg-amber-500/10"
          }`}
        >
          <span
            className={`text-xs font-semibold ${
              audioUrl
                ? "text-emerald-800 dark:text-emerald-200"
                : "text-amber-900 dark:text-amber-100"
            }`}
          >
            {audioUrl ? "Voice attached" : uploadFailed ? "Recording ready — upload failed" : "Recording ready"}
          </span>
          <button
            type="button"
            className="rounded-full bg-emerald-700 px-2.5 py-1 text-xs font-semibold text-white"
            onClick={togglePreview}
          >
            {previewPlaying ? "Stop preview" : "Preview"}
          </button>
          {uploadFailed && pendingRecordingRef.current ? (
            <button
              type="button"
              className="rounded-full bg-clay-600 px-2.5 py-1 text-xs font-semibold text-white disabled:opacity-50"
              disabled={uploading}
              onClick={retryUpload}
            >
              {uploading ? "Uploading…" : "Retry upload"}
            </button>
          ) : null}
          <button
            type="button"
            className="rounded-full border border-emerald-700/40 px-2.5 py-1 text-xs font-semibold text-emerald-900 dark:text-emerald-100"
            onClick={() => {
              revokeLocalPreview();
              onAudioUrlChange(null);
            }}
          >
            Remove
          </button>
          <audio ref={previewRef} playsInline className="sr-only" aria-hidden />
        </div>
      ) : null}

      <label className="flex cursor-pointer items-start gap-2 text-xs text-night-700 dark:text-sand-300">
        <input
          type="checkbox"
          checked={rightsAcknowledged}
          onChange={(event) => onRightsAckChange(event.target.checked)}
          className="mt-0.5"
        />
        <span>I have rights to use this audio on my story (my voice or content I am allowed to share).</span>
      </label>
    </div>
  );
}
