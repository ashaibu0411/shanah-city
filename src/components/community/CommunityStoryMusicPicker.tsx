"use client";

import { useEffect, useState } from "react";
import type { CommunityStoryMusicTrack } from "@/lib/community-story-music";

type CommunityStoryMusicPickerProps = {
  selectedTrackId: string | null;
  onSelect: (track: CommunityStoryMusicTrack | null) => void;
};

export function CommunityStoryMusicPicker({
  selectedTrackId,
  onSelect,
}: CommunityStoryMusicPickerProps) {
  const [expanded, setExpanded] = useState(false);
  const [query, setQuery] = useState("");
  const [tracks, setTracks] = useState<CommunityStoryMusicTrack[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!expanded && !selectedTrackId) return;

    let cancelled = false;
    const timer = window.setTimeout(() => {
      setLoading(true);
      fetch(`/api/community/story-music?q=${encodeURIComponent(query.trim())}`)
        .then((response) => response.json())
        .then((data) => {
          if (cancelled) return;
          setTracks((data.tracks ?? []) as CommunityStoryMusicTrack[]);
        })
        .catch(() => {
          if (!cancelled) setTracks([]);
        })
        .finally(() => {
          if (!cancelled) setLoading(false);
        });
    }, 200);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [query, expanded, selectedTrackId]);

  const selected = tracks.find((track) => track.id === selectedTrackId) ?? null;

  if (!expanded && !selectedTrackId) {
    return (
      <button
        type="button"
        className="mt-3 flex w-full items-center justify-between rounded-xl border border-clay-500/35 bg-clay-500/8 px-3 py-2.5 text-left"
        onClick={() => setExpanded(true)}
      >
        <span className="text-sm font-semibold text-night-900 dark:text-sand-100">♪ Add worship song</span>
        <span className="text-xs font-semibold text-clay-800 dark:text-clay-200">Optional</span>
      </button>
    );
  }

  return (
    <div className="mt-3 rounded-xl border border-night-900/10 bg-sand-50/80 p-3 dark:border-white/10 dark:bg-night-900/40">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-night-600 dark:text-sand-400">
          Worship song
        </p>
        {selectedTrackId ? (
          <button
            type="button"
            className="text-xs font-semibold text-night-700 underline dark:text-sand-200"
            onClick={() => {
              onSelect(null);
              setExpanded(false);
            }}
          >
            Remove
          </button>
        ) : (
          <button
            type="button"
            className="text-xs font-semibold text-night-500"
            onClick={() => setExpanded(false)}
          >
            Collapse
          </button>
        )}
      </div>
      {selected ? (
        <p className="mt-2 text-sm font-semibold text-night-900 dark:text-sand-100">
          ♪ {selected.title} · {selected.artist}
        </p>
      ) : (
        <>
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search worship favorites…"
            className="community-story-caption-input mt-2 w-full rounded-lg border border-night-900/12 bg-white px-3 py-2 text-sm dark:border-white/15 dark:bg-night-950"
          />
          <ul className="mt-2 max-h-28 space-y-1 overflow-y-auto">
            {loading ? (
              <li className="px-2 py-1 text-xs text-night-500">Loading songs…</li>
            ) : tracks.length === 0 ? (
              <li className="px-2 py-1 text-xs text-night-500">No matches — try another title or artist.</li>
            ) : (
              tracks.map((track) => (
                <li key={track.id}>
                  <button
                    type="button"
                    className="w-full rounded-lg px-2 py-1.5 text-left text-sm hover:bg-white/80 dark:hover:bg-night-800"
                    onClick={() => {
                      onSelect(track);
                      setExpanded(false);
                    }}
                  >
                    <span className="font-semibold text-night-900 dark:text-sand-100">{track.title}</span>
                    <span className="text-night-600 dark:text-sand-400"> · {track.artist}</span>
                  </button>
                </li>
              ))
            )}
          </ul>
        </>
      )}
    </div>
  );
}
