"use client";

import { useEffect, useState } from "react";
import { AdminSubNav } from "@/components/admin/AdminSubNav";
import { Button, Card } from "@/components/ui";
import type { UrgentAlert } from "@/lib/urgent-alert-types";

function toLocalInputValue(iso?: string) {
  if (!iso) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  const offset = date.getTimezoneOffset();
  const local = new Date(date.getTime() - offset * 60_000);
  return local.toISOString().slice(0, 16);
}

export function AdminUrgentAlertPanel() {
  const [active, setActive] = useState<UrgentAlert | null>(null);
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [href, setHref] = useState("");
  const [ctaLabel, setCtaLabel] = useState("Learn more");
  const [expiresAt, setExpiresAt] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const [sendPush, setSendPush] = useState(true);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/admin/urgent-alert")
      .then((response) => response.json())
      .then((data) => {
        const current = data.active ?? data.alerts?.find((alert: UrgentAlert) => alert.active) ?? null;
        setActive(current);
        if (current) {
          setTitle(current.title);
          setMessage(current.message);
          setHref(current.href ?? "");
          setCtaLabel(current.ctaLabel ?? "Learn more");
          setExpiresAt(toLocalInputValue(current.expiresAt));
          setImageUrl(current.imageUrl ?? "");
          setVideoUrl(current.videoUrl ?? "");
        }
      })
      .catch(() => undefined);
  }, []);

  async function uploadMedia(file: File, kind: "image" | "video") {
    const setUploading = kind === "image" ? setUploadingImage : setUploadingVideo;
    setUploading(true);
    setStatus(null);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("kind", kind);

    const response = await fetch("/api/admin/urgent-alert/upload", {
      method: "POST",
      body: formData,
    });
    const data = await response.json();
    setUploading(false);

    if (!response.ok) {
      setStatus(data.error ?? `Could not upload ${kind}.`);
      return;
    }

    if (kind === "image") {
      setImageUrl(data.url);
    } else {
      setVideoUrl(data.url);
    }
    setStatus(`${kind === "image" ? "Image" : "Video"} uploaded. Publish to show it on the home page.`);
  }

  async function publishAlert() {
    setBusy(true);
    setStatus(null);
    const response = await fetch("/api/admin/urgent-alert", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "save",
        id: active?.id,
        title,
        message,
        href,
        ctaLabel,
        imageUrl: imageUrl || undefined,
        videoUrl: videoUrl || undefined,
        active: true,
        expiresAt: expiresAt ? new Date(expiresAt).toISOString() : undefined,
        sendPush,
      }),
    });
    const data = await response.json();
    setBusy(false);

    if (!response.ok) {
      setStatus(data.error ?? "Could not publish urgent alert.");
      return;
    }

    setActive(data.alert ?? null);
    const pushNote =
      data.notify?.sent > 0
        ? ` Push sent to ${data.notify.sent} device${data.notify.sent === 1 ? "" : "s"}.`
        : "";
    setStatus(`Urgent alert is live on the home page.${pushNote}`);
  }

  async function clearAlert() {
    if (!window.confirm("Remove the urgent alert from the home page?")) return;
    setBusy(true);
    setStatus(null);
    const response = await fetch("/api/admin/urgent-alert", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "clear" }),
    });
    setBusy(false);
    if (!response.ok) {
      const data = await response.json();
      setStatus(data.error ?? "Could not clear alert.");
      return;
    }
    setActive(null);
    setTitle("");
    setMessage("");
    setHref("");
    setExpiresAt("");
    setImageUrl("");
    setVideoUrl("");
    setStatus("Urgent alert removed.");
  }

  return (
    <div>
      <AdminSubNav />

      <Card>
        <h2 className="font-display text-xl font-semibold text-night-900">Urgent home alert</h2>
        <p className="mt-2 text-sm text-night-600">
          Use this only for red-hot, must-not-miss updates — weather cancellations, emergency
          schedule changes, or critical church-wide instructions. One alert shows at the top of the
          home page for everyone.
        </p>

        {active ? (
          <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900">
            <p className="font-semibold">Live now: {active.title}</p>
            <p className="mt-1 text-red-800/90">{active.message}</p>
          </div>
        ) : (
          <p className="mt-4 rounded-2xl bg-sand-50 px-4 py-3 text-sm text-night-600">
            No urgent alert is active.
          </p>
        )}

        <div className="mt-5 space-y-4">
          <label className="block">
            <span className="text-sm font-semibold text-night-800">Headline</span>
            <input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Sunday services moved online"
              className="mt-1 w-full rounded-xl border border-night-900/10 px-3 py-2.5 text-sm outline-none ring-night-900/5 focus:ring-2"
            />
          </label>

          <label className="block">
            <span className="text-sm font-semibold text-night-800">Message</span>
            <textarea
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              rows={4}
              placeholder="Because of the winter storm, all in-person gatherings are canceled today. Join us online at 10 AM instead."
              className="mt-1 w-full rounded-xl border border-night-900/10 px-3 py-2.5 text-sm outline-none ring-night-900/5 focus:ring-2"
            />
          </label>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-night-900/10 bg-sand-50 p-4">
              <p className="text-sm font-semibold text-night-800">Alert image (optional)</p>
              <p className="mt-1 text-xs text-night-500">JPG, PNG, WEBP, or GIF · up to 8 MB</p>
              {imageUrl ? (
                <div className="mt-3">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={imageUrl}
                    alt="Alert preview"
                    className="max-h-40 w-full rounded-xl object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => setImageUrl("")}
                    className="mt-2 text-xs font-semibold text-red-700"
                  >
                    Remove image
                  </button>
                </div>
              ) : (
                <label className="mt-3 flex cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-night-900/15 bg-white px-4 py-6 text-center text-sm text-night-600 hover:bg-sand-50">
                  <span>{uploadingImage ? "Uploading..." : "Choose image"}</span>
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    className="hidden"
                    disabled={uploadingImage}
                    onChange={(event) => {
                      const file = event.target.files?.[0];
                      if (file) void uploadMedia(file, "image");
                      event.target.value = "";
                    }}
                  />
                </label>
              )}
            </div>

            <div className="rounded-2xl border border-night-900/10 bg-sand-50 p-4">
              <p className="text-sm font-semibold text-night-800">Alert video (optional)</p>
              <p className="mt-1 text-xs text-night-500">MP4, MOV, or WEBM · up to 50 MB</p>
              {videoUrl ? (
                <div className="mt-3">
                  <video
                    src={videoUrl}
                    controls
                    playsInline
                    className="max-h-40 w-full rounded-xl bg-black"
                  />
                  <button
                    type="button"
                    onClick={() => setVideoUrl("")}
                    className="mt-2 text-xs font-semibold text-red-700"
                  >
                    Remove video
                  </button>
                </div>
              ) : (
                <label className="mt-3 flex cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-night-900/15 bg-white px-4 py-6 text-center text-sm text-night-600 hover:bg-sand-50">
                  <span>{uploadingVideo ? "Uploading..." : "Choose video"}</span>
                  <input
                    type="file"
                    accept="video/mp4,video/webm,video/quicktime,video/x-m4v"
                    className="hidden"
                    disabled={uploadingVideo}
                    onChange={(event) => {
                      const file = event.target.files?.[0];
                      if (file) void uploadMedia(file, "video");
                      event.target.value = "";
                    }}
                  />
                </label>
              )}
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <label className="block">
              <span className="text-sm font-semibold text-night-800">Link (optional)</span>
              <input
                value={href}
                onChange={(event) => setHref(event.target.value)}
                placeholder="/live or https://..."
                className="mt-1 w-full rounded-xl border border-night-900/10 px-3 py-2.5 text-sm outline-none ring-night-900/5 focus:ring-2"
              />
            </label>
            <label className="block">
              <span className="text-sm font-semibold text-night-800">Button label</span>
              <input
                value={ctaLabel}
                onChange={(event) => setCtaLabel(event.target.value)}
                className="mt-1 w-full rounded-xl border border-night-900/10 px-3 py-2.5 text-sm outline-none ring-night-900/5 focus:ring-2"
              />
            </label>
          </div>

          <label className="block">
            <span className="text-sm font-semibold text-night-800">Auto-hide after (optional)</span>
            <input
              type="datetime-local"
              value={expiresAt}
              onChange={(event) => setExpiresAt(event.target.value)}
              className="mt-1 w-full rounded-xl border border-night-900/10 px-3 py-2.5 text-sm outline-none ring-night-900/5 focus:ring-2"
            />
          </label>

          <label className="flex items-center gap-3 rounded-xl bg-sand-50 px-4 py-3 text-sm">
            <input
              type="checkbox"
              checked={sendPush}
              onChange={(event) => setSendPush(event.target.checked)}
            />
            <span>Also send a push notification to members with alerts enabled</span>
          </label>
        </div>

        <div className="mt-5 flex flex-wrap gap-3">
          <Button
            onClick={publishAlert}
            disabled={
              busy ||
              uploadingImage ||
              uploadingVideo ||
              !title.trim() ||
              !message.trim()
            }
          >
            {busy ? "Publishing..." : active ? "Update live alert" : "Publish urgent alert"}
          </Button>
          {active ? (
            <Button variant="secondary" onClick={clearAlert} disabled={busy}>
              Remove alert
            </Button>
          ) : null}
        </div>

        {status ? (
          <p className="mt-4 rounded-xl bg-sand-100 px-3 py-2 text-sm text-night-700">{status}</p>
        ) : null}
      </Card>
    </div>
  );
}
