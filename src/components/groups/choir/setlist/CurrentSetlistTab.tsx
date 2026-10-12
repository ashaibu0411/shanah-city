"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import type { ChoirSetlistServiceSummary } from "@/lib/choir-setlist-types";
import { CHOIR_HERO_IMAGE_PATH } from "@/lib/choir-group-constants";
import { site } from "@/lib/site";
import { normalizeSongs, type WorshipServicePlan } from "@/lib/worship-types";
import { worshipPlannerPath } from "@/lib/worship-plan-links";
import { SetlistSongRow } from "@/components/groups/choir/setlist/SetlistSongRow";
import type { WorshipSong } from "@/lib/worship-types";

type CurrentSetlistTabProps = {
  services: ChoirSetlistServiceSummary[];
  selectedKey: string | null;
  onSelectService: (planKey: string) => void;
  plan: WorshipServicePlan | null;
  planLoading: boolean;
  canManage: boolean;
  onOpenSong: (song: WorshipSong, position: number) => void;
  onLyrics: (song: WorshipSong) => void;
  onChords: (song: WorshipSong) => void;
  onAudio: (song: WorshipSong) => void;
};

function DocumentIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6" aria-hidden>
      <path
        fill="currentColor"
        d="M8 2a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V8.414a2 2 0 0 0-.586-1.414l-4.414-4.414A2 2 0 0 0 11.586 2H8Zm2 12a1 1 0 1 0 0 2h4a1 1 0 1 0 0-2h-4Zm0-4a1 1 0 0 0 0 2h4a1 1 0 0 0 0-2h-4Z"
      />
    </svg>
  );
}

function PinIcon() {
  return (
    <svg viewBox="0 0 20 20" className="h-4 w-4 shrink-0" aria-hidden>
      <path
        fill="currentColor"
        d="M10 2.5a4.5 4.5 0 0 0-4.5 4.5c0 2.4 1.9 4.4 4.3 4.5v4.5a.75.75 0 0 0 1.5 0V11.5c2.4-.1 4.3-2.1 4.3-4.5A4.5 4.5 0 0 0 10 2.5Z"
      />
    </svg>
  );
}

function parseNoteBullets(notes: string) {
  return notes
    .split(/\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => line.replace(/^[-•*]\s*/, ""));
}

export function CurrentSetlistTab({
  services,
  selectedKey,
  onSelectService,
  plan,
  planLoading,
  canManage,
  onOpenSong,
  onLyrics,
  onChords,
  onAudio,
}: CurrentSetlistTabProps) {
  const [notesOpen, setNotesOpen] = useState(true);
  const songs = useMemo(() => (plan ? normalizeSongs(plan.songs) : []), [plan]);
  const selectedSummary = services.find((entry) => entry.planKey === selectedKey) ?? services[0] ?? null;

  if (services.length === 0) {
    return (
      <div className="choir-card p-5 text-center">
        <h2 className="font-display text-xl font-bold text-[var(--choir-heading)]">No setlist published yet</h2>
        <p className="mt-2 text-sm text-[var(--choir-muted)]">
          The worship team will share the next service songs here.
        </p>
      </div>
    );
  }

  const title = selectedSummary?.title ?? "Sunday Service";
  const dateLabel = selectedSummary?.dateTimeLabel ?? "";
  const songCount = selectedSummary?.songCount ?? songs.length;
  const isPublished = plan?.status === "published";
  const noteBullets = plan?.rehearsalNotes?.trim() ? parseNoteBullets(plan.rehearsalNotes.trim()) : [];

  return (
    <div className="space-y-4">
      {services.length > 1 ? (
        <label className="block">
          <span className="sr-only">Select service</span>
          <select
            className="choir-setlist-service-select"
            value={selectedKey ?? services[0].planKey}
            onChange={(event) => onSelectService(event.target.value)}
          >
            {services.map((service) => (
              <option key={service.planKey} value={service.planKey}>
                {service.title} — {service.dateTimeLabel}
                {service.status === "draft" && canManage ? " (draft)" : ""}
              </option>
            ))}
          </select>
        </label>
      ) : null}

      <div className="choir-setlist-hero choir-page-bleed">
        <Image src={CHOIR_HERO_IMAGE_PATH} alt="" fill className="object-cover object-center" sizes="100vw" priority />
        <div className="choir-setlist-hero-overlay" />
        {isPublished ? (
          <span className="choir-setlist-published-badge">
            <span aria-hidden>✓</span> Published
          </span>
        ) : null}
        <div className="choir-setlist-hero-copy">
          <p className="choir-setlist-hero-kicker">
            {isPublished ? "Published setlist" : canManage ? "Service plan" : "Setlist"}
          </p>
          <h2 className="choir-setlist-hero-title font-display">{title}</h2>
          <p className="choir-setlist-hero-datetime">{dateLabel}</p>
          <p className="choir-setlist-hero-meta">
            {songCount} song{songCount === 1 ? "" : "s"} · Key info · Arrangements &amp; audio
          </p>
          <p className="choir-setlist-hero-location">
            <PinIcon />
            <span>{site.heroChurchName}</span>
          </p>
        </div>
      </div>

      {canManage && plan ? (
        <Link href={worshipPlannerPath(plan)} className="choir-setlist-manage-link">
          Manage setlist →
        </Link>
      ) : null}

      {planLoading ? (
        <p className="text-sm text-[var(--choir-muted)]">Loading setlist…</p>
      ) : !plan || (plan.status !== "published" && !canManage) ? (
        <div className="choir-card p-4">
          <p className="text-sm text-[var(--choir-muted)]">
            {plan?.status === "draft"
              ? "This service plan is still a draft."
              : "No published setlist for this service yet."}
          </p>
        </div>
      ) : songs.length === 0 ? (
        <div className="choir-card p-4">
          <p className="text-sm text-[var(--choir-muted)]">No songs on this setlist yet.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {songs.map((song, index) => (
            <SetlistSongRow
              key={song.id}
              position={index + 1}
              song={song}
              onOpen={() => onOpenSong(song, index + 1)}
              onLyrics={() => onLyrics(song)}
              onChords={() => onChords(song)}
              onAudio={() => onAudio(song)}
            />
          ))}
        </div>
      )}

      <section className="choir-setlist-notes-card">
        <button
          type="button"
          className="flex w-full items-start gap-3 text-left"
          onClick={() => setNotesOpen((value) => !value)}
          aria-expanded={notesOpen}
        >
          <span className="choir-setlist-notes-icon text-[var(--choir-gold-dark)]">
            <DocumentIcon />
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-2">
              <h3 className="font-display text-lg font-bold text-[var(--choir-heading)]">Service notes</h3>
              <span className={`text-[var(--choir-muted)] transition ${notesOpen ? "rotate-90" : ""}`} aria-hidden>
                ›
              </span>
            </div>
            <p className="text-sm text-[var(--choir-muted)]">Flow, transitions, and special notes for the team.</p>
          </div>
        </button>
        {notesOpen ? (
          noteBullets.length > 0 ? (
            <ul className="choir-setlist-notes-list mt-3">
              {noteBullets.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
          ) : (
            <p className="mt-3 text-sm text-[var(--choir-muted)]">No service notes yet.</p>
          )
        ) : null}
      </section>
    </div>
  );
}
