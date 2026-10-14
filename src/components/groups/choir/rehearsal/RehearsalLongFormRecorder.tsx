"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { WorshipAudioPlayer } from "@/components/worship/WorshipAudioPlayer";
import {
  CHOIR_RECORDING_CATEGORIES,
  CHOIR_RECORDING_VISIBILITY,
  choirRecordingCategoryLabel,
  defaultChoirRecordingTitle,
  formatRecordingDurationHms,
  type ChoirRecordingCategory,
  type ChoirRecordingVisibility,
} from "@/lib/choir-rehearsal-recording-types";
import {
  removePendingRehearsalUpload,
  savePendingRehearsalUpload,
  type PendingRehearsalUploadMeta,
} from "@/lib/rehearsal-recording-pending-upload";
import { uploadAndRegisterPending } from "@/lib/rehearsal-recording-upload";
import {
  ensureNativeRecorderPermission,
  isShanahNativeRecorderSupported,
  nativeRecordingPathToBlob,
  ShanahNativeRecorder,
} from "@/lib/shanah-native-recorder";
import {
  createAudioMediaRecorder,
  extensionForRecorderMime,
  isMediaRecorderSupported,
  pickMediaRecorderMimeType,
} from "@/lib/worship-audio-shared";
import type { WorshipSong } from "@/lib/worship-types";

type RecorderPhase = "setup" | "recording" | "review";

type RehearsalLongFormRecorderProps = {
  groupId: string;
  serviceDate?: string;
  serviceTime?: string;
  songs?: WorshipSong[];
  defaultCategory?: ChoirRecordingCategory;
  defaultSongId?: string | null;
  memberPartRole?: string | null;
  canManage?: boolean;
};

