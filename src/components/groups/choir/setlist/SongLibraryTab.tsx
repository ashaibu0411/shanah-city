"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { WorshipLibrarySong } from "@/lib/worship-types";
import { librarySongResources } from "@/lib/choir-setlist-utils";
import { SetlistSongThumbnail } from "@/components/groups/choir/setlist/SetlistSongThumbnail";

type SongLibraryTabProps = {
  favoriteIds: string[];
  onToggleFavorite: (songId: string) => void;
  onOpenSong: (song: WorshipLibrarySong) => void;
};

const FILTERS = [
  { id: "all", label: "All songs" },
  { id: "recent", label: "Recently used" },
] as const;

type FilterId = (typeof FILTERS)[number]["id"] | string;

function HeartIcon({ filled }: { filled: boolean }) {
  return (
    <svg viewBox="0 0 20 20" className="h-5 w-5" aria-hidden>
      <path
        fill={filled ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth="1.5"
        d="M10 3.5c1.2-1.5 3.2-1.5 4.5 0 1.4 1.4 1.4 3.7 0 5.1L10 17l-4.5-8.4c-1.4-1.4-1.4-3.7 0-5.1 1.3-1.5 3.3-1.5 4.5 0Z"
      />
    </svg>
  );
}

export function SongLibraryTab({ favoriteIds, onToggleFavorite, onOpenSong }: SongLibraryTabProps) {
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [filter, setFilter] = useState<FilterId>("all");
  const [songs, setSongs] = useState<WorshipLibrarySong[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handle = window.setTimeout(() => setDebouncedQuery(query.trim()), 300);
    return () => window.clearTimeout(handle);
  }, [query]);

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    const params = debouncedQuery ? `?q=${encodeURIComponent(debouncedQuery)}` : "";
    fetch(`/api/worship/songs${params}`)
      .then((response) => response.json())
      .then((data) => {
        if (!data.songs) {
          setError(data.error ?? "Could not load library.");
          setSongs([]);
        } else {
          setSongs(data.songs);
        }
        setLoading(false);
      })
      .catch(() => {
        setError("Could not load library.");
        setLoading(false);
      });
  }, [debouncedQuery]);

  useEffect(() => {
    load();
  }, [load]);

  const tagFilters = useMemo(() => {
    const tags = new Set<string>();
    for (const song of songs) {
      for (const tag of song.tags ?? []) {
        if (tag.trim()) tags.add(tag.trim());
      }
    }
    return [...tags].sort((a, b) => a.localeCompare(b)).slice(0, 6);
  }, [songs]);

  const filtered = useMemo(() => {
    let rows = [...songs];
    if (filter === "recent") {
      rows = rows.sort((a, b) => (b.useCount ?? 0) - (a.useCount ?? 0));
    } else if (filter !== "all") {
      rows = rows.filter((song) => (song.tags ?? []).some((tag) => tag.toLowerCase() === filter.toLowerCase()));
    }
    return rows;
  }, [songs, filter]);

  return (
    <div className="space-y-4">
      <div>
        <h2 className="font-display text-lg font-bold text-[var(--choir-heading)]">Song library</h2>
        <p className="mt-1 text-sm text-[var(--choir-muted)]">
          Find songs, arrangements, and preparation resources.
        </p>
      </div>

      <input
        type="search"
        className="choir-setlist-search"
        placeholder="Search songs or artists"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        aria-label="Search songs or artists"
      />

      <div className="choir-setlist-filter-row">
        {FILTERS.map((entry) => (
          <button
            key={entry.id}
            type="button"
            className={`choir-setlist-filter ${filter === entry.id ? "choir-setlist-filter-active" : ""}`}
            onClick={() => setFilter(entry.id)}
          >
            {entry.label}
          </button>
        ))}
        {tagFilters.map((tag) => (
          <button
            key={tag}
            type="button"
            className={`choir-setlist-filter ${filter === tag ? "choir-setlist-filter-active" : ""}`}
            onClick={() => setFilter(tag)}
          >
            {tag}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-sm text-[var(--choir-muted)]">Loading songs…</p>
      ) : error ? (
        <div className="choir-card p-4">
          <p className="text-sm text-red-700">{error}</p>
          <button type="button" className="choir-setlist-manage-link mt-2" onClick={load}>
            Retry
          </button>
        </div>
      ) : filtered.length === 0 ? (
        <div className="choir-card p-5 text-center">
          <h3 className="font-semibold text-[var(--choir-heading)]">No songs found</h3>
          <p className="mt-2 text-sm text-[var(--choir-muted)]">Try another title or artist.</p>
        </div>
      ) : (
        <ul className="space-y-2">
          {filtered.map((song) => {
            const resources = librarySongResources(song);
            const favorited = favoriteIds.includes(song.id);
            const meta = [
              song.defaultKey?.trim() ? `Key: ${song.defaultKey.trim()}` : null,
              song.bpm ? `BPM ${song.bpm}` : null,
              song.useCount > 0 ? `Used in ${song.useCount} service${song.useCount === 1 ? "" : "s"}` : null,
            ].filter(Boolean);

            return (
              <li key={song.id} className="choir-setlist-song-row">
                <button type="button" className="choir-setlist-song-main" onClick={() => onOpenSong(song)}>
                  <SetlistSongThumbnail youtubeVideoId={song.youtubeVideoId} title={song.title} />
                  <div className="min-w-0 flex-1 text-left">
                    <p className="choir-setlist-song-title">{song.title}</p>
                    {song.artist?.trim() ? (
                      <p className="text-xs text-[var(--choir-muted)]">{song.artist.trim()}</p>
                    ) : null}
                    {meta.length > 0 ? (
                      <p className="choir-setlist-song-meta">{meta.join(" · ")}</p>
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
                    className={`choir-setlist-fav-btn ${favorited ? "is-active" : ""}`}
                    aria-label={favorited ? "Remove from favorites" : "Add to favorites"}
                    onClick={() => onToggleFavorite(song.id)}
                  >
                    <HeartIcon filled={favorited} />
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
