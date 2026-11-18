"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/components/auth/AuthProvider";
import { Button, Card } from "@/components/ui";
import { FormInput } from "@/components/ui/form-fields";
import { RichTextArea } from "@/components/ui/RichTextArea";
import { RichTextContent } from "@/components/ui/RichTextContent";
import { defaultDevotionScheduleTime } from "@/lib/devotion-schedule";
import {
  defaultScheduleDateInput,
  DEVOTION_TAG_COUPLES,
  devotionEditorBody,
  devotionFieldsFromEditorBody,
  devotionHasLegacySections,
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
  body: string;
  scheduleDate: string;
  scheduleTime: string;
  publishMode: DevotionPublishMode;
  forCouples: boolean;
  audioUrl?: string;
  audioName?: string;
};

function createEmptyForm(): DevotionForm {
  return {
    title: "",
    body: "",
    scheduleDate: defaultScheduleDateInput(),
    scheduleTime: defaultDevotionScheduleTime(),
    publishMode: "schedule",
    forCouples: false,
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
  const [showPreview, setShowPreview] = useState(false);
  const [focusMode, setFocusMode] = useState(false);
  const [queueQuery, setQueueQuery] = useState("");
  const [queueFilter, setQueueFilter] = useState<"all" | "draft" | "scheduled" | "live">("all");
  const [audioBusy, setAudioBusy] = useState(false);
  const [artwork, setArtwork] = useState<
    Pick<Devotion, "artworkSquareUrl" | "artworkWideUrl" | "artworkBannerUrl">
  >({});

  const readingTime = useMemo(
    () => estimateReadingTime({ content: form.body }),
    [form.body],
  );

  const wordCount = useMemo(() => form.body.trim().split(/\s+/).filter(Boolean).length, [form.body]);
  const paragraphCount = useMemo(() => form.body.trim() ? form.body.trim().split(/\n\s*\n/).filter(Boolean).length : 0, [form.body]);
  const filteredDevotions = useMemo(() => devotions.filter(devotion => {
    if (queueFilter !== "all" && getDevotionStatus(devotion) !== queueFilter) return false;
    const q = queueQuery.toLowerCase().trim();
    return !q || devotion.title.toLowerCase().includes(q) || (devotion.authorName ?? "").toLowerCase().includes(q);
  }), [devotions, queueFilter, queueQuery]);

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
      body: devotionEditorBody(devotion),
      scheduleDate: schedule.scheduleDate,
      scheduleTime: schedule.scheduleTime,
      publishMode: devotionToPublishMode(devotion),
      forCouples: devotion.tags?.includes(DEVOTION_TAG_COUPLES) ?? false,
      audioUrl: devotion.audioUrl,
      audioName: devotion.audioName,
    });
    setArtwork({
      artworkSquareUrl: devotion.artworkSquareUrl,
      artworkWideUrl: devotion.artworkWideUrl,
      artworkBannerUrl: devotion.artworkBannerUrl,
    });
    setShowPreview(false);
    setFocusMode(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function resetForm() {
    setEditingId(null);
    setForm(createEmptyForm());
    setArtwork({});
    setShowPreview(false);
    setFocusMode(false);
  }

  async function saveDevotion() {
    if (!form.title.trim() || !form.body.trim()) {
      setStatus("Add a title and devotion before saving.");
      return;
    }
    if (form.publishMode === "now" && !window.confirm("Publish this devotion to members now?")) return;
    setBusy(true);
    setStatus("");

    const fields = devotionFieldsFromEditorBody(form.body);
    const response = await fetch("/api/devotions", {
      method: editingId ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: form.title,
        ...fields,
        scheduleDate: form.scheduleDate,
        scheduleTime: form.scheduleTime,
        publishMode: form.publishMode,
        id: editingId ?? undefined,
        audioUrl: form.audioUrl ?? null,
        audioName: form.audioName ?? null,
        tags: form.forCouples ? [DEVOTION_TAG_COUPLES] : [],
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
      <section className="relative overflow-hidden rounded-[28px] bg-gradient-to-br from-[#102c56] via-[#1557a0] to-[#0a77c6] px-5 py-7 text-white shadow-[0_18px_50px_rgba(18,63,118,.18)] sm:px-9 sm:py-9">
        <div className="pointer-events-none absolute -right-20 -top-24 h-64 w-64 rounded-full border border-white/20 bg-white/5" aria-hidden="true" />
        <p className="relative text-[11px] font-extrabold uppercase tracking-[0.24em] text-sky-100">Shanah City · Editorial workspace</p>
        <h1 className="relative mt-3 font-display text-3xl font-extrabold tracking-tight sm:text-4xl">Devotion Studio</h1>
        <p className="relative mt-3 max-w-2xl text-sm leading-7 text-blue-50 sm:text-base">A peaceful space to prepare the Word, shape every reflection, and publish with confidence.</p>
        <div className="relative mt-6 flex flex-wrap items-center gap-2 text-xs font-semibold">
          <span className="rounded-full border border-white/25 bg-white/15 px-3 py-1.5">Writing as {user.name}</span>
          <span className="rounded-full border border-white/25 bg-white/15 px-3 py-1.5">{devotions.filter(d => getDevotionStatus(d) === "scheduled").length} scheduled</span>
          <span className="rounded-full border border-white/25 bg-white/15 px-3 py-1.5">{devotions.filter(d => getDevotionStatus(d) === "draft").length} drafts</span>
        </div>
      </section>

      <Card>
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="font-display text-xl font-semibold text-night-900">
              {editingId ? "Refine your devotion" : "Create a new devotion"}
            </h2>
            <p className="mt-1 text-sm text-night-600">
              Start with the message. Choose its release time when you are ready.
            </p>
          </div>
          {editingId && (
            <button
              type="button"
              onClick={() => { if (window.confirm("Discard the current edits and start a new devotion?")) resetForm(); }}
              className="text-sm font-semibold text-night-600 hover:text-night-900"
            >
              Cancel
            </button>
          )}
        </div>

        <div className="mt-7 space-y-5">
          <div>
            <label htmlFor="title" className="mb-2 block text-xs font-extrabold uppercase tracking-[0.15em] text-slate-500">
              Devotion title
            </label>
            <FormInput
              id="title"
              value={form.title}
              onValueChange={(title) => setForm((current) => ({ ...current, title }))}
              placeholder="Give today’s Word a compelling title…"
              className="!rounded-2xl !border-slate-200 !px-4 !py-4 !text-xl !font-bold !text-slate-900 !shadow-sm sm:!text-2xl"
            />
          </div>

          <label className="flex items-start gap-3 rounded-2xl border border-rose-200/80 bg-rose-50/60 p-3">
            <input
              type="checkbox"
              checked={form.forCouples}
              onChange={(event) =>
                setForm((current) => ({ ...current, forCouples: event.target.checked }))
              }
              className="mt-1"
            />
            <span className="text-sm text-night-800">
              <span className="font-semibold">For couples</span>
              <span className="mt-1 block text-xs text-night-600">
                Shows on the Shanah Power Couples group page and in couples devotion filters.
              </span>
            </span>
          </label>

          <div className="rounded-[24px] border border-slate-200 bg-white p-3 shadow-[0_10px_35px_rgba(15,47,88,.06)] sm:p-6">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
              <div>
                <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-blue-700">The message</p>
                <p className="mt-1 text-sm text-slate-500">Write naturally. Formatting and spacing are preserved.</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button type="button" onClick={() => setShowPreview(v => !v)} aria-pressed={showPreview} className={`rounded-xl px-3 py-2 text-sm font-bold transition ${showPreview ? "bg-blue-700 text-white" : "bg-blue-50 text-blue-800 hover:bg-blue-100"}`}>{showPreview ? "Back to writing" : "Reader preview"}</button>
                <button type="button" onClick={() => { setFocusMode(v => !v); setShowPreview(false); }} aria-pressed={focusMode} className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50">{focusMode ? "Exit focus" : "Focus mode"}</button>
              </div>
            </div>
            {showPreview ? (
              <div className="min-h-[420px] rounded-2xl bg-[#fbfcff] px-4 py-7 sm:px-9">
                <p className="mb-3 text-xs font-extrabold uppercase tracking-widest text-blue-700">{displayDate}</p>
                <h2 className="mb-7 font-display text-2xl font-extrabold leading-tight text-slate-900 sm:text-3xl">{form.title || "Untitled devotion"}</h2>
                <div className="whitespace-pre-wrap break-words text-[16px] leading-[1.9] text-slate-700"><RichTextContent text={form.body || "Your devotion preview will appear here as you write."} /></div>
              </div>
            ) : (
              <RichTextArea
                id="body"
                label="Devotion manuscript"
                value={form.body}
                onValueChange={(body) => setForm((current) => ({ ...current, body }))}
                rows={18}
                boldMode="inline"
                expandToFit
                className="!mt-3 !rounded-2xl !border-slate-200 !bg-[#fcfdff] !px-4 !py-5 !text-[16px] !leading-[1.9] !text-slate-900 sm:!px-6"
                hint="Tip: separate the scripture, reflection, prayer points, declaration, and further studies with blank lines. Select text and use B or I to format."
              />
            )}
            <div className="mt-4 flex flex-wrap gap-4 border-t border-slate-100 pt-4 text-xs font-semibold text-slate-500">
              <span>{wordCount} words</span><span>{paragraphCount} sections</span><span>{readingTime} read</span>
            </div>
          </div>


        <div className="mt-7 rounded-[24px] border border-blue-100 bg-gradient-to-br from-blue-50/90 to-white p-5 shadow-sm sm:p-6">
          <p className="text-xs font-extrabold uppercase tracking-[0.15em] text-blue-700">Publishing desk</p>
          <h3 className="mt-1 text-xl font-extrabold text-slate-900">When should this go live?</h3>
          <p className="mt-1 text-sm text-slate-600">Choose a draft, scheduled release, or immediate publication.</p>
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

      <section className="rounded-[26px] border border-slate-200 bg-white p-4 shadow-sm sm:p-7">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div><p className="text-xs font-extrabold uppercase tracking-[0.16em] text-blue-700">Publishing library</p><h3 className="mt-1 font-display text-2xl font-extrabold text-slate-900">Your devotions</h3><p className="mt-1 text-sm text-slate-500">Find drafts, review the schedule, or update a published message.</p></div>
          <span className="text-sm font-semibold text-slate-500">{devotions.length} entries</span>
        </div>
        <div className="mt-5 flex flex-col gap-3 sm:flex-row">
          <input aria-label="Search devotions" placeholder="Search title or author…" value={queueQuery} onChange={event => setQueueQuery(event.target.value)} className="min-w-0 flex-1 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-base outline-none focus:border-blue-500" />
          <select aria-label="Filter by publication status" value={queueFilter} onChange={event => setQueueFilter(event.target.value as typeof queueFilter)} className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-base text-slate-800"><option value="all">All statuses</option><option value="draft">Drafts</option><option value="scheduled">Scheduled</option><option value="live">Published</option></select>
        </div>
        <div className="space-y-3">
          {filteredDevotions.map((devotion) => (
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
                    {devotion.authorName ?? "Team ZNCF"} · {devotion.readingTime}
                    {devotionHasLegacySections(devotion) && devotion.reference
                      ? ` · ${devotion.reference}`
                      : ""}
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
          {filteredDevotions.length === 0 && (
            <Card>
              <p className="text-sm text-night-600">
                {devotions.length ? "No devotions match your search." : "No devotions yet. Write your first one above."}
              </p>
            </Card>
          )}
        </div>
      </section>
    </div>
  );
}
