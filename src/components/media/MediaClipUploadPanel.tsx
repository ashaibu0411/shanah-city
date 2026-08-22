"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { upload } from "@vercel/blob/client";
import { useAuth } from "@/components/auth/AuthProvider";
import { inspectMediaClipFile, isAllowedMediaClipFileClient } from "@/lib/media-clip-client";
import { MEDIA_CLIP_MAX_BYTES } from "@/lib/media-clip-limits";
import { Button } from "@/components/ui";

type SourceMode = "file" | "youtube";

function formatBytes(bytes: number) {
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function MediaClipUploadPanel({ compact = false }: { compact?: boolean }) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement | null>(null);
  const { user, loading, permissions } = useAuth();
  const [mode, setMode] = useState<SourceMode>("file");
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [poster, setPoster] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [busy, setBusy] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const canPublish = !loading && user && permissions.canUploadGallery;

  if (!canPublish) {
    return null;
  }

  function resetFile() {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setFile(null);
    setPoster(null);
    setPreviewUrl(null);
    setProgress(0);
    if (fileRef.current) fileRef.current.value = "";
  }

  async function chooseFile(next: File | null) {
    setError(null);
    setMessage(null);
    resetFile();
    if (!next) return;

    if (!isAllowedMediaClipFileClient(next)) {
      setError("Use an MP4, MOV, or WEBM short under 80 MB.");
      return;
    }
    if (next.size > MEDIA_CLIP_MAX_BYTES) {
      setError("That file is over 80 MB. Compress it or trim the clip.");
      return;
    }

    try {
      const inspected = await inspectMediaClipFile(next);
      setFile(next);
      setPoster(inspected.poster);
      setPreviewUrl(URL.createObjectURL(next));
      if (!title.trim()) {
        setTitle(next.name.replace(/\.[^.]+$/, "").replace(/[-_]+/g, " "));
      }
    } catch (inspectError) {
      setError(inspectError instanceof Error ? inspectError.message : "Could not read this video.");
    }
  }

  async function publishUploaded(videoFile: File, posterFile: File | null) {
    try {
      const videoBlob = await upload(`media/clips/${videoFile.name}`, videoFile, {
        access: "public",
        handleUploadUrl: "/api/media/clips/upload",
        multipart: videoFile.size > 8 * 1024 * 1024,
        onUploadProgress: ({ percentage }) => setProgress(Math.round(percentage)),
      });

      let thumbnail: string | undefined;
      if (posterFile) {
        const posterBlob = await upload(`media/clips/${posterFile.name}`, posterFile, {
          access: "public",
          handleUploadUrl: "/api/media/clips/upload",
        });
        thumbnail = posterBlob.url;
      }

      const response = await fetch("/api/media/clips", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          url: videoBlob.url,
          thumbnail,
          platform: "upload",
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Could not publish clip.");
      return;
    } catch (blobError) {
      if (blobError instanceof Error && /publish clip|title|media team|sign in/i.test(blobError.message)) {
        throw blobError;
      }

      const formData = new FormData();
      formData.set("title", title.trim());
      formData.set("file", videoFile);
      if (posterFile) formData.set("poster", posterFile);
      const response = await fetch("/api/media/clips", {
        method: "POST",
        body: formData,
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Could not publish clip.");
    }
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setMessage(null);
    setError(null);

    try {
      if (mode === "file") {
        if (!file) throw new Error("Choose a short video to upload.");
        await publishUploaded(file, poster);
        resetFile();
      } else {
        const response = await fetch("/api/media/clips", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title, url }),
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error ?? "Could not publish clip.");
        setUrl("");
      }

      setTitle("");
      setMessage("Short video is live. The community was notified.");
      router.refresh();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Could not publish clip.");
    } finally {
      setBusy(false);
      setProgress(0);
    }
  }

  return (
    <section
      className={`overflow-hidden rounded-2xl bg-night-950 shadow-app-lg ring-1 ring-night-900/10 ${
        compact ? "mb-0" : "mb-5"
      }`}
    >
      <div className={`text-white ${compact ? "p-3.5" : "p-4 sm:p-5"}`}>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-sand-300/80">
              Media team
            </p>
            <h3 className={`mt-1 font-display font-semibold ${compact ? "text-base" : "text-xl"}`}>
              Publish a short
            </h3>
            {!compact ? (
              <p className="mt-1 text-sm text-white/65">
                Upload a vertical clip from your phone, or paste a YouTube Shorts link.
              </p>
            ) : null}
          </div>
          <div className="flex rounded-full bg-white/10 p-1 ring-1 ring-white/10">
            {(
              [
                ["file", "Upload"],
                ["youtube", "YouTube"],
              ] as const
            ).map(([value, label]) => (
              <button
                key={value}
                type="button"
                onClick={() => setMode(value)}
                className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                  mode === value ? "bg-white text-night-900" : "text-white/70 hover:text-white"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <form onSubmit={submit} className="mt-4 space-y-3">
          <input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Title"
            required
            className="w-full rounded-2xl border border-white/10 bg-white/10 px-3 py-3 text-sm text-white outline-none placeholder:text-white/40 focus:ring-2 focus:ring-amber-300/40"
          />

          {mode === "file" ? (
            <>
              <label
                onDragOver={(event) => {
                  event.preventDefault();
                  setDragOver(true);
                }}
                onDragLeave={() => setDragOver(false)}
                onDrop={(event) => {
                  event.preventDefault();
                  setDragOver(false);
                  void chooseFile(event.dataTransfer.files[0] ?? null);
                }}
                className={`flex cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed px-4 py-8 text-center transition ${
                  dragOver
                    ? "border-amber-300 bg-amber-300/10"
                    : "border-white/15 bg-white/5 hover:border-white/30"
                }`}
              >
                <input
                  ref={fileRef}
                  type="file"
                  accept="video/mp4,video/webm,video/quicktime,video/x-m4v,.mp4,.mov,.webm,.m4v"
                  className="sr-only"
                  onChange={(event) => void chooseFile(event.target.files?.[0] ?? null)}
                />
                {previewUrl ? (
                  <video
                    src={previewUrl}
                    muted
                    playsInline
                    className="mb-3 max-h-48 rounded-xl bg-black"
                  />
                ) : (
                  <span className="mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-lg">
                    ⬆
                  </span>
                )}
                <p className="text-sm font-semibold">
                  {file ? file.name : "Drop a short video here, or tap to choose"}
                </p>
                <p className="mt-1 text-xs text-white/50">
                  MP4, MOV, or WEBM · up to 3 minutes · {file ? formatBytes(file.size) : "80 MB max"}
                </p>
              </label>
              {busy && progress > 0 ? (
                <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-amber-300 to-fuchsia-400 transition-all"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              ) : null}
            </>
          ) : (
            <input
              value={url}
              onChange={(event) => setUrl(event.target.value)}
              placeholder="YouTube Shorts link or video ID"
              required
              className="w-full rounded-2xl border border-white/10 bg-white/10 px-3 py-3 text-sm text-white outline-none placeholder:text-white/40 focus:ring-2 focus:ring-amber-300/40"
            />
          )}

          {error ? (
            <p className="rounded-xl bg-red-500/15 px-3 py-2 text-sm text-red-100">{error}</p>
          ) : null}
          {message ? (
            <p className="rounded-xl bg-emerald-400/15 px-3 py-2 text-sm text-emerald-100">
              {message}
            </p>
          ) : null}

          <Button
            type="submit"
            disabled={busy || !title.trim() || (mode === "file" ? !file : !url.trim())}
            className="bg-white text-night-900 hover:bg-amber-100"
          >
            {busy ? "Publishing..." : "Publish & notify"}
          </Button>
        </form>
      </div>
    </section>
  );
}
