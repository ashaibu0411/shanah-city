"use client";

import { useEffect, useState } from "react";
import { UrgentAlertFlyerImage } from "@/components/urgent-alert/UrgentAlertFlyerImage";
import { ShareActions } from "@/components/share/ShareActions";
import { Button, Card } from "@/components/ui";
import type { ArtworkFields } from "@/lib/content-artwork";
import { applyUrgentAlertFlyerArtwork } from "@/lib/urgent-alert-flyer";
import {
  urgentAlertAdminHomeMessage,
  urgentAlertHomeStatus,
  URGENT_ALERT_HOME_CAROUSEL_MAX,
} from "@/lib/urgent-alert-utils";
import { urgentAlertShareUrl, urgentAlertViewUrl } from "@/lib/share-urls";
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
  const [alertId, setAlertId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [href, setHref] = useState("");
  const [ctaLabel, setCtaLabel] = useState("Learn more");
  const [startsAt, setStartsAt] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [artwork, setArtwork] = useState<ArtworkFields>({});
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const [sendPush, setSendPush] = useState(true);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [statusTone, setStatusTone] = useState<"success" | "error" | "info">("info");
  const [allAlerts, setAllAlerts] = useState<UrgentAlert[]>([]);

  function applyAlertToForm(alert: UrgentAlert | null) {
    setActive(alert);
    setAlertId(alert?.id ?? null);
    if (!alert) {
      setTitle("");
      setMessage("");
      setHref("");
      setCtaLabel("Learn more");
      setStartsAt("");
      setExpiresAt("");
      setImageUrl("");
      setVideoUrl("");
      setArtwork({});
      setSendPush(true);
      return;
    }
    setTitle(alert.title);
    setMessage(alert.message);
    setHref(alert.href ?? "");
    setCtaLabel(alert.ctaLabel ?? "Learn more");
    setStartsAt(toLocalInputValue(alert.startsAt));
    setExpiresAt(toLocalInputValue(alert.expiresAt));
    setImageUrl(alert.imageUrl ?? "");
    setVideoUrl(alert.videoUrl ?? "");
    setArtwork({
      artworkSquareUrl: alert.artworkSquareUrl,
      artworkWideUrl: alert.artworkWideUrl,
      artworkBannerUrl: alert.artworkBannerUrl,
    });
    setSendPush(false);
  }

  useEffect(() => {
    fetch("/api/admin/urgent-alert")
      .then((response) => response.json())
      .then((data) => {
        setAllAlerts(data.alerts ?? []);
        const current =
          data.flagged ??
          data.alerts?.find((alert: UrgentAlert) => alert.active) ??
          null;
        applyAlertToForm(current);
      })
      .catch(() => undefined);
  }, []);

  async function uploadMedia(file: File, kind: "image" | "video") {
    const setUploading = kind === "image" ? setUploadingImage : setUploadingVideo;
    setUploading(true);
    setStatus(null);
    setStatusTone("info");
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
      setStatusTone("error");
      setStatus(data.error ?? `Could not upload ${kind}.`);
      return;
    }

    if (kind === "image") {
      setImageUrl(data.url);
      setArtwork((current) =>
        applyUrgentAlertFlyerArtwork({ ...current, imageUrl: data.url }),
      );
    } else {
      setVideoUrl(data.url);
    }
    setStatusTone("success");
    setStatus(`${kind === "image" ? "Flyer" : "Video"} uploaded. Tap Update live alert to save on the home page.`);
  }

  async function publishAlert() {
    if (startsAt && expiresAt && new Date(expiresAt) <= new Date(startsAt)) {
      setStatusTone("error");
      setStatus("End date & time must be after the start date & time.");
      return;
    }

    setBusy(true);
    setStatus(null);
    setStatusTone("info");
    const saveId = alertId ?? active?.id;
    const flyerFields = applyUrgentAlertFlyerArtwork({
      imageUrl: imageUrl || undefined,
      ...artwork,
    });
    const response = await fetch("/api/admin/urgent-alert", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "save",
        id: saveId,
        title,
        message,
        href,
        ctaLabel,
        imageUrl: flyerFields.imageUrl,
        videoUrl: videoUrl || undefined,
        artworkSquareUrl: flyerFields.artworkSquareUrl,
        artworkWideUrl: flyerFields.artworkWideUrl,
        artworkBannerUrl: flyerFields.artworkBannerUrl,
        active: true,
        startsAt: startsAt ? new Date(startsAt).toISOString() : undefined,
        expiresAt: expiresAt ? new Date(expiresAt).toISOString() : undefined,
        sendPush,
      }),
    });
    const data = await response.json();
    setBusy(false);

    if (!response.ok) {
      setStatusTone("error");
      setStatus(data.error ?? "Could not publish urgent alert.");
      return;
    }

    applyAlertToForm(data.alert ?? null);
    setAllAlerts((previous) => {
      const next = data.alert
        ? [data.alert, ...previous.filter((entry) => entry.id !== data.alert.id)]
        : previous;
      return next.sort(
        (left, right) => new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime(),
      );
    });
    const homeStatus = urgentAlertHomeStatus(data.alert ?? null);
    const pushNote =
      data.notify?.sent > 0
        ? ` Push sent to ${data.notify.sent} device${data.notify.sent === 1 ? "" : "s"}.`
        : "";
    if (homeStatus === "live") {
      setStatusTone("success");
      setStatus(`Saved. The alert is on the home page now.${pushNote}`);
    } else if (homeStatus === "scheduled") {
      setStatusTone("info");
      setStatus(`Saved.${pushNote} ${urgentAlertAdminHomeMessage(data.alert)}`);
    } else {
      setStatusTone("success");
      setStatus(`Saved.${pushNote}`);
    }
  }

  async function deactivateCurrent() {
    const id = alertId ?? active?.id;
    if (!id) return;
    if (!window.confirm("Turn off this announcement on the home carousel?")) return;
    setBusy(true);
    setStatus(null);
    setStatusTone("info");
    const response = await fetch("/api/admin/urgent-alert", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "deactivate", id }),
    });
    const data = await response.json();
    setBusy(false);
    if (!response.ok) {
      setStatusTone("error");
      setStatus(data.error ?? "Could not turn off this announcement.");
      return;
    }
    setAllAlerts((previous) =>
      previous.map((entry) => (entry.id === id ? { ...entry, active: false } : entry)),
    );
    applyAlertToForm(null);
    setStatusTone("success");
    setStatus("Announcement removed from the home carousel.");
  }

  async function clearAllAlerts() {
    if (!window.confirm("Remove every announcement from the home carousel?")) return;
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
      setStatusTone("error");
      setStatus(data.error ?? "Could not clear alert.");
      return;
    }
    applyAlertToForm(null);
    setAllAlerts((previous) => previous.map((entry) => ({ ...entry, active: false })));
    setStatusTone("success");
    setStatus("All announcements removed from the home carousel.");
  }

  function startNewAnnouncement() {
    applyAlertToForm(null);
    setStatus(null);
    setStatusTone("info");
  }

  const flaggedAlerts = allAlerts.filter((entry) => entry.active);
  const liveOnHomeCount = flaggedAlerts.filter(
    (entry) => urgentAlertHomeStatus(entry) === "live",
  ).length;
  const liveVisibleAll = flaggedAlerts.filter(
    (entry) => urgentAlertHomeStatus(entry) === "live",
  );
  const carouselOverflow =
    liveVisibleAll.length > URGENT_ALERT_HOME_CAROUSEL_MAX
      ? liveVisibleAll.length - URGENT_ALERT_HOME_CAROUSEL_MAX
      : 0;

  const homeStatus = urgentAlertHomeStatus(active);
  const homeMessage = urgentAlertAdminHomeMessage(active);
  const startsAtIsFuture = Boolean(startsAt && new Date(startsAt) > new Date());

  return (
    <div>
      <Card>
        <h2 className="font-display text-xl font-semibold text-night-900">Urgent home alert</h2>
        <p className="mt-2 text-sm text-night-600">
          Publish announcements for the home carousel (up to {URGENT_ALERT_HOME_CAROUSEL_MAX} show at
          once). They auto-rotate; members tap any slide for full details, flyers, and links.
        </p>

        {flaggedAlerts.length > 0 ? (
          <div className="mt-4 rounded-2xl border border-night-900/10 bg-sand-50 p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm font-semibold text-night-900">
                Carousel (
                {Math.min(liveOnHomeCount, URGENT_ALERT_HOME_CAROUSEL_MAX)} on home now
                {liveOnHomeCount > URGENT_ALERT_HOME_CAROUSEL_MAX
                  ? ` · ${liveOnHomeCount} live`
                  : ""}
                · {flaggedAlerts.length} total active)
              </p>
              <button
                type="button"
                onClick={startNewAnnouncement}
                className="text-xs font-semibold text-night-800 underline"
              >
                New announcement
              </button>
            </div>
            <ul className="mt-3 flex flex-wrap gap-2">
              {flaggedAlerts.map((entry) => {
                const status = urgentAlertHomeStatus(entry);
                const editing = (alertId ?? active?.id) === entry.id;
                return (
                  <li key={entry.id}>
                    <button
                      type="button"
                      onClick={() => applyAlertToForm(entry)}
                      className={`rounded-full px-3 py-1.5 text-left text-xs font-semibold transition ${
                        editing
                          ? "bg-night-900 text-white"
                          : "bg-white text-night-800 ring-1 ring-night-900/10 hover:bg-sand-100"
                      }`}
                    >
                      {entry.title}
                      <span className="ml-1.5 font-normal opacity-80">
                        {status === "live" ? "· live" : status === "scheduled" ? "· scheduled" : ""}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
            {carouselOverflow > 0 ? (
              <p className="mt-3 text-xs text-amber-900">
                {carouselOverflow} more live announcement
                {carouselOverflow === 1 ? "" : "s"} won&apos;t appear on home until you turn one off
                or it expires. Home shows the {URGENT_ALERT_HOME_CAROUSEL_MAX} most recently
                updated.
              </p>
            ) : null}
          </div>
        ) : null}

        {active ? (
          <div
            className={`mt-4 rounded-2xl border px-4 py-3 text-sm ${
              homeStatus === "live"
                ? "border-red-200 bg-red-50 text-red-900"
                : homeStatus === "scheduled"
                  ? "border-amber-200 bg-amber-50 text-amber-950"
                  : "border-night-200 bg-sand-50 text-night-800"
            }`}
          >
            <p className="font-semibold">
              {homeStatus === "live"
                ? "Live on home"
                : homeStatus === "scheduled"
                  ? "Scheduled (not on home yet)"
                  : "Saved alert"}
              : {active.title}
            </p>
            <p className="mt-1 opacity-90">{homeMessage}</p>
          </div>
        ) : (
          <div className="mt-4 flex flex-wrap items-center justify-between gap-2 rounded-2xl bg-sand-50 px-4 py-3 text-sm text-night-600">
            <span>No announcement selected.</span>
            <button
              type="button"
              onClick={startNewAnnouncement}
              className="text-xs font-semibold text-night-900 underline"
            >
              Create announcement
            </button>
          </div>
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
            <div className="rounded-2xl border border-night-900/10 bg-sand-50 p-4 md:col-span-2">
              <p className="text-sm font-semibold text-night-800">Event flyer (optional)</p>
              <p className="mt-1 text-xs text-night-500">
                Upload one JPG, PNG, WEBP, or GIF (up to 8 MB). Portrait church flyers, square
                graphics, and wide banners all fit automatically — no need for three separate sizes.
              </p>
              {imageUrl ? (
                <div className="mt-3">
                  <UrgentAlertFlyerImage
                    src={imageUrl}
                    alt="Flyer preview"
                    context="admin-preview"
                    className="border border-night-900/10 bg-white ring-night-900/10"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setImageUrl("");
                      setArtwork({});
                    }}
                    className="mt-2 text-xs font-semibold text-red-700"
                  >
                    Remove flyer
                  </button>
                </div>
              ) : (
                <label className="mt-3 flex cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-night-900/15 bg-white px-4 py-8 text-center text-sm text-night-600 hover:bg-sand-50">
                  <span>{uploadingImage ? "Uploading..." : "Choose flyer image"}</span>
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

          <div className="rounded-2xl border border-night-900/10 bg-sand-50 p-4">
            <p className="text-sm font-semibold text-night-900">Schedule</p>
            <p className="mt-1 text-xs text-night-600">
              Choose when the alert goes live and when it should automatically disappear from the
              home page.
            </p>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <label className="block">
                <span className="text-sm font-semibold text-night-800">
                  Start date &amp; time (optional)
                </span>
                <input
                  type="datetime-local"
                  value={startsAt}
                  onChange={(event) => setStartsAt(event.target.value)}
                  className="mt-1 w-full rounded-xl border border-night-900/10 bg-white px-3 py-2.5 text-sm outline-none ring-night-900/5 focus:ring-2"
                />
                <span className="mt-1 block text-xs text-night-500">
                  Leave blank to show immediately after publishing.
                </span>
                {startsAtIsFuture ? (
                  <button
                    type="button"
                    className="mt-2 text-xs font-semibold text-amber-900 underline"
                    onClick={() => setStartsAt("")}
                  >
                    Clear start — show on home immediately after update
                  </button>
                ) : null}
              </label>
              <label className="block">
                <span className="text-sm font-semibold text-night-800">
                  End date &amp; time (recommended)
                </span>
                <input
                  type="datetime-local"
                  value={expiresAt}
                  onChange={(event) => setExpiresAt(event.target.value)}
                  className="mt-1 w-full rounded-xl border border-night-900/10 bg-white px-3 py-2.5 text-sm outline-none ring-night-900/5 focus:ring-2"
                />
                <span className="mt-1 block text-xs text-night-500">
                  Alert auto-hides from home after this time.
                </span>
              </label>
            </div>
          </div>

          <label className="flex items-center gap-3 rounded-xl bg-sand-50 px-4 py-3 text-sm">
            <input
              type="checkbox"
              checked={sendPush}
              onChange={(event) => setSendPush(event.target.checked)}
            />
            <span>
              Also send a push notification when you update (uncheck to save without notifying
              again)
            </span>
          </label>

          {status ? (
            <p
              className={`rounded-xl px-3 py-2.5 text-sm ${
                statusTone === "error"
                  ? "bg-red-50 text-red-800"
                  : statusTone === "success"
                    ? "bg-emerald-50 text-emerald-900"
                    : "bg-sand-100 text-night-700"
              }`}
            >
              {status}
            </p>
          ) : null}

          {active?.id ? (
            <div className="space-y-4">
              <div className="rounded-2xl border border-night-900/10 bg-white p-4">
                <ShareActions
                  shareUrl={urgentAlertShareUrl(active.id)}
                  viewUrl={urgentAlertViewUrl(active.id)}
                  notifyEnabled={active.active}
                  onNotify={async () => {
                    const response = await fetch("/api/admin/urgent-alert/notify", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ id: active.id }),
                    });
                    const data = await response.json();
                    if (!response.ok) {
                      throw new Error(data.error ?? "Could not send notification.");
                    }
                  }}
                />
              </div>
            </div>
          ) : imageUrl ? (
            <p className="text-xs text-night-500">
              Publish to go live. Your flyer will also be used for share links and notifications
              automatically.
            </p>
          ) : (
            <p className="text-xs text-night-500">
              Add a flyer above if you want the full graphic on the home banner (optional).
            </p>
          )}
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
            {busy ? "Publishing..." : alertId || active ? "Update announcement" : "Publish announcement"}
          </Button>
          {alertId || active ? (
            <>
              <Button variant="secondary" onClick={deactivateCurrent} disabled={busy}>
                Turn off this one
              </Button>
              {flaggedAlerts.length > 0 ? (
                <Button variant="secondary" onClick={clearAllAlerts} disabled={busy}>
                  Turn off all
                </Button>
              ) : null}
            </>
          ) : null}
        </div>
      </Card>
    </div>
  );
}
