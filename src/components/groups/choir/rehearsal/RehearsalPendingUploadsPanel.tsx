"use client";

import { useCallback, useEffect, useState } from "react";
import {
  getPendingRehearsalUpload,
  listPendingRehearsalUploads,
  removePendingRehearsalUpload,
  savePendingRehearsalUpload,
  type PendingRehearsalUploadMeta,
} from "@/lib/rehearsal-recording-pending-upload";
import { uploadAndRegisterPending } from "@/lib/rehearsal-recording-upload";
import {
  isShanahNativeRecorderSupported,
  ShanahNativeRecorder,
  type LocalRecordingEntry,
} from "@/lib/shanah-native-recorder";
import { choirRecordingCategoryLabel, formatRecordingDurationHms } from "@/lib/choir-rehearsal-recording-types";

type RehearsalPendingUploadsPanelProps = {
  groupId: string;
  onUploaded?: () => void;
};

export function RehearsalPendingUploadsPanel({ groupId, onUploaded }: RehearsalPendingUploadsPanelProps) {
  const [pending, setPending] = useState<PendingRehearsalUploadMeta[]>([]);
  const [localOnly, setLocalOnly] = useState<LocalRecordingEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [retryId, setRetryId] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const items = await listPendingRehearsalUploads();
      setPending(items.filter((entry) => entry.groupId === groupId));

      if (await isShanahNativeRecorderSupported()) {
        const local = await ShanahNativeRecorder.listLocalRecordings();
        const pendingIds = new Set(items.map((entry) => entry.id));
        setLocalOnly(
          (local.recordings ?? []).filter((entry) => {
            const id = entry.recordingId ?? entry.fileName.replace(/\.m4a$/i, "");
            return !pendingIds.has(id);
          }),
        );
      } else {
        setLocalOnly([]);
      }
    } catch (refreshError) {
      setError(refreshError instanceof Error ? refreshError.message : "Could not load pending uploads.");
    } finally {
      setLoading(false);
    }
  }, [groupId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  async function retry(meta: PendingRehearsalUploadMeta) {
    setRetryId(meta.id);
    setProgress(0);
    setError(null);
    try {
      const row = await getPendingRehearsalUpload(meta.id);
      await uploadAndRegisterPending(meta, row?.blob, setProgress);
      await removePendingRehearsalUpload(meta.id);
      if (meta.nativePath) {
        try {
          await ShanahNativeRecorder.deleteLocalRecording({ recordingId: meta.id });
        } catch {
          /* keep file if cleanup fails */
        }
      }
      await refresh();
      onUploaded?.();
    } catch (retryError) {
      setError(retryError instanceof Error ? retryError.message : "Retry failed.");
    } finally {
      setRetryId(null);
    }
  }

  async function adoptLocalFile(entry: LocalRecordingEntry) {
    const id = entry.recordingId ?? entry.fileName.replace(/\.m4a$/i, "");
    const meta: PendingRehearsalUploadMeta = {
      id,
      groupId,
      title: `Recovered recording — ${new Date(entry.lastModified).toLocaleDateString()}`,
      category: "full_rehearsal",
      visibility: "private",
      mimeType: "audio/mp4",
      fileName: entry.fileName,
      durationSeconds: 0,
      fileSizeBytes: entry.fileSizeBytes,
      nativePath: entry.path,
      updatedAt: new Date().toISOString(),
    };
    await savePendingRehearsalUpload(meta, null);
    await refresh();
  }

  async function dismiss(meta: PendingRehearsalUploadMeta) {
    if (!window.confirm(`Remove “${meta.title}” from pending uploads? The audio may still be on your device.`)) {
      return;
    }
    await removePendingRehearsalUpload(meta.id);
    await refresh();
  }

  if (loading) return null;
  if (!pending.length && !localOnly.length && !error) return null;

  return (
    <div className="choir-card space-y-3 border border-amber-300/80 bg-amber-50/60 p-4">
      <div>
        <h3 className="font-display text-base font-bold text-[var(--choir-heading)]">Pending uploads</h3>
        <p className="mt-1 text-xs text-[var(--choir-body)]">
          Uploads that did not finish are kept on this device until you retry or dismiss them.
        </p>
      </div>

      {error ? <p className="text-sm text-red-700">{error}</p> : null}

      {pending.map((meta) => (
        <div key={meta.id} className="rounded-xl border border-amber-200 bg-white/90 p-3">
          <p className="font-semibold text-[var(--choir-heading)]">{meta.title}</p>
          <p className="text-xs text-[var(--choir-muted)]">
            {choirRecordingCategoryLabel(meta.category)} · {formatRecordingDurationHms(meta.durationSeconds)}
            {meta.fileSizeBytes ? ` · ${(meta.fileSizeBytes / (1024 * 1024)).toFixed(1)} MB` : ""}
          </p>
          {retryId === meta.id ? (
            <p className="mt-2 text-sm font-medium">Uploading… {progress}%</p>
          ) : (
            <div className="mt-2 flex flex-wrap gap-2">
              <button
                type="button"
                className="choir-rehearsal-resource-btn min-h-[44px] px-4"
                onClick={() => void retry(meta)}
              >
                Retry upload
              </button>
              <button
                type="button"
                className="min-h-[44px] px-3 text-xs font-bold text-[var(--choir-muted)] underline"
                onClick={() => void dismiss(meta)}
              >
                Dismiss
              </button>
            </div>
          )}
        </div>
      ))}

      {localOnly.map((entry) => (
        <div key={entry.path} className="rounded-xl border border-dashed border-amber-300 bg-white/80 p-3">
          <p className="font-semibold text-[var(--choir-heading)]">Recording on device</p>
          <p className="text-xs text-[var(--choir-muted)]">
            {entry.fileName} · {(entry.fileSizeBytes / (1024 * 1024)).toFixed(1)} MB
          </p>
          <button
            type="button"
            className="choir-rehearsal-resource-btn mt-2 min-h-[44px] px-4"
            onClick={() => void adoptLocalFile(entry)}
          >
            Prepare for upload
          </button>
        </div>
      ))}
    </div>
  );
}