export function RehearsalLongFormRecorder({
  groupId,
  serviceDate,
  serviceTime,
  songs = [],
  defaultCategory = "full_rehearsal",
  defaultSongId,
  memberPartRole,
  canManage = false,
}: RehearsalLongFormRecorderProps) {
  const [phase, setPhase] = useState<RecorderPhase>("setup");
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<ChoirRecordingCategory>(defaultCategory);
  const [visibility, setVisibility] = useState<ChoirRecordingVisibility>("private");
  const [songId, setSongId] = useState<string>(defaultSongId ?? "");
  const [description, setDescription] = useState("");

  const [recording, setRecording] = useState(false);
  const [paused, setPaused] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [micReady, setMicReady] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [saving, setSaving] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const mimeTypeRef = useRef("");
  const timerRef = useRef<number | null>(null);
  const recordingIdRef = useRef("");
  const previewUrlRef = useRef<string | null>(null);
  const [previewBlob, setPreviewBlob] = useState<Blob | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [useNativeEngine, setUseNativeEngine] = useState(false);
  const nativeActiveRef = useRef(false);
  const nativePathRef = useRef<string | null>(null);
  const [interruptionNotice, setInterruptionNotice] = useState<string | null>(null);

  useEffect(() => {
    void isShanahNativeRecorderSupported().then(setUseNativeEngine);
  }, []);

  useEffect(() => {
    if (phase !== "recording" || !useNativeEngine) return;

    const sync = () => {
      void ShanahNativeRecorder.getStatus()
        .then((status) => {
          setElapsed(Math.floor(status.elapsedMs / 1000));
          setPaused(status.state === "paused");
          setRecording(status.state === "recording" || status.state === "paused");
          if (status.error) setError(status.error);
          setInterruptionNotice(status.interruptionReason ?? null);
        })
        .catch(() => {});
    };

    sync();
    const id = window.setInterval(sync, 1000);
    const onVisible = () => {
      if (document.visibilityState === "visible") sync();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      window.clearInterval(id);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [phase, useNativeEngine]);

  useEffect(() => {
    return () => {
      if (timerRef.current) window.clearInterval(timerRef.current);
      if (!nativeActiveRef.current) {
        mediaRecorderRef.current?.stop();
        streamRef.current?.getTracks().forEach((track) => track.stop());
      }
      if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
    };
  }, []);

  function stopTimer() {
    if (timerRef.current) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }

  function startTimer() {
    stopTimer();
    timerRef.current = window.setInterval(() => {
      setElapsed((value) => value + 1);
    }, 1000);
  }

  const buildPendingMeta = useCallback(
    (id: string, blob?: Blob | null): PendingRehearsalUploadMeta => ({
      id,
      groupId,
      title: title.trim() || defaultChoirRecordingTitle(category),
      description: description.trim() || null,
      category,
      visibility,
      mimeType: mimeTypeRef.current || blob?.type || "audio/webm",
      fileName: `rehearsal-${id}${extensionForRecorderMime(mimeTypeRef.current || blob?.type || "audio/webm")}`,
      durationSeconds: elapsed,
      fileSizeBytes: blob?.size ?? undefined,
      serviceDate: serviceDate || null,
      serviceTime: serviceTime || null,
      songId: songId.trim() || null,
      vocalPart: category === "vocal_practice" ? memberPartRole?.trim() || null : null,
      nativePath: nativePathRef.current,
      updatedAt: new Date().toISOString(),
    }),
    [
      groupId,
      title,
      category,
      description,
      visibility,
      elapsed,
      serviceDate,
      serviceTime,
      songId,
      memberPartRole,
    ],
  );

  async function persistPendingDraft(id: string, blob: Blob | null) {
    try {
      await savePendingRehearsalUpload(buildPendingMeta(id, blob), blob);
    } catch {
      /* IndexedDB unavailable — in-memory review still works */
    }
  }

  async function startNativeRecording() {
    const allowed = await ensureNativeRecorderPermission();
    if (!allowed) {
      setMicReady(false);
      setError("Microphone permission is required to record.");
      return;
    }

    const sessionTitle = title.trim() || defaultChoirRecordingTitle(category);
    recordingIdRef.current = `rec-${crypto.randomUUID()}`;
    mimeTypeRef.current = "audio/mp4";

    try {
      const status = await ShanahNativeRecorder.start({
        recordingId: recordingIdRef.current,
        title: sessionTitle,
      });
      if (status.error) {
        throw new Error(status.error);
      }
      nativeActiveRef.current = true;
      nativePathRef.current = null;
      setInterruptionNotice(null);
      setMicReady(true);
      setRecording(true);
      setPaused(false);
      setElapsed(Math.floor(status.elapsedMs / 1000));
      setPhase("recording");
      if (!title.trim()) setTitle(sessionTitle);
    } catch (nativeError) {
      nativeActiveRef.current = false;
      setError(nativeError instanceof Error ? nativeError.message : "Could not start native recording.");
    }
  }

  async function startRecording() {
    setError(null);
    setMessage(null);

    if (useNativeEngine) {
      await startNativeRecording();
      return;
    }

    if (!navigator.mediaDevices?.getUserMedia) {
      setError("Microphone recording is not supported in this browser.");
      return;
    }
    if (!isMediaRecorderSupported()) {
      setError("MediaRecorder is not available. Try updating the app or use Chrome.");
      return;
    }

    try {
      nativeActiveRef.current = false;
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      setMicReady(true);

      const recorder = createAudioMediaRecorder(stream);
      mimeTypeRef.current = recorder.mimeType || pickMediaRecorderMimeType();
      chunksRef.current = [];
      recordingIdRef.current = `rec-${crypto.randomUUID()}`;

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) chunksRef.current.push(event.data);
      };

      recorder.onstop = () => {
        stopTimer();
        setRecording(false);
        setPaused(false);
        const blob = new Blob(chunksRef.current, {
          type: mimeTypeRef.current || "audio/webm",
        });
        if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
        const url = URL.createObjectURL(blob);
        previewUrlRef.current = url;
        setPreviewBlob(blob);
        setPreviewUrl(url);
        setPhase("review");
        void persistPendingDraft(recordingIdRef.current, blob);
        streamRef.current?.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      };

      recorder.start(1000);
      mediaRecorderRef.current = recorder;
      setRecording(true);
      setPaused(false);
      setElapsed(0);
      startTimer();
      setPhase("recording");

      if (!title.trim()) {
        setTitle(defaultChoirRecordingTitle(category));
      }
    } catch (captureError) {
      setMicReady(false);
      setError(
        captureError instanceof Error
          ? captureError.message
          : "Microphone permission denied or unavailable.",
      );
    }
  }

  async function pauseRecording() {
    if (useNativeEngine && nativeActiveRef.current) {
      const status = await ShanahNativeRecorder.pause();
      setPaused(status.state === "paused");
      setElapsed(Math.floor(status.elapsedMs / 1000));
      return;
    }
    const recorder = mediaRecorderRef.current;
    if (!recorder || recorder.state !== "recording") return;
    recorder.pause();
    setPaused(true);
    stopTimer();
  }

  async function resumeRecording() {
    if (useNativeEngine && nativeActiveRef.current) {
      const status = await ShanahNativeRecorder.resume();
      setPaused(status.state === "paused");
      setElapsed(Math.floor(status.elapsedMs / 1000));
      return;
    }
    const recorder = mediaRecorderRef.current;
    if (!recorder || recorder.state !== "paused") return;
    recorder.resume();
    setPaused(false);
    startTimer();
  }

  async function stopRecording() {
    if (useNativeEngine && nativeActiveRef.current) {
      try {
        const result = await ShanahNativeRecorder.stop();
        nativeActiveRef.current = false;
        setRecording(false);
        setPaused(false);
        const durationSec = Math.floor((result.durationMs ?? result.elapsedMs) / 1000);
        setElapsed(durationSec);
        if (!result.path) {
          setError("Recording stopped but the file was not found on device.");
          return;
        }
        nativePathRef.current = result.path;
        mimeTypeRef.current = result.mimeType ?? "audio/mp4";
        const blob = await nativeRecordingPathToBlob(result.path, mimeTypeRef.current);
        if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
        const url = URL.createObjectURL(blob);
        previewUrlRef.current = url;
        setPreviewBlob(blob);
        setPreviewUrl(url);
        setPhase("review");
        await persistPendingDraft(recordingIdRef.current, blob);
      } catch (stopError) {
        setError(stopError instanceof Error ? stopError.message : "Could not finish recording.");
      }
      return;
    }
    const recorder = mediaRecorderRef.current;
    if (!recorder || recorder.state === "inactive") return;
    recorder.stop();
    mediaRecorderRef.current = null;
  }

  function discardReview() {
    if (!window.confirm("Discard this recording? It will not be saved.")) return;
    if (useNativeEngine) {
      void ShanahNativeRecorder.discard();
    }
    nativeActiveRef.current = false;
    chunksRef.current = [];
    setPreviewBlob(null);
    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current);
      previewUrlRef.current = null;
    }
    setPreviewUrl(null);
    nativePathRef.current = null;
    void removePendingRehearsalUpload(recordingIdRef.current);
    setElapsed(0);
    setPhase("setup");
    setMessage(null);
    setError(null);
  }

  async function saveRecording() {
    if (!previewBlob && !nativePathRef.current) {
      setError("Nothing to save.");
      return;
    }

    const id = recordingIdRef.current || `rec-${crypto.randomUUID()}`;
    recordingIdRef.current = id;
    const meta = buildPendingMeta(id, previewBlob);
    meta.title = title.trim() || meta.title;

    setSaving(true);
    setError(null);
    setMessage(null);
    setUploadProgress(0);

    try {
      await persistPendingDraft(id, previewBlob);
      await uploadAndRegisterPending(meta, previewBlob, setUploadProgress);
      await removePendingRehearsalUpload(id);
      if (nativePathRef.current) {
        try {
          await ShanahNativeRecorder.deleteLocalRecording({ recordingId: id });
        } catch {
          /* local cleanup optional */
        }
      }

      setMessage("Recording saved to the library.");
      chunksRef.current = [];
      setPreviewBlob(null);
      if (previewUrlRef.current) {
        URL.revokeObjectURL(previewUrlRef.current);
        previewUrlRef.current = null;
      }
      setPreviewUrl(null);
      nativePathRef.current = null;
      setTitle("");
      setDescription("");
      setElapsed(0);
      setPhase("setup");
    } catch (saveError) {
      await persistPendingDraft(id, previewBlob);
      setError(
        saveError instanceof Error
          ? `${saveError.message} Your recording is saved on this device — use Retry upload below or in the Library tab.`
          : "Save failed. Your recording is still on this device.",
      );
    } finally {
      setSaving(false);
    }
  }

  const timerLabel = formatRecordingDurationHms(elapsed);

  return (
    <div className="choir-card space-y-4 p-4">
      <div>
        <h2 className="font-display text-lg font-bold text-[var(--choir-heading)]">Record rehearsal audio</h2>
        <p className="mt-1 text-sm text-[var(--choir-muted)]">
          {useNativeEngine
            ? "This Android build saves rehearsal audio to device storage while recording (AAC). A notification stays visible during capture; screen lock may still interrupt on some devices until fully tested."
            : "Long rehearsals work best as audio. In the browser, keep the app open — recording is held in memory until you stop."}
        </p>
        <p className="mt-2 rounded-lg border border-amber-200/80 bg-amber-50/90 px-3 py-2 text-xs text-amber-950">
          Recording notice: Only record when everyone present knows the session is being captured. Shared recordings
          are visible according to the visibility you choose below.
        </p>
      </div>

      {phase === "setup" ? (
        <div className="space-y-3">
          <label className="block text-sm font-semibold text-[var(--choir-heading)]">
            Title
            <input
              className="choir-input mt-1 w-full"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder={defaultChoirRecordingTitle(category)}
            />
          </label>

          <label className="block text-sm font-semibold text-[var(--choir-heading)]">
            Recording type
            <select
              className="choir-input mt-1 w-full"
              value={category}
              onChange={(event) => setCategory(event.target.value as ChoirRecordingCategory)}
            >
              {CHOIR_RECORDING_CATEGORIES.map((entry) => (
                <option key={entry} value={entry}>
                  {choirRecordingCategoryLabel(entry)}
                </option>
              ))}
            </select>
          </label>

          {songs.length > 0 ? (
            <label className="block text-sm font-semibold text-[var(--choir-heading)]">
              Song (optional)
              <select className="choir-input mt-1 w-full" value={songId} onChange={(event) => setSongId(event.target.value)}>
                <option value="">No song</option>
                {songs.map((song) => (
                  <option key={song.id} value={song.id}>
                    {song.title}
                  </option>
                ))}
              </select>
            </label>
          ) : null}

          <label className="block text-sm font-semibold text-[var(--choir-heading)]">
            Visibility
            <select
              className="choir-input mt-1 w-full"
              value={visibility}
              onChange={(event) => setVisibility(event.target.value as ChoirRecordingVisibility)}
            >
              {CHOIR_RECORDING_VISIBILITY.filter((entry) => entry !== "official" || canManage).map(
                (entry) => (
                  <option key={entry} value={entry}>
                    {entry === "private"
                      ? "Private (you + leaders)"
                      : entry === "choir_shared"
                        ? "Choir shared"
                        : "Official ministry"}
                  </option>
                ),
              )}
            </select>
          </label>

          <label className="block text-sm font-semibold text-[var(--choir-heading)]">
            Notes (optional)
            <textarea
              className="choir-input mt-1 min-h-[72px] w-full"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
            />
          </label>

          {micReady === false ? (
            <p className="text-sm text-red-700">Microphone access is required to record.</p>
          ) : null}

          <button
            type="button"
            className="choir-rehearsal-record-btn w-full min-h-[52px] text-base font-bold"
            onClick={() => void startRecording()}
          >
            Start recording
          </button>
        </div>
      ) : null}

      {phase === "recording" ? (
        <div className="space-y-4 text-center">
          {interruptionNotice ? (
            <p className="rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-950">
              {interruptionNotice} Tap Resume when you are ready.
            </p>
          ) : null}
          <p className="text-xs font-bold uppercase tracking-wide text-red-600">
            {paused ? "Paused" : "Recording"}
            <span className="ml-2 inline-block h-2 w-2 animate-pulse rounded-full bg-red-600 align-middle" />
          </p>
          <p className="font-mono text-4xl font-bold tabular-nums text-[var(--choir-heading)]">{timerLabel}</p>
          <p className="text-sm text-[var(--choir-muted)]">{title.trim() || defaultChoirRecordingTitle(category)}</p>
          <div className="flex flex-col gap-2 sm:flex-row">
            {paused ? (
              <button type="button" className="choir-rehearsal-resource-btn min-h-[44px] flex-1" onClick={resumeRecording}>
                Resume
              </button>
            ) : (
              <button type="button" className="choir-rehearsal-resource-btn min-h-[44px] flex-1" onClick={pauseRecording}>
                Pause
              </button>
            )}
            <button
              type="button"
              className="choir-rehearsal-record-btn min-h-[44px] flex-1"
              onClick={stopRecording}
            >
              Stop
            </button>
          </div>
        </div>
      ) : null}

      {phase === "review" && (previewBlob || nativePathRef.current) && previewUrl ? (
        <div className="space-y-3">
          <h3 className="text-base font-bold text-[var(--choir-heading)]">Review before saving</h3>
          <label className="block text-sm font-semibold text-[var(--choir-heading)]">
            Title
            <input className="choir-input mt-1 w-full" value={title} onChange={(event) => setTitle(event.target.value)} />
          </label>
          <ul className="text-sm text-[var(--choir-body)]">
            <li>Duration: {timerLabel}</li>
            <li>
              Size:{" "}
              {previewBlob
                ? `${(previewBlob.size / (1024 * 1024)).toFixed(1)} MB`
                : "On device"}
            </li>
            <li>Type: {choirRecordingCategoryLabel(category)}</li>
          </ul>
          <WorshipAudioPlayer
            src={previewUrl}
            fileName={title}
            globalPlayer={{
              id: recordingIdRef.current || "rehearsal-preview",
              title: title.trim() || "Preview",
              kind: "worship-rehearsal",
            }}
          />
          {saving ? (
            <p className="text-sm font-medium text-[var(--choir-body)]">Uploading… {uploadProgress}%</p>
          ) : null}
          <div className="flex flex-col gap-2">
            <button
              type="button"
              className="choir-rehearsal-record-btn min-h-[44px] w-full"
              disabled={saving}
              onClick={() => void saveRecording()}
            >
              {saving ? "Saving…" : "Save recording"}
            </button>
            <button
              type="button"
              className="choir-rehearsal-resource-btn min-h-[44px] w-full"
              disabled={saving}
              onClick={discardReview}
            >
              Discard
            </button>
          </div>
        </div>
      ) : null}

      {error ? <p className="text-sm text-red-700">{error}</p> : null}
      {message ? <p className="text-sm font-medium text-emerald-800">{message}</p> : null}
    </div>
  );
}
