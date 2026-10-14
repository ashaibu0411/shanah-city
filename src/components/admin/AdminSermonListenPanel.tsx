"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { Button, Card } from "@/components/ui";
import { FormInput } from "@/components/ui/form-fields";
import { parseYouTubeVideoId } from "@/lib/media-clips-utils";
import type { SermonListenRecord } from "@/lib/stores/sermon-listen-db";
import type { SermonVideo } from "@/lib/youtube-sermons-shared";

export function AdminSermonListenPanel() {
  const { permissions } = useAuth();
  const [published, setPublished] = useState<SermonListenRecord[]>([]);
  const [latestVideos, setLatestVideos] = useState<SermonVideo[]>([]);
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [title, setTitle] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);

  const parsedVideoId = useMemo(() => parseYouTubeVideoId(youtubeUrl), [youtubeUrl]);

  const publishedIds = useMemo(
    () => new Set(published.map((entry) => entry.youtubeVideoId)),
    [published],
  );

  const load = useCallback(async () => {
    if (!permissions.canManageAdmin) return;
    const response = await fetch("/api/admin/sermons/listen");
    const data = await response.json();
    if (!response.ok) {
      setStatus(data.error ?? "Could not load sermon audio.");
      return;
    }
    setPublished(data.published ?? []);
    setLatestVideos(data.latestVideos ?? []);
  }, [permissions.canManageAdmin]);

  useEffect(() => {
    void load();
  }, [load]);

  function applyLatest(video: SermonVideo) {
    setYoutubeUrl(video.watchUrl);
    setTitle(video.title);
    setStatus("");
  }

  async function publish(event: React.FormEvent) {
    event.preventDefault();
    if (!file) {
      setStatus("Choose an audio file (MP3 or M4A).");
      return;
    }
    if (!parsedVideoId) {
      setStatus("Paste the YouTube link for this message first.");
      return;
    }

    setBusy(true);
    setStatus("Uploading…");

    const formData = new FormData();
    formData.set("youtubeUrl", youtubeUrl.trim() || parsedVideoId);
    if (title.trim()) formData.set("title", title.trim());
    formData.set("file", file);

    try {
      const response = await fetch("/api/admin/sermons/listen", {
        method: "POST",
        body: formData,
      });
      const data = await response.json();
      if (!response.ok) {
        setStatus(data.error ?? "Publish failed.");
        return;
      }
      setStatus(data.message ?? "Listen is ready.");
      setFile(null);
      await load();
    } catch {
      setStatus("Publish failed. Check your connection and try again.");
    } finally {
      setBusy(false);
    }
  }

  if (!permissions.canManageAdmin) {
    return (
      <Card className="p-5 text-sm text-night-600">
        Admin access is required to publish sermon Listen audio.
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="p-5 md:p-6">
        <h2 className="font-display text-lg font-semibold text-night-900">Publish Listen audio</h2>
        <p className="mt-1 text-sm text-night-600">
          Subsplash-style: paste the YouTube message, upload one audio file, and Listen works in the app
          immediately. Watch still uses YouTube.
        </p>

        <form className="mt-5 space-y-4" onSubmit={publish}>
          <div>
            <label htmlFor="sermon-youtube-url" className="text-sm font-semibold text-night-800">
              YouTube link or video ID
            </label>
            <FormInput
              id="sermon-youtube-url"
              value={youtubeUrl}
              onValueChange={setYoutubeUrl}
              placeholder="https://www.youtube.com/live/5tdWB4LcSmg"
            />
            <p className="mt-1 text-xs text-night-600">
              {parsedVideoId
                ? `Video ID: ${parsedVideoId}${publishedIds.has(parsedVideoId) ? " · Listen already published (upload again to replace)" : ""}`
                : "Supports watch, live, shorts, and youtu.be links"}
            </p>
          </div>
          <div>
            <label htmlFor="sermon-listen-title" className="text-sm font-semibold text-night-800">
              Message title (optional)
            </label>
            <FormInput
              id="sermon-listen-title"
              value={title}
              onValueChange={setTitle}
              placeholder="Shanah Sunday Service…"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-semibold text-night-800">Listen audio file</label>
            <input
              type="file"
              accept="audio/mpeg,audio/mp4,audio/x-m4a,audio/wav,audio/webm,.mp3,.m4a"
              className="block w-full text-sm text-night-700 file:mr-3 file:rounded-full file:border-0 file:bg-night-900 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white"
              onChange={(event) => setFile(event.target.files?.[0] ?? null)}
            />
            <p className="mt-1 text-xs text-night-500">MP3 or M4A, up to 120 MB.</p>
          </div>
          <Button type="submit" disabled={busy}>
            {busy ? "Publishing…" : "Publish Listen"}
          </Button>
        </form>

        {status ? (
          <p className="mt-4 rounded-lg bg-sand-100 px-3 py-2 text-sm text-night-800" role="status">
            {status}
          </p>
        ) : null}
      </Card>

      <Card className="p-5 md:p-6">
        <h3 className="font-display text-base font-semibold text-night-900">Latest on YouTube</h3>
        <p className="mt-1 text-sm text-night-600">Tap a row to fill the form, then upload audio.</p>
        <ul className="mt-3 divide-y divide-night-900/10">
          {latestVideos.map((video) => {
            const ready = publishedIds.has(video.id);
            return (
              <li key={video.id} className="flex flex-wrap items-center justify-between gap-2 py-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-night-900">{video.title}</p>
                  <p className="text-xs text-night-500">{video.id}</p>
                </div>
                <div className="flex items-center gap-2">
                  {ready ? (
                    <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-800">
                      Listen ready
                    </span>
                  ) : (
                    <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-900">
                      Needs audio
                    </span>
                  )}
                  <button
                    type="button"
                    className="text-sm font-semibold text-teal-800 underline"
                    onClick={() => applyLatest(video)}
                  >
                    Use
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      </Card>

      {published.length > 0 ? (
        <Card className="p-5 md:p-6">
          <h3 className="font-display text-base font-semibold text-night-900">Published Listen tracks</h3>
          <ul className="mt-3 space-y-2 text-sm">
            {published.map((entry) => (
              <li key={entry.youtubeVideoId} className="rounded-xl bg-sand-50 px-3 py-2 ring-1 ring-night-900/5">
                <p className="font-semibold text-night-900">{entry.title ?? entry.youtubeVideoId}</p>
                <p className="text-xs text-night-500">
                  {entry.youtubeVideoId}
                  {entry.audioFileName ? ` · ${entry.audioFileName}` : ""}
                </p>
              </li>
            ))}
          </ul>
        </Card>
      ) : null}
    </div>
  );
}
