"use client";

import type { WorshipSong } from "@/lib/worship-types";
import { setlistSongResources } from "@/lib/choir-setlist-utils";
import { SetlistSongThumbnail } from "@/components/groups/choir/setlist/SetlistSongThumbnail";

type SetlistSongRowProps = {
  position: number;
  song: WorshipSong;
  onOpen: () => void;
  onLyrics?: () => void;
  onChords?: () => void;
  onAudio?: () => void;
};

export function SetlistSongRow({
  position,
  song,
  onOpen,
  onLyrics,
  onChords,
  onAudio,
}: SetlistSongRowProps) {
  const resources = setlistSongResources(song);
  const metaParts: string[] = [];
  if (song.key?.trim()) metaParts.push(`Key: ${song.key.trim()}`);
  if (song.bpm) metaParts.push(`BPM: ${song.bpm}`);

  return (
    <article className="choir-setlist-song-row">
      <div className="flex items-start gap-1">
        <button type="button" className="choir-setlist-song-main min-w-0 flex-1" onClick={onOpen}>
          <span className="choir-setlist-song-num">{position}</span>
          <SetlistSongThumbnail youtubeVideoId={song.youtubeVideoId} title={song.title} />
          <div className="min-w-0 flex-1 text-left">
            <p className="choir-setlist-song-title">{song.title}</p>
            {metaParts.length > 0 ? (
              <p className="choir-setlist-song-meta">{metaParts.join(" | ")}</p>
            ) : null}
          </div>
        </button>
        <button
          type="button"
          className="choir-setlist-row-menu"
          aria-label={`More for ${song.title}`}
          onClick={onOpen}
        >
          ⋯
        </button>
      </div>
      {(resources.hasLyrics || resources.hasChords || resources.hasAudio) && (
        <div className="choir-setlist-resource-row">
          {resources.hasLyrics ? (
            <button type="button" className="choir-setlist-chip" onClick={onLyrics}>
              <span aria-hidden>♫</span> Lyrics
            </button>
          ) : null}
          {resources.hasChords ? (
            <button type="button" className="choir-setlist-chip" onClick={onChords}>
              <span aria-hidden>📄</span> Chords
            </button>
          ) : null}
          {resources.hasAudio ? (
            <button type="button" className="choir-setlist-chip" onClick={onAudio}>
              <span aria-hidden>▶</span> Audio
            </button>
          ) : null}
        </div>
      )}
    </article>
  );
}
