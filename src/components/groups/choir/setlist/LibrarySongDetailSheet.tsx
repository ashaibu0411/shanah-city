"use client";

import { WorshipSongBreakdownLyrics } from "@/components/worship/WorshipSongBreakdownLyrics";
import { openExternalMediaUrl } from "@/lib/open-external-media";
import type { WorshipLibrarySong } from "@/lib/worship-types";
import { getYouTubeWatchUrlWithSegment } from "@/lib/worship-youtube-timestamp-utils";

type LibrarySongDetailSheetProps = {
  open: boolean;
  song: WorshipLibrarySong | null;
  onClose: () => void;
};

export function LibrarySongDetailSheet({ open, song, onClose }: LibrarySongDetailSheetProps) {
  if (!open || !song) return null;

  async function openAudio() {
    if (song?.youtubeVideoId) {
      await openExternalMediaUrl(getYouTubeWatchUrlWithSegment(song.youtubeVideoId));
    }
  }

  return (
    <div className="choir-setlist-sheet-backdrop" role="presentation" onClick={onClose}>
      <div
        className="choir-setlist-sheet"
        role="dialog"
        aria-labelledby="choir-library-song-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 id="choir-library-song-title" className="font-display text-xl font-bold text-[var(--choir-heading)]">
              {song.title}
            </h2>
            {song.artist?.trim() ? (
              <p className="mt-1 text-sm text-[var(--choir-muted)]">{song.artist.trim()}</p>
            ) : null}
          </div>
          <button type="button" className="choir-header-icon-btn !h-10 !w-10" onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>

        <dl className="mt-4 space-y-2 text-sm">
          {song.defaultKey?.trim() ? (
            <div className="flex gap-2">
              <dt className="font-semibold text-[var(--choir-heading)]">Default key</dt>
              <dd>{song.defaultKey.trim()}</dd>
            </div>
          ) : null}
          {song.bpm ? (
            <div className="flex gap-2">
              <dt className="font-semibold text-[var(--choir-heading)]">BPM</dt>
              <dd>{song.bpm}</dd>
            </div>
          ) : null}
          {song.notes?.trim() ? (
            <div>
              <dt className="font-semibold text-[var(--choir-heading)]">Notes</dt>
              <dd className="mt-1 rounded-xl bg-[var(--choir-surface-soft)] px-3 py-2">{song.notes.trim()}</dd>
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

        {song.youtubeVideoId ? (
          <button type="button" className="choir-btn-primary mt-4" onClick={openAudio}>
            Open reference audio
          </button>
        ) : null}

        <WorshipSongBreakdownLyrics title={song.title} lyrics={song.lyrics ?? undefined} />
      </div>
    </div>
  );
}
