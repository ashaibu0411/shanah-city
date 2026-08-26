"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/components/auth/AuthProvider";
import { Button, Card } from "@/components/ui";
import { FormInput } from "@/components/ui/form-fields";
import { RichTextArea } from "@/components/ui/RichTextArea";
import { defaultDevotionScheduleTime } from "@/lib/devotion-schedule";
import {
  defaultScheduleDateInput,
  devotionToPublishMode,
  devotionToScheduleInputs,
  estimateReadingTime,
  formatDisplayDateFromInput,
  formatScheduleLabel,
  getDevotionStatus,
  isDevotionPubliclyVisible,
  type DevotionPublishMode,
} from "@/lib/devotion-utils";
import { devotionGroupMatchHint } from "@/lib/devotion-writers-group";
import { devotionShareUrl, devotionViewUrl } from "@/lib/share-urls";
import { ContentArtworkPanel } from "@/components/share/ContentArtworkPanel";
import { ShareActions } from "@/components/share/ShareActions";
import type { Devotion } from "@/lib/types";

type DevotionForm = {
  title: string;
  verse: string;
  reference: string;
  content: string;
  prayer: string;
  scheduleDate: string;
  scheduleTime: string;
  publishMode: DevotionPublishMode;
  audioUrl?: string;
  audioName?: string;
};

function createEmptyForm(): DevotionForm {
  return {
    title: "",
    verse: "",
    reference: "",
    content: "",
    prayer: "",
    scheduleDate: defaultScheduleDateInput(),
    scheduleTime: defaultDevotionScheduleTime(),
    publishMode: "schedule",
  };
}

function statusLabel(devotion: Devotion) {
  const status = getDevotionStatus(devotion);
  if (status === "draft") return "Draft";
  if (status === "scheduled") return `Scheduled · ${formatScheduleLabel(devotion)}`;
  return `Live · ${devotion.date}`;
}

function statusClass(devotion: Devotion) {
  const status = getDevotionStatus(devotion);
  if (status === "draft") return "bg-sand-100 text-night-700";
  if (status === "scheduled") return "bg-amber-100 text-amber-800";
  return "bg-emerald-100 text-emerald-800";
}

