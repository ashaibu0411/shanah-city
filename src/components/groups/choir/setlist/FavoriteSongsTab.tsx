"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { WorshipLibrarySong } from "@/lib/worship-types";
import { librarySongResources } from "@/lib/choir-setlist-utils";
import { SetlistSongThumbnail } from "@/components/groups/choir/setlist/SetlistSongThumbnail";

type FavoriteSongsTabProps = {
  favoriteIds: string[];
  onToggleFavorite: (songId: string) => void;
  onOpenSong: (song: WorshipLibrarySong) => void;
};

export function FavoriteSongsTab({ favoriteIds, onToggleFavorite, onOpenSong }: FavoriteSongsTabProps) {
  const [catalog, setCatalog] = useState<WorshipLibrarySong[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    setLoading(true);
    fetch("/api/worship/songs")
      .then((response) => response.json())
      .then((data) => {
        setCatalog(data.songs ?? []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const favorites = useMemo(
    () => catalog.filter((song) => favoriteIds.includes(song.id)),
    [catalog, favoriteIds],
  );

  if (loading) {
    return <p className="text-sm text-[var(--choir-muted)]">Loading favorites…</p>;
  }

  if (favoriteIds.length === 0 || favorites.length === 0) {
    return (
      <div className="choir-card p-5 text-center">
        <h2 className="font-display text-lg font-bold text-[var(--choir-heading)]">No favorite songs yet</h2>
        <p className="mt-2 text-sm text-[var(--choir-muted)]">
          Save songs from the library to keep your practice resources close.
        </p>
      </div>
    );
  }

  return (
    <ul className="space-y-2">
      {favorites.map((song) => {
        const resources = librarySongResources(song);
        return (
          <li key={song.id} className="choir-setlist-song-row">
            <button type="button" className="choir-setlist-song-main" onClick={() => onOpenSong(song)}>
              <SetlistSongThumbnail youtubeVideoId={song.youtubeVideoId} title={song.title} />
              <div className="min-w-0 flex-1 text-left">
                <p className="choir-setlist-song-title">{song.title}</p>
                {song.artist?.trim() ? (
                  <p className="text-xs text-[var(--choir-muted)]">{song.artist.trim()}</p>
                ) : null}
                {song.defaultKey?.trim() ? (
                  <p className="choir-setlist-song-meta">Key: {song.defaultKey.trim()}</p>
                ) : null}
              </div>
            </button>
            <div className="flex items-center justify-between gap-2 px-3 pb-3">
              <div className="choir-setlist-resource-row !px-0 !pb-0">
                {resources.hasLyrics ? <span className="choir-setlist-chip-static">Lyrics</span> : null}
                {resources.hasChords ? <span className="choir-setlist-chip-static">Chords</span> : null}
                {resources.hasAudio ? <span className="choir-setlist-chip-static">Audio</span> : null}
              </div>
              <button
                type="button"
                className="choir-setlist-manage-link !mt-0"
                onClick={() => onToggleFavorite(song.id)}
              >
                Remove
              </button>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
