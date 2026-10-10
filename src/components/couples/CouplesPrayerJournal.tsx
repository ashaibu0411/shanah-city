"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { CouplesLinkGate } from "@/components/couples/CouplesLinkGate";
import {
  CouplesLoadingSkeleton,
  CouplesPrimaryButton,
  CouplesSecondaryButton,
} from "@/components/couples/design-system";
import { couplesHubPremium } from "@/components/couples/couples-hub-premium";
import {
  COUPLE_PRAYER_JOURNAL_CATEGORIES,
  type CouplePrayerJournalCategoryId,
  type CouplePrayerJournalEntryView,
  type CouplePrayerJournalPrivacy,
} from "@/lib/couple-prayer-journal-types";
import {
  formatPrayerDate,
  prayerJournalCategoryMeta,
  prayerJournalPhotoUrl,
  prayerJournalStatusBadge,
  PrayerJournalCategoryIcon,
  prayerPreview,
  type PrayerJournalTab,
} from "@/lib/couple-prayer-journal-ui";
import type { CouplesHubOverview } from "@/lib/couples-hub-types";

function TabSelector({ active, onChange }: { active: PrayerJournalTab; onChange: (tab: PrayerJournalTab) => void }) {
  const tabs: { id: PrayerJournalTab; label: string }[] = [
    { id: "requests", label: "Requests" },
    { id: "answered", label: "Answered" },
    { id: "add", label: "Add Prayer" },
  ];
  return (
    <div
      className="flex rounded-full bg-[var(--couples-gold-light)]/55 p-1 ring-1 ring-[var(--couples-border)]"
      role="tablist"
    >
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          role="tab"
          aria-selected={active === tab.id}
          onClick={() => onChange(tab.id)}
          className={`flex-1 rounded-full px-2 py-2.5 text-center text-xs font-semibold transition motion-reduce:transition-none sm:text-sm ${
            active === tab.id
              ? "bg-[var(--couples-surface)] text-[var(--couples-text)] shadow-sm"
              : "text-[var(--couples-muted)]"
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}

export function CouplesPrayerJournal() {
  const [hub, setHub] = useState<CouplesHubOverview | null>(null);
  const [entries, setEntries] = useState<CouplePrayerJournalEntryView[]>([]);
  const [tab, setTab] = useState<PrayerJournalTab>("requests");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [celebrate, setCelebrate] = useState(false);

  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [category, setCategory] = useState<CouplePrayerJournalCategoryId>("our-marriage");
  const [scriptureRef, setScriptureRef] = useState("");
  const [privacy, setPrivacy] = useState<CouplePrayerJournalPrivacy>("couple");

  const [detailEntry, setDetailEntry] = useState<CouplePrayerJournalEntryView | null>(null);
  const [answeredOpen, setAnsweredOpen] = useState(false);
  const [answeredDate, setAnsweredDate] = useState("");
  const [testimony, setTestimony] = useState("");
  const [thanksgivingScripture, setThanksgivingScripture] = useState("");
  const [photoKey, setPhotoKey] = useState<string | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  const locked = !hub?.hasActiveLink;

  const visible = useMemo(() => {
    if (tab === "add") return [];
    return entries.filter((entry) =>
      tab === "requests" ? entry.status === "praying" : entry.status === "answered",
    );
  }, [entries, tab]);

  const loadHub = useCallback(() => {
    return fetch("/api/couples/hub")
      .then(async (response) => {
        const data = await response.json();
        if (response.ok) setHub(data.overview ?? null);
      })
      .catch(() => undefined);
  }, []);

  const loadJournal = useCallback(() => {
    setLoading(true);
    setError(null);
    return fetch("/api/couples/prayer-journal")
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error ?? "Could not load journal.");
        setEntries(Array.isArray(data.entries) ? data.entries : []);
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : "Could not load journal.");
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    void loadHub();
  }, [loadHub]);

  useEffect(() => {
    if (!locked) void loadJournal();
  }, [loadJournal, locked]);

  function resetComposer() {
    setTitle("");
    setBody("");
    setCategory("our-marriage");
    setScriptureRef("");
    setPrivacy("couple");
    setStatus(null);
  }

  async function createEntry() {
    setBusy(true);
    setStatus(null);
    const response = await fetch("/api/couples/prayer-journal", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "create",
        title,
        body,
        category,
        scriptureRef,
        privacy,
      }),
    });
    const data = await response.json();
    setBusy(false);
    if (!response.ok) {
      setStatus(data.error ?? "Could not save.");
      return;
    }
    setEntries(Array.isArray(data.entries) ? data.entries : []);
    resetComposer();
    setTab("requests");
    setStatus("Prayer saved.");
  }

  function openAnsweredFlow(entry: CouplePrayerJournalEntryView) {
    setDetailEntry(entry);
    setAnsweredDate(new Date().toISOString().slice(0, 10));
    setTestimony("");
    setThanksgivingScripture("");
    setPhotoKey(null);
    setPhotoPreview(null);
    setAnsweredOpen(true);
  }

  async function uploadPhoto(file: File) {
    const form = new FormData();
    form.append("file", file);
    const response = await fetch("/api/couples/prayer-journal/photo", {
      method: "POST",
      body: form,
    });
    const data = await response.json();
    if (!response.ok) {
      setStatus(data.error ?? "Could not upload photo.");
      return;
    }
    setPhotoKey(data.photoKey ?? null);
    setPhotoPreview(URL.createObjectURL(file));
  }

  async function submitAnswered() {
    if (!detailEntry) return;
    setBusy(true);
    setStatus(null);
    const response = await fetch("/api/couples/prayer-journal", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "update",
        entryId: detailEntry.id,
        status: "answered",
        answeredAt: answeredDate,
        testimony,
        thanksgivingScripture,
        answeredPhotoKey: photoKey,
      }),
    });
    const data = await response.json();
    setBusy(false);
    if (!response.ok) {
      setStatus(data.error ?? "Could not save.");
      return;
    }
    setEntries(Array.isArray(data.entries) ? data.entries : []);
    setAnsweredOpen(false);
    setDetailEntry(null);
    setCelebrate(true);
    window.setTimeout(() => setCelebrate(false), 1500);
    setTab("answered");
  }

  async function removeEntry(entryId: string) {
    if (!window.confirm("Remove this prayer from your journal?")) return;
    setBusy(true);
    const response = await fetch("/api/couples/prayer-journal", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "delete", entryId }),
    });
    const data = await response.json();
    setBusy(false);
    if (response.ok) {
      setEntries(Array.isArray(data.entries) ? data.entries : []);
      setDetailEntry(null);
    }
  }

  return (
    <div className={`${couplesHubPremium.page} couples-hub-typography min-h-full`}>
      {celebrate ? (
        <div
          className="pointer-events-none fixed inset-0 z-[60] flex items-center justify-center motion-reduce:hidden"
          aria-hidden
        >
          <span className="prayer-journal-celebrate text-center">
            <span className="block text-5xl text-[var(--couples-gold)]">✦</span>
            <span className="mt-2 block font-[family-name:var(--font-couples-display)] text-lg text-white drop-shadow">
              God is faithful
            </span>
          </span>
        </div>
      ) : null}

      <div className="mx-auto w-full max-w-lg">
        <header
          className="sticky top-0 z-20 flex min-h-[3.25rem] items-center gap-2 bg-[var(--couples-midnight)] px-[var(--couples-page-padding)] py-3 text-white safe-top"
        >
          <Link
            href="/couples/marriage"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-2xl font-light transition hover:bg-white/10 active:scale-95"
            aria-label="Back to Our Marriage"
          >
            ‹
          </Link>
          <h1
            className="min-w-0 flex-1 truncate text-center font-[family-name:var(--font-couples-display)] text-[1.05rem] font-semibold tracking-tight"
          >
            Prayer Journal
          </h1>
          <span className="h-11 w-11 shrink-0" aria-hidden />
        </header>

        <main className="px-[var(--couples-page-padding)] pb-10 pt-4">
          {locked ? (
            <CouplesLinkGate pendingIncoming={hub?.pendingIncomingInvite} />
          ) : (
            <>
              <TabSelector active={tab} onChange={setTab} />

              {error ? <p className={`mt-4 ${couplesHubPremium.sheetStatusError}`}>{error}</p> : null}

              {tab === "add" ? (
                <div className="mt-5 rounded-[var(--couples-radius-card)] bg-white p-5 shadow-sm ring-1 ring-[var(--couples-border)]">
                  <h2
                    className="font-[family-name:var(--font-couples-display)] text-xl font-semibold text-[var(--couples-text)]"
                  >
                    Add a prayer
                  </h2>
                  <p className="mt-1 text-sm text-[var(--couples-muted)]">
                    Write what you are lifting up together in faith.
                  </p>

                  <label className="mt-5 block text-sm">
                    <span className="text-xs font-semibold uppercase tracking-wide text-[var(--couples-muted)]">
                      Prayer title
                    </span>
                    <input
                      className={`mt-1.5 ${couplesHubPremium.sheetInput}`}
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="What are you praying for?"
                    />
                  </label>

                  <label className="mt-4 block text-sm">
                    <span className="text-xs font-semibold uppercase tracking-wide text-[var(--couples-muted)]">
                      Prayer description
                    </span>
                    <textarea
                      rows={5}
                      className={`mt-1.5 ${couplesHubPremium.sheetInput} min-h-[7rem]`}
                      value={body}
                      onChange={(e) => setBody(e.target.value)}
                      placeholder="Share the details of your request…"
                    />
                  </label>

                  <label className="mt-4 block text-sm">
                    <span className="text-xs font-semibold uppercase tracking-wide text-[var(--couples-muted)]">
                      Category
                    </span>
                    <select
                      className={`mt-1.5 ${couplesHubPremium.sheetInput}`}
                      value={category}
                      onChange={(e) => setCategory(e.target.value as CouplePrayerJournalCategoryId)}
                    >
                      {COUPLE_PRAYER_JOURNAL_CATEGORIES.map((cat) => (
                        <option key={cat.id} value={cat.id}>
                          {cat.label} — {cat.description}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="mt-4 block text-sm">
                    <span className="text-xs font-semibold uppercase tracking-wide text-[var(--couples-muted)]">
                      Scripture (optional)
                    </span>
                    <input
                      className={`mt-1.5 ${couplesHubPremium.sheetInput}`}
                      value={scriptureRef}
                      onChange={(e) => setScriptureRef(e.target.value)}
                      placeholder="e.g. Philippians 4:6"
                    />
                  </label>

                  <fieldset className="mt-4">
                    <legend className="text-xs font-semibold uppercase tracking-wide text-[var(--couples-muted)]">
                      Privacy
                    </legend>
                    <div className="mt-2 space-y-2">
                      {(
                        [
                          { id: "couple" as const, label: "Our journal", hint: "Visible to both spouses" },
                          { id: "personal" as const, label: "Personal", hint: "Only you can see this entry" },
                        ] as const
                      ).map((option) => (
                        <button
                          key={option.id}
                          type="button"
                          onClick={() => setPrivacy(option.id)}
                          className={`flex w-full items-start gap-3 rounded-2xl px-4 py-3 text-left ring-1 transition ${
                            privacy === option.id
                              ? "bg-[var(--couples-gold-light)]/40 ring-[var(--couples-gold)]"
                              : "bg-[var(--couples-ivory)] ring-[var(--couples-border)]"
                          }`}
                        >
                          <span
                            className={`mt-0.5 h-4 w-4 shrink-0 rounded-full border-2 ${
                              privacy === option.id
                                ? "border-[var(--couples-gold)] bg-[var(--couples-gold)]"
                                : "border-[var(--couples-muted)]"
                            }`}
                          />
                          <span>
                            <span className="block text-sm font-semibold text-[var(--couples-text)]">
                              {option.label}
                            </span>
                            <span className="block text-xs text-[var(--couples-muted)]">{option.hint}</span>
                          </span>
                        </button>
                      ))}
                    </div>
                  </fieldset>

                  <CouplesPrimaryButton className="mt-6" disabled={busy} onClick={() => void createEntry()}>
                    Save prayer
                  </CouplesPrimaryButton>
                  {status ? <p className={`mt-3 text-sm ${couplesHubPremium.sheetStatusOk}`}>{status}</p> : null}
                </div>
              ) : loading ? (
                <div className="mt-5">
                  <CouplesLoadingSkeleton rows={4} />
                </div>
              ) : visible.length === 0 ? (
                <div className="mt-8 rounded-2xl bg-white/80 p-6 text-center ring-1 ring-[var(--couples-border)]">
                  <p className="font-[family-name:var(--font-couples-display)] text-lg text-[var(--couples-text)]">
                    {tab === "requests" ? "No active requests yet" : "No answered prayers yet"}
                  </p>
                  <p className="mt-2 text-sm text-[var(--couples-muted)]">
                    {tab === "requests"
                      ? "Add a prayer and trust God together."
                      : "When God answers, celebrate His faithfulness here."}
                  </p>
                  <CouplesSecondaryButton className="mt-4" onClick={() => setTab("add")}>
                    Add Prayer
                  </CouplesSecondaryButton>
                </div>
              ) : (
                <ul className="mt-5 space-y-3">
                  {visible.map((entry) => {
                    const meta = prayerJournalCategoryMeta(entry.category);
                    const dateLabel =
                      entry.status === "answered"
                        ? formatPrayerDate(entry.answeredAt) ?? formatPrayerDate(entry.updatedAt)
                        : formatPrayerDate(entry.createdAt);
                    return (
                      <li key={entry.id}>
                        <button
                          type="button"
                          onClick={() => setDetailEntry(entry)}
                          className="flex w-full items-start gap-3 rounded-2xl bg-white p-4 text-left shadow-sm ring-1 ring-[var(--couples-border)] transition active:scale-[0.99]"
                        >
                          <span
                            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[var(--couples-ivory)] text-[var(--couples-mocha)] ring-1 ring-[var(--couples-border)]"
                            aria-hidden
                          >
                            <PrayerJournalCategoryIcon icon={meta.icon} />
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="flex flex-wrap items-center gap-2">
                              <span className="font-semibold text-[var(--couples-text)]">{entry.title}</span>
                              <span
                                className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${prayerJournalStatusBadge(entry.status)}`}
                              >
                                {entry.status === "answered" ? "Answered" : "Praying"}
                              </span>
                            </span>
                            <p className="mt-1 text-sm text-[var(--couples-muted)]">{prayerPreview(entry.body)}</p>
                            <p className="mt-1 text-xs text-[var(--couples-muted)]">
                              {meta.label}
                              {dateLabel ? ` · ${dateLabel}` : ""}
                              {entry.privacy === "personal" ? " · Personal" : ""}
                            </p>
                          </span>
                          <span className="shrink-0 text-lg text-[var(--couples-muted)]" aria-hidden>›</span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </>
          )}
        </main>
      </div>

      {detailEntry ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-4 sm:items-center">
          <div
            className={`${couplesHubPremium.sheetModal} max-h-[90vh] overflow-y-auto`}
            role="dialog"
            aria-labelledby="prayer-detail-title"
          >
            {(() => {
              const meta = prayerJournalCategoryMeta(detailEntry.category);
              const photoSrc = prayerJournalPhotoUrl(detailEntry.answeredPhotoKey);
              return (
                <>
                  <div className="flex items-start gap-3">
                    <span
                      className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-900 ring-1 ring-emerald-100"
                    >
                      <PrayerJournalCategoryIcon icon={meta.icon} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <h2
                        id="prayer-detail-title"
                        className="font-[family-name:var(--font-couples-display)] text-xl font-semibold text-[var(--couples-text)]"
                      >
                        {detailEntry.title}
                      </h2>
                      <p className="text-sm text-[var(--couples-muted)]">{meta.description}</p>
                    </div>
                    <button
                      type="button"
                      className="text-2xl font-light text-[var(--couples-muted)]"
                      onClick={() => setDetailEntry(null)}
                      aria-label="Close"
                    >
                      ×
                    </button>
                  </div>

                  {detailEntry.scriptureRef ? (
                    <p className="mt-4 text-sm font-medium text-[var(--couples-gold)]">{detailEntry.scriptureRef}</p>
                  ) : null}

                  <p className="mt-4 whitespace-pre-wrap text-sm leading-relaxed text-[var(--couples-text)]">
                    {detailEntry.body}
                  </p>

                  {detailEntry.status === "answered" && detailEntry.testimony ? (
                    <div className="mt-5 rounded-2xl bg-emerald-50/80 p-4 ring-1 ring-emerald-100">
                      <p className="text-xs font-semibold uppercase tracking-wide text-emerald-900">Testimony</p>
                      <p className="mt-2 whitespace-pre-wrap text-sm text-emerald-950">{detailEntry.testimony}</p>
                      {detailEntry.thanksgivingScripture ? (
                        <p className="mt-3 text-sm font-medium text-emerald-900">
                          {detailEntry.thanksgivingScripture}
                        </p>
                      ) : null}
                      {photoSrc ? (
                        <div className="relative mt-4 aspect-[4/3] overflow-hidden rounded-xl">
                          <Image src={photoSrc} alt="" fill className="object-cover" sizes="(max-width: 480px) 100vw" />
                        </div>
                      ) : null}
                    </div>
                  ) : null}

                  <div className="mt-6 flex flex-col gap-2">
                    {detailEntry.status === "praying" ? (
                      <CouplesPrimaryButton disabled={busy} onClick={() => openAnsweredFlow(detailEntry)}>
                        Mark as answered
                      </CouplesPrimaryButton>
                    ) : null}
                    <button
                      type="button"
                      className="text-sm font-semibold text-red-700/90"
                      onClick={() => void removeEntry(detailEntry.id)}
                    >
                      Remove prayer
                    </button>
                  </div>
                </>
              );
            })()}
          </div>
        </div>
      ) : null}

      {answeredOpen && detailEntry ? (
        <div className="fixed inset-0 z-[55] flex items-end justify-center bg-black/55 p-4 sm:items-center">
          <div className={`${couplesHubPremium.sheetModal} max-h-[90vh] overflow-y-auto`}>
            <h2 className="font-[family-name:var(--font-couples-display)] text-xl font-semibold text-[var(--couples-text)]">
              Celebrate this answer
            </h2>
            <p className="mt-1 text-sm text-[var(--couples-muted)]">{detailEntry.title}</p>

            <label className="mt-4 block text-sm">
              <span className="text-xs font-semibold uppercase tracking-wide text-[var(--couples-muted)]">
                Date answered
              </span>
              <input
                type="date"
                className={`mt-1.5 ${couplesHubPremium.sheetInput}`}
                value={answeredDate}
                onChange={(e) => setAnsweredDate(e.target.value)}
              />
            </label>

            <label className="mt-4 block text-sm">
              <span className="text-xs font-semibold uppercase tracking-wide text-[var(--couples-muted)]">
                Testimony
              </span>
              <textarea
                rows={4}
                className={`mt-1.5 ${couplesHubPremium.sheetInput}`}
                value={testimony}
                onChange={(e) => setTestimony(e.target.value)}
                placeholder="How did God meet you?"
              />
            </label>

            <label className="mt-4 block text-sm">
              <span className="text-xs font-semibold uppercase tracking-wide text-[var(--couples-muted)]">
                Scripture of thanksgiving (optional)
              </span>
              <input
                className={`mt-1.5 ${couplesHubPremium.sheetInput}`}
                value={thanksgivingScripture}
                onChange={(e) => setThanksgivingScripture(e.target.value)}
              />
            </label>

            <label className="mt-4 block text-sm">
              <span className="text-xs font-semibold uppercase tracking-wide text-[var(--couples-muted)]">
                Photo (optional)
              </span>
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                className="mt-2 block w-full text-sm text-[var(--couples-muted)]"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) void uploadPhoto(file);
                }}
              />
              {photoPreview ? (
                <div className="relative mt-3 aspect-video overflow-hidden rounded-xl">
                  <Image src={photoPreview} alt="" fill className="object-cover" sizes="400px" />
                </div>
              ) : null}
            </label>

            <div className="mt-6 flex flex-col gap-2 sm:flex-row">
              <CouplesPrimaryButton className="flex-1" disabled={busy} onClick={() => void submitAnswered()}>
                Save & celebrate
              </CouplesPrimaryButton>
              <CouplesSecondaryButton className="flex-1" onClick={() => setAnsweredOpen(false)}>
                Cancel
              </CouplesSecondaryButton>
            </div>
            {status ? <p className={`mt-3 text-sm ${couplesHubPremium.sheetStatusError}`}>{status}</p> : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}
