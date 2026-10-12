"use client";

import Link from "next/link";
import { WorshipSongBreakdownListen } from "@/components/worship/WorshipSongBreakdownListen";
import { WorshipSongBreakdownLyrics } from "@/components/worship/WorshipSongBreakdownLyrics";
import type { WorshipServicePlan, WorshipSong } from "@/lib/worship-types";
import { worshipPlannerPath } from "@/lib/worship-plan-links";
import { SHANAH_WORSHIP_GROUP_ID } from "@/lib/choir-group-constants";

type SongDetailSheetProps = {
  open: boolean;
  song: WorshipSong | null;
  serviceDate: string;
  serviceTime: string;
  serviceTitle: string;
  planStatus: WorshipServicePlan["status"];
  position?: number;
  userId?: string;
  canManage: boolean;
  onClose: () => void;
};

export function SongDetailSheet({
  open,
  song,
  serviceDate,
  serviceTime,
  serviceTitle,
  planStatus,
  position,
  userId,
  canManage,
  onClose,
}: SongDetailSheetProps) {
  if (!open || !song) return null;

  const rehearsalHref = `/groups/${SHANAH_WORSHIP_GROUP_ID}/rehearsal?date=${encodeURIComponent(serviceDate)}&time=${encodeURIComponent(serviceTime)}&song=${encodeURIComponent(song.id)}`;

  return (
    <div className="choir-setlist-sheet-backdrop" role="presentation" onClick={onClose}>
      <div
        className="choir-setlist-sheet"
        role="dialog"
        aria-labelledby="choir-song-detail-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            {position != null ? (
              <p className="text-xs font-semibold uppercase tracking-wide text-[var(--choir-muted)]">
                Song {position}
              </p>
            ) : null}
            <h2 id="choir-song-detail-title" className="font-display text-xl font-bold text-[var(--choir-heading)]">
              {song.title}
            </h2>
            <p className="mt-1 text-sm text-[var(--choir-muted)]">{serviceTitle}</p>
          </div>
          <button type="button" className="choir-header-icon-btn !h-10 !w-10" onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>

        <dl className="mt-4 space-y-2 text-sm">
          {song.key?.trim() ? (
            <div className="flex gap-2">
              <dt className="font-semibold text-[var(--choir-heading)]">Key</dt>
              <dd className="text-[var(--choir-body)]">{song.key.trim()}</dd>
            </div>
          ) : null}
          {song.bpm ? (
            <div className="flex gap-2">
              <dt className="font-semibold text-[var(--choir-heading)]">BPM</dt>
              <dd className="text-[var(--choir-body)]">{song.bpm}</dd>
            </div>
          ) : null}
          {song.notes?.trim() ? (
            <div>
              <dt className="font-semibold text-[var(--choir-heading)]">Arrangement</dt>
              <dd className="mt-1 rounded-xl bg-[var(--choir-surface-soft)] px-3 py-2 text-[var(--choir-body)]">
                {song.notes.trim()}
              </dd>
            </div>
          ) : null}
        </dl>

        {song.chartUrl ? (
          <a
            href={song.chartUrl}
            target="_blank"
            rel="noreferrer"
            className="mt-4 inline-flex text-sm font-semibold text-[var(--choir-gold-dark)] underline"
          >
            Open chord chart
          </a>
        ) : null}

        <div className="mt-4">
          <WorshipSongBreakdownListen
            song={song}
            userId={userId}
            isManager={canManage}
            planStatus={planStatus}
          />
        </div>
        <WorshipSongBreakdownLyrics title={song.title} lyrics={song.lyrics} />

        <Link href={rehearsalHref} className="choir-btn-primary mt-4 inline-flex w-full justify-center">
          Open rehearsal room
        </Link>

        {canManage ? (
          <Link
            href={worshipPlannerPath({ serviceDate, serviceTime }, song.id)}
            className="choir-btn-primary mt-5"
          >
            Manage in worship planner
          </Link>
        ) : null}
      </div>
    </div>
  );
}