export function DevotionAdminPanel() {
  const { user, loading, permissions } = useAuth();
  const [devotions, setDevotions] = useState<Devotion[]>([]);
  const [form, setForm] = useState<DevotionForm>(createEmptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);
  const [audioBusy, setAudioBusy] = useState(false);
  const [artwork, setArtwork] = useState<
    Pick<Devotion, "artworkSquareUrl" | "artworkWideUrl" | "artworkBannerUrl">
  >({});

  const readingTime = useMemo(
    () =>
      estimateReadingTime({
        verse: form.verse,
        content: form.content,
        prayer: form.prayer,
      }),
    [form.verse, form.content, form.prayer],
  );

  const displayDate = useMemo(
    () => formatDisplayDateFromInput(form.scheduleDate),
    [form.scheduleDate],
  );

  const editingDevotion = useMemo(
    () => devotions.find((devotion) => devotion.id === editingId) ?? null,
    [devotions, editingId],
  );

  async function loadDevotions() {
    if (!permissions.canWriteDevotions) return;

    const response = await fetch("/api/devotions?all=1");
    const data = await response.json();
    if (response.ok) {
      setDevotions(data.devotions ?? []);
      setStatus("");
    } else {
      setStatus(data.error ?? "Could not load devotions.");
    }
  }

  useEffect(() => {
    if (permissions.canWriteDevotions) {
      loadDevotions();
    }
  }, [permissions.canWriteDevotions]);

  function startEdit(devotion: Devotion) {
    const schedule = devotionToScheduleInputs(devotion);
    setEditingId(devotion.id);
    setForm({
      title: devotion.title,
      verse: devotion.verse,
      reference: devotion.reference,
      content: devotion.content,
      prayer: devotion.prayer,
      scheduleDate: schedule.scheduleDate,
      scheduleTime: schedule.scheduleTime,
      publishMode: devotionToPublishMode(devotion),
      audioUrl: devotion.audioUrl,
      audioName: devotion.audioName,
    });
    setArtwork({
      artworkSquareUrl: devotion.artworkSquareUrl,
      artworkWideUrl: devotion.artworkWideUrl,
      artworkBannerUrl: devotion.artworkBannerUrl,
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function resetForm() {
    setEditingId(null);
    setForm(createEmptyForm());
    setArtwork({});
  }

  async function saveDevotion() {
    setBusy(true);
    setStatus("");

    const response = await fetch("/api/devotions", {
      method: editingId ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        id: editingId ?? undefined,
        audioUrl: form.audioUrl ?? null,
        audioName: form.audioName ?? null,
      }),
    });
    const data = await response.json();
    setBusy(false);

    if (!response.ok) {
      setStatus(data.error ?? "Could not save devotion.");
      return;
    }

    if (form.publishMode === "draft") {
      setStatus("Draft saved.");
    } else if (form.publishMode === "now") {
      setStatus(
        "Devotion published now. Home and Devotions will update immediately. Push alerts go to other members with notifications enabled (not to you as the author).",
      );
    } else {
      setStatus(
        `Devotion scheduled for ${displayDate} at ${form.scheduleTime}. Push alerts send when it goes live.`,
      );
    }

    resetForm();
    await loadDevotions();
  }

  async function uploadAudio(file: File | null) {
    if (!file) return;
    setAudioBusy(true);
    setStatus("");

    const formData = new FormData();
    formData.append("file", file);
    const response = await fetch("/api/devotions/audio", {
      method: "POST",
      body: formData,
    });
    const data = await response.json();
    setAudioBusy(false);

    if (!response.ok) {
      setStatus(data.error ?? "Could not upload audio.");
      return;
    }

    setForm((current) => ({
      ...current,
      audioUrl: data.audioUrl,
      audioName: data.audioName,
    }));
    setStatus("Audio uploaded. Save the devotion to attach it.");
  }

  function removeAudio() {
    setForm((current) => ({
      ...current,
      audioUrl: undefined,
      audioName: undefined,
    }));
  }

  async function removeDevotion(id: string) {
    if (!window.confirm("Delete this devotion?")) return;

    const response = await fetch("/api/devotions", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });

    if (response.ok) {
      setStatus("Devotion deleted.");
      await loadDevotions();
    }
  }

  if (loading) {
    return <Card>Loading account...</Card>;
  }

  if (!user) {
    return (
      <Card>
        <h2 className="font-display text-xl font-semibold text-night-900">Sign in required</h2>
        <p className="mt-2 text-sm text-night-600">
          Sign in with your Shanah City account to write devotions.
        </p>
        <Button href="/sign-in?next=/admin/devotions" className="mt-4">
          Sign in
        </Button>
      </Card>
    );
  }

  if (!permissions.canWriteDevotions) {
    return (
      <Card>
        <h2 className="font-display text-xl font-semibold text-night-900">Team ZNCF only</h2>
        <p className="mt-2 text-sm text-night-600">
          Devotion writing is hidden from the main menu and limited to members of{" "}
          {devotionGroupMatchHint()}. Ask a Team ZNCF leader to add you on{" "}
          <Link href="/groups" className="font-semibold text-night-800 hover:underline">
            Groups
          </Link>
          .
        </p>
        <Button href="/devotions" variant="secondary" className="mt-4">
          Read devotions
        </Button>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <h2 className="font-display text-xl font-semibold text-night-900">
          Team ZNCF editor
        </h2>
        <p className="mt-2 text-sm text-night-600">
          Signed in as <strong>{user.name}</strong>. Pick a date and time on the calendar,
          write the devotion, and schedule it to go live automatically.
        </p>
      </Card>

      <Card>
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="font-display text-xl font-semibold text-night-900">
              {editingId ? "Edit devotion" : "Write a devotion"}
            </h2>
            <p className="mt-1 text-sm text-night-600">
              Most devotions can be scheduled ahead. Reading time updates automatically.
            </p>
          </div>
          {editingId && (
            <button
              type="button"
              onClick={resetForm}
              className="text-sm font-semibold text-night-600 hover:text-night-900"
            >
              Cancel
            </button>
          )}
        </div>

        <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50/70 p-4">
          <p className="text-sm font-semibold text-night-900">When should this go live?</p>
          <div className="mt-3 grid gap-2 sm:grid-cols-3">
            {(
              [
                ["schedule", "Schedule"],
                ["now", "Publish now"],
                ["draft", "Save draft"],
              ] as const
            ).map(([mode, label]) => (
              <button
                key={mode}
                type="button"
                onClick={() => setForm((current) => ({ ...current, publishMode: mode }))}
                className={`rounded-xl px-3 py-2.5 text-sm font-semibold transition ${
                  form.publishMode === mode
                    ? "bg-night-900 text-sand-50 shadow-sm"
                    : "bg-white text-night-700 ring-1 ring-night-900/10 hover:bg-sand-50"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {form.publishMode !== "draft" && (
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="scheduleDate" className="text-sm font-semibold text-night-800">
                  Display date
                </label>
                <FormInput
                  id="scheduleDate"
                  type="date"
                  value={form.scheduleDate}
                  onValueChange={(scheduleDate) =>
                    setForm((current) => ({
                      ...current,
                      scheduleDate,
                    }))
                  }
                />
                <p className="mt-1 text-xs text-night-600">Shows as {displayDate}</p>
              </div>

              <div>
                <label htmlFor="scheduleTime" className="text-sm font-semibold text-night-800">
                  {form.publishMode === "now" ? "Time (optional)" : "Go-live time"}
                </label>
                <FormInput
                  id="scheduleTime"
                  type="time"
                  value={form.scheduleTime}
                  onValueChange={(scheduleTime) =>
                    setForm((current) => ({
                      ...current,
                      scheduleTime,
                    }))
                  }
                  disabled={form.publishMode === "now"}
                  className="disabled:bg-sand-100 disabled:text-night-500"
                />
                <p className="mt-1 text-xs text-night-600">
                  {form.publishMode === "now"
                    ? "Publish now ignores the time picker."
                    : `Members will see this on ${displayDate} at ${form.scheduleTime}.`}
                </p>
              </div>
            </div>
          )}

          <div className="mt-4 flex flex-wrap items-center gap-3 rounded-xl bg-white/80 px-3 py-2 text-sm text-night-700 ring-1 ring-night-900/5">
            <span className="font-semibold text-night-900">Estimated reading time</span>
            <span>{readingTime}</span>
            <span className="text-night-500">· updates as you write</span>
          </div>
        </div>

        <div className="mt-5 space-y-3">
          <div>
            <label htmlFor="title" className="text-sm font-semibold text-night-800">
              Title
            </label>
            <FormInput
              id="title"
              value={form.title}
              onValueChange={(title) => setForm((current) => ({ ...current, title }))}
            />
          </div>

          <div>
            <label htmlFor="reference" className="text-sm font-semibold text-night-800">
              Scripture reference
            </label>
            <FormInput
              id="reference"
              value={form.reference}
              onValueChange={(reference) =>
                setForm((current) => ({ ...current, reference }))
              }
            />
          </div>

          <RichTextArea
            id="verse"
            label="Verse"
            value={form.verse}
            onValueChange={(verse) => setForm((current) => ({ ...current, verse }))}
            rows={3}
            boldMode="none"
          />

          <RichTextArea
            id="content"
            label="Reflection"
            value={form.content}
            onValueChange={(content) => setForm((current) => ({ ...current, content }))}
            rows={5}
            boldMode="header"
          />

          <RichTextArea
            id="prayer"
            label="Prayer"
            value={form.prayer}
            onValueChange={(prayer) => setForm((current) => ({ ...current, prayer }))}
            rows={3}
            boldMode="none"
          />

          <div className="rounded-2xl border border-night-900/10 bg-sand-50/70 p-4">
            <p className="text-sm font-semibold text-night-900">Audio version (optional)</p>
            <p className="mt-1 text-xs text-night-600">
              Upload a recording for anyone who prefers to listen. MP3, M4A, WAV, OGG, or WEBM up to
              25 MB. Without an upload, listeners can still use Listen mode with device text-to-speech.
            </p>

            {form.audioUrl ? (
              <div className="mt-3 space-y-2">
                <p className="text-sm font-medium text-night-800">
                  {form.audioName ?? "Attached audio"}
                </p>
                <audio controls preload="metadata" className="w-full" src={form.audioUrl}>
                  Your browser does not support audio playback.
                </audio>
                <button
                  type="button"
                  onClick={removeAudio}
                  className="text-xs font-semibold text-red-700 underline"
                >
                  Remove audio
                </button>
              </div>
            ) : (
              <div className="mt-3">
                <input
                  type="file"
                  accept="audio/*,.mp3,.m4a,.wav,.ogg,.webm"
                  disabled={audioBusy}
                  onChange={(event) => uploadAudio(event.target.files?.[0] ?? null)}
                  className="block w-full text-sm text-night-700 file:mr-3 file:rounded-full file:border-0 file:bg-night-900 file:px-4 file:py-2 file:text-xs file:font-semibold file:text-sand-50"
                />
                {audioBusy && (
                  <p className="mt-2 text-xs text-night-500">Uploading audio…</p>
                )}
              </div>
            )}
          </div>

          {editingId ? (
            <div className="space-y-4">
              <ContentArtworkPanel
                devotionId={editingId}
                artwork={artwork}
                onChange={(next) => {
                  setArtwork(next);
                  setDevotions((current) =>
                    current.map((item) =>
                      item.id === editingId ? { ...item, ...next } : item,
                    ),
                  );
                }}
                disabled={busy}
              />
              <div className="rounded-2xl border border-night-900/10 bg-white p-4">
                <ShareActions
                  shareUrl={devotionShareUrl(editingId)}
                  viewUrl={devotionViewUrl(editingId)}
                  notifyEnabled={Boolean(
                    editingDevotion && isDevotionPubliclyVisible(editingDevotion),
                  )}
                  onNotify={async () => {
                    const response = await fetch("/api/devotions/notify", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ id: editingId }),
                    });
                    const data = await response.json();
                    if (!response.ok) {
                      throw new Error(data.error ?? "Could not send notification.");
                    }
                  }}
                />
              </div>
            </div>
          ) : null}
        </div>

        <div className="mt-5 flex flex-wrap gap-3">
          <Button onClick={saveDevotion} disabled={busy}>
            {busy
              ? "Saving..."
              : form.publishMode === "draft"
                ? "Save draft"
                : form.publishMode === "now"
                  ? editingId
                    ? "Publish update"
                    : "Publish now"
                  : editingId
                    ? "Update schedule"
                    : "Schedule devotion"}
          </Button>
          <Button href="/devotions" variant="secondary">
            View devotions
          </Button>
        </div>

        {status && (
          <p className="mt-4 rounded-xl bg-sand-100 px-3 py-2 text-sm text-night-700">
            {status}
          </p>
        )}
      </Card>

      <section>
        <h3 className="mb-3 font-display text-lg font-semibold text-night-900">
          Devotion queue
        </h3>
        <div className="space-y-3">
          {devotions.map((devotion) => (
            <Card key={devotion.id}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <span
                    className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${statusClass(devotion)}`}
                  >
                    {statusLabel(devotion)}
                  </span>
                  <h4 className="mt-2 font-display text-lg font-semibold text-night-900">
                    {devotion.title}
                  </h4>
                  <p className="mt-1 text-sm text-night-600">
                    {devotion.authorName ?? "Team ZNCF"} · {devotion.reference} ·{" "}
                    {devotion.readingTime}
                    {devotion.audioUrl ? " · Audio" : ""}
                    {devotion.artworkWideUrl || devotion.artworkSquareUrl || devotion.artworkBannerUrl
                      ? " · Artwork"
                      : ""}
                  </p>
                </div>
                <div className="flex flex-col gap-2">
                  <button
                    type="button"
                    onClick={() => startEdit(devotion)}
                    className="rounded-lg bg-sand-100 px-3 py-1.5 text-xs font-semibold text-night-800"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => removeDevotion(devotion.id)}
                    className="rounded-lg bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700"
                  >
                    Delete
                  </button>
                </div>
              </div>
              {isDevotionPubliclyVisible(devotion) ? (
                <div className="mt-4 border-t border-night-900/8 pt-4">
                  <ShareActions
                    compact
                    shareUrl={devotionShareUrl(devotion.id)}
                    viewUrl={devotionViewUrl(devotion.id)}
                    notifyEnabled
                    onNotify={async () => {
                      const response = await fetch("/api/devotions/notify", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ id: devotion.id }),
                      });
                      const data = await response.json();
                      if (!response.ok) {
                        throw new Error(data.error ?? "Could not send notification.");
                      }
                    }}
                  />
                </div>
              ) : null}
            </Card>
          ))}
          {devotions.length === 0 && (
            <Card>
              <p className="text-sm text-night-600">
                No devotions yet. Schedule your first one above.
              </p>
            </Card>
          )}
        </div>
      </section>
    </div>
  );
}
