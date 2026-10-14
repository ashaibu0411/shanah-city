"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useShanahMedia } from "@/components/media/ShanahMediaPlayerProvider";
import { resolveAbsoluteMediaUrl, sermonToShanahMediaItem } from "@/lib/shanah-media-helpers";
import type { SermonVideo } from "@/lib/youtube-sermons-shared";

type SermonPlayerContextValue = {
  sermon: SermonVideo | null;
  playing: boolean;
  paused: boolean;
  loading: boolean;
  error: string | null;
  isCurrent: (videoId: string) => boolean;
  playAudio: (sermon: SermonVideo) => Promise<void>;
  pause: () => void;
  resume: () => void;
  stop: () => void;
};

const SermonPlayerContext = createContext<SermonPlayerContextValue | null>(null);

export function SermonPlayerProvider({ children }: { children: ReactNode }) {
  const media = useShanahMedia();
  const [sermon, setSermon] = useState<SermonVideo | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const mediaSermonId =
    media.item?.kind === "sermon-audio" ? media.item.id.replace(/^sermon-/, "") : null;

  const playing = Boolean(sermon && mediaSermonId === sermon.id && media.playing);
  const paused = Boolean(sermon && mediaSermonId === sermon.id && media.paused);

  useEffect(() => {
    if (media.item?.kind !== "sermon-audio" && !loading && !error) {
      setSermon(null);
    }
  }, [media.item, loading, error]);

  useEffect(() => {
    if (media.error && mediaSermonId && sermon?.id === mediaSermonId) {
      setError(media.error);
    }
  }, [media.error, mediaSermonId, sermon?.id]);

  const pause = useCallback(() => {
    if (mediaSermonId) media.pause();
  }, [media, mediaSermonId]);

  const resume = useCallback(() => {
    if (mediaSermonId) media.resume();
  }, [media, mediaSermonId]);

  const stop = useCallback(() => {
    if (media.item?.kind === "sermon-audio") {
      media.stop();
    }
    setSermon(null);
    setError(null);
    setLoading(false);
  }, [media]);

  const playAudio = useCallback(
    async (next: SermonVideo) => {
      setError(null);
      setSermon(next);
      setLoading(true);
      try {
        const response = await fetch(`/api/sermons/playback?v=${encodeURIComponent(next.id)}`);
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.error ?? "Could not start audio.");
        }
        if (data.mode !== "audio" || !data.audioUrl) {
          throw new Error(
            "Listen isn’t set up for this message yet. Use Watch for video, or ask your team to publish an audio file for this sermon.",
          );
        }

        await media.play(
          sermonToShanahMediaItem(next, resolveAbsoluteMediaUrl(String(data.audioUrl))),
        );
      } catch (err) {
        setError(err instanceof Error ? err.message : "Could not play audio.");
      } finally {
        setLoading(false);
      }
    },
    [media],
  );

  const value = useMemo(
    () => ({
      sermon,
      playing,
      paused,
      loading: loading || (Boolean(sermon) && media.loading && mediaSermonId === sermon?.id),
      error,
      isCurrent: (videoId: string) =>
        (sermon?.id === videoId || mediaSermonId === videoId) &&
        (playing || paused || loading || media.loading),
      playAudio,
      pause,
      resume,
      stop,
    }),
    [sermon, playing, paused, loading, media.loading, mediaSermonId, error, playAudio, pause, resume, stop],
  );

  return <SermonPlayerContext.Provider value={value}>{children}</SermonPlayerContext.Provider>;
}

export function useSermonPlayer() {
  const ctx = useContext(SermonPlayerContext);
  if (!ctx) {
    throw new Error("useSermonPlayer must be used within SermonPlayerProvider");
  }
  return ctx;
}
