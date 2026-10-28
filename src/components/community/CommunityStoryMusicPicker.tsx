"use client";

import { useEffect, useState } from "react";
import {
  COMMUNITY_STORY_MUSIC_REGIONS,
  type CommunityStoryMusicRegion,
  type CommunityStoryMusicTrack,
} from "@/lib/community-story-music";
import {
  STORY_MUSIC_DISCOVERY_COUNTRIES,
  STORY_MUSIC_DISCOVERY_GENRES,
  STORY_MUSIC_DISCOVERY_LANGUAGES,
} from "@/lib/story-music/search";
import { StoryMusicPreviewPlayer } from "@/components/community/StoryMusicPreviewPlayer";
import { StoryMusicTrackArtwork } from "@/components/community/StoryMusicTrackArtwork";

type CommunityStoryMusicPickerProps = {
  selectedTrackId: string | null;
  onSelect: (track: CommunityStoryMusicTrack | null) => void;
};

type SearchResponse = {
  hybrid?: boolean;
  attachableOnly?: boolean;
  tracks: CommunityStoryMusicTrack[];
};

export function CommunityStoryMusicPicker({
  selectedTrackId,
  onSelect,
}: CommunityStoryMusicPickerProps) {
  const [expanded, setExpanded] = useState(false);
  const [query, setQuery] = useState("");
  const [tracks, setTracks] = useState<CommunityStoryMusicTrack[]>([]);
  const [loading, setLoading] = useState(false);
  const [hybrid, setHybrid] = useState(false);
  const [region, setRegion] = useState<CommunityStoryMusicRegion | "all">("all");
  const [country, setCountry] = useState("all");
  const [language, setLanguage] = useState("all");
  const [genre, setGenre] = useState("all");

  useEffect(() => {
    if (!expanded && !selectedTrackId) return;

    let cancelled = false;
    const timer = window.setTimeout(() => {
      setLoading(true);
      const params = new URLSearchParams({
        q: query.trim(),
        region,
        country,
        language,
        genre,
      });
      fetch(`/api/community/story-music?${params.toString()}`)
        .then((response) => response.json())
        .then((data: SearchResponse) => {
          if (cancelled) return;
          setHybrid(Boolean(data.hybrid));
          setTracks(data.tracks ?? []);
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
  }, [query, expanded, selectedTrackId, region, country, language, genre]);

  const selected = tracks.find((track) => track.id === selectedTrackId) ?? null;

  if (!expanded && !selectedTrackId) {
    return (
      <button
        type="button"
        className="mt-3 flex w-full items-center justify-between rounded-xl border border-clay-500/35 bg-clay-500/8 px-3 py-2.5 text-left"
        onClick={() => setExpanded(true)}
      >
        <span className="text-sm font-semibold text-night-900 dark:text-sand-100">♪ Add song (plays in story)</span>
        <span className="text-xs font-semibold text-clay-800 dark:text-clay-200">Optional</span>
      </button>
    );
  }

  return (
    <div className="mt-3 rounded-xl border border-night-900/10 bg-sand-50/80 p-3 dark:border-white/10 dark:bg-night-900/40">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-night-600 dark:text-sand-400">
          Background music
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

      {hybrid ? (
        <p className="mt-1 text-[11px] text-night-600 dark:text-sand-400">
          Preview before attaching. Only songs with confirmed playable audio can be selected.
        </p>
      ) : null}

      {selected ? (
        <div className="mt-2 space-y-2 rounded-lg border border-clay-500/25 bg-white/70 p-2.5 dark:border-clay-400/20 dark:bg-night-950/50">
          <div className="flex items-center gap-3">
            <StoryMusicTrackArtwork
              trackId={selected.id}
              title={selected.title}
              artist={selected.artist}
              size="md"
            />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-night-900 dark:text-sand-100">{selected.title}</p>
              <p className="truncate text-xs text-night-600 dark:text-sand-400">{selected.artist}</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <StoryMusicPreviewPlayer trackId={selected.id} label="Preview" />
            <button
              type="button"
              className="text-[11px] font-semibold text-clay-800 underline dark:text-clay-200"
              onClick={() => {
                onSelect(null);
                setExpanded(true);
              }}
            >
              Change song
            </button>
          </div>
        </div>
      ) : (
        <>
          {hybrid ? (
            <>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {STORY_MUSIC_DISCOVERY_COUNTRIES.map((entry) => (
                  <button
                    key={entry.code}
                    type="button"
                    className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                      country === entry.code
                        ? "bg-clay-600 text-white"
                        : "bg-white text-night-700 ring-1 ring-night-900/10 dark:bg-night-800 dark:text-sand-200 dark:ring-white/10"
                    }`}
                    onClick={() => setCountry(entry.code)}
                  >
                    {entry.label}
                  </button>
                ))}
              </div>
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                {STORY_MUSIC_DISCOVERY_LANGUAGES.map((entry) => (
                  <button
                    key={entry.code}
                    type="button"
                    className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                      language === entry.code
                        ? "bg-night-800 text-white dark:bg-sand-200 dark:text-night-900"
                        : "bg-white text-night-700 ring-1 ring-night-900/10 dark:bg-night-800 dark:text-sand-200 dark:ring-white/10"
                    }`}
                    onClick={() => setLanguage(entry.code)}
                  >
                    {entry.label}
                  </button>
                ))}
              </div>
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                {STORY_MUSIC_DISCOVERY_GENRES.map((entry) => (
                  <button
                    key={entry.id}
                    type="button"
                    className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                      genre === entry.id
                        ? "bg-emerald-700 text-white"
                        : "bg-white text-night-700 ring-1 ring-night-900/10 dark:bg-night-800 dark:text-sand-200 dark:ring-white/10"
                    }`}
                    onClick={() => setGenre(entry.id)}
                  >
                    {entry.label}
                  </button>
                ))}
              </div>
            </>
          ) : (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {COMMUNITY_STORY_MUSIC_REGIONS.map((entry) => (
                <button
                  key={entry.id}
                  type="button"
                  className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                    region === entry.id
                      ? "bg-clay-600 text-white"
                      : "bg-white text-night-700 ring-1 ring-night-900/10 dark:bg-night-800 dark:text-sand-200 dark:ring-white/10"
                  }`}
                  onClick={() => setRegion(entry.id)}
                >
                  {entry.label}
                </button>
              ))}
            </div>
          )}

          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search artist, song, country, language…"
            className="community-story-caption-input mt-2 w-full rounded-lg border border-night-900/12 bg-white px-3 py-2 text-sm dark:border-white/15 dark:bg-night-950"
          />
          <ul className="mt-2 max-h-44 space-y-1 overflow-y-auto">
            {loading ? (
              <li className="px-2 py-1 text-xs text-night-500">Loading songs…</li>
            ) : tracks.length === 0 ? (
              <li className="px-2 py-1 text-xs text-night-500">
                {hybrid
                  ? "No authorized songs are available yet — worship staff will add licensed recordings soon."
                  : "No matches — try another title or artist."}
              </li>
            ) : (
              tracks.map((track) => (
                <li key={track.id} className="rounded-lg px-2 py-1.5 hover:bg-white/80 dark:hover:bg-night-800">
                  <div className="flex items-center gap-2">
                    <StoryMusicTrackArtwork
                      trackId={track.id}
                      title={track.title}
                      artist={track.artist}
                    />
                    <button
                      type="button"
                      className="min-w-0 flex-1 text-left text-sm"
                      onClick={() => {
                        onSelect(track);
                        setExpanded(false);
                      }}
                    >
                      <span className="font-semibold text-night-900 dark:text-sand-100">{track.title}</span>
                      <span className="text-night-600 dark:text-sand-400"> · {track.artist}</span>
                      {track.country ? (
                        <span className="mt-0.5 block text-[10px] uppercase tracking-wide text-night-500">
                          {track.country}
                          {track.language ? ` · ${track.language}` : ""}
                        </span>
                      ) : null}
                    </button>
                    <StoryMusicPreviewPlayer trackId={track.id} />
                  </div>
                </li>
              ))
            )}
          </ul>
        </>
      )}
    </div>
  );
}
