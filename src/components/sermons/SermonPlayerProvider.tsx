"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { backgroundCapableAudioEventHandlers } from "@/lib/native-background-playback";
import type { SermonVideo } from "@/lib/youtube-sermons-server";

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

function updateMediaSession(
  sermon: SermonVideo | null,
  handlers: { play?: () => void; pause?: () => void; stop?: () => void },
) {
  if (typeof navigator === "undefined" || !("mediaSession" in navigator)) return;
  if (!sermon) {
    navigator.mediaSession.metadata = null;
    navigator.mediaSession.playbackState = "none";
    return;
  }
  navigator.mediaSession.metadata = new MediaMetadata({
    title: sermon.title,
    artist: "Shanah City",
    album: "Messages",
    artwork: [{ src: sermon.thumbnailUrl, sizes: "512x512", type: "image/jpeg" }],
  });
  navigator.mediaSession.setActionHandler("play", handlers.play ?? null);
  navigator.mediaSession.setActionHandler("pause", handlers.pause ?? null);
  navigator.mediaSession.setActionHandler("stop", handlers.stop ?? null);
}

export function SermonPlayerProvider({ children }: { children: ReactNode }) {
  const [sermon, setSermon] = useState<SermonVideo | null>(null);
  const [playing, setPlaying] = useState(false);
  const [paused, setPaused] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const sermonRef = useRef<SermonVideo | null>(null);

  useEffect(() => {
    sermonRef.current = sermon;
  }, [sermon]);

  const stop = useCallback(() => {
    const audio = audioRef.current;
    if (audio) {
      audio.pause();
      audio.removeAttribute("src");
      audio.load();
    }
    setPlaying(false);
    setPaused(false);
    setLoading(false);
    setError(null);
    setSermon(null);
    if (typeof navigator !== "undefined" && "mediaSession" in navigator) {
      navigator.mediaSession.playbackState = "none";
      navigator.mediaSession.metadata = null;
    }
  }, []);

  const pause = useCallback(() => {
    audioRef.current?.pause();
    setPaused(true);
    if (typeof navigator !== "undefined" && "mediaSession" in navigator) {
      navigator.mediaSession.playbackState = "paused";
    }
  }, []);

  const resume = useCallback(() => {
    void audioRef.current?.play().catch(() => undefined);
    setPaused(false);
    if (typeof navigator !== "undefined" && "mediaSession" in navigator) {
      navigator.mediaSession.playbackState = "playing";
    }
  }, []);

  const playAudio = useCallback(
    async (next: SermonVideo) => {
      setError(null);
      if (sermonRef.current?.id !== next.id) {
        stop();
        setSermon(next);
      }
      setLoading(true);

      try {
        const response = await fetch(`/api/sermons/playback?v=${encodeURIComponent(next.id)}`);
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.error ?? "Could not start audio.");
        }
        if (data.mode !== "audio" || !data.audioUrl) {
          throw new Error("Audio-only playback is not available for this message. Use Watch instead.");
        }

        const audio = audioRef.current;
        if (!audio) throw new Error("Audio player unavailable.");

        audio.src = data.audioUrl;
        await audio.play();
        setPlaying(true);
        setPaused(false);
        updateMediaSession(next, { play: resume, pause, stop });
        if (typeof navigator !== "undefined" && "mediaSession" in navigator) {
          navigator.mediaSession.playbackState = "playing";
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Could not play audio.");
        setPlaying(false);
      } finally {
        setLoading(false);
      }
    },
    [pause, resume, stop],
  );

  const audioHandlers = useMemo(() => backgroundCapableAudioEventHandlers(), []);

  const value = useMemo(
    () => ({
      sermon,
      playing,
      paused,
      loading,
      error,
      isCurrent: (videoId: string) => sermon?.id === videoId && playing,
      playAudio,
      pause,
      resume,
      stop,
    }),
    [sermon, playing, paused, loading, error, playAudio, pause, resume, stop],
  );

  return (
    <SermonPlayerContext.Provider value={value}>
      <audio
        ref={audioRef}
        className="hidden"
        playsInline
        preload="none"
        onPlay={audioHandlers.onPlay}
        onPause={audioHandlers.onPause}
        onEnded={() => {
          audioHandlers.onEnded();
          stop();
        }}
      />
      {children}
    </SermonPlayerContext.Provider>
  );
}

export function useSermonPlayer() {
  const ctx = useContext(SermonPlayerContext);
  if (!ctx) {
    throw new Error("useSermonPlayer must be used within SermonPlayerProvider");
  }
  return ctx;
}
