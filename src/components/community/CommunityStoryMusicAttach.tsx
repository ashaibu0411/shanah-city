"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { CommunityStatusMusic } from "@/lib/member-types";
import { readJsonResponse } from "@/lib/read-json-response";
import { getYouTubeStoryBackgroundEmbedSrc } from "@/lib/worship-youtube-timestamp-utils";

type CommunityStoryMusicAttachProps = {
  music: CommunityStatusMusic;
  slideDurationMs: number;
  musicContinuesOnNextSlide: boolean;
  paused: boolean;
  soundOn: boolean;
  onToggleSound?: () => void;
};

type PlaybackPayload = {
  mode?: "audio" | "youtube";
  audioUrl?: string;
  youtubeVideoId?: string;
  startSeconds?: number | null;
  error?: string;
};

export function CommunityStoryMusicAttach({
  music,
  slideDurationMs,
  musicContinuesOnNextSlide,
  paused,
  soundOn,
  onToggleSound,
}: CommunityStoryMusicAttachProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const sessionTrackRef = useRef<string | null>(null);
  const [loadError, setLoadError] = useState("");
  const [playback, setPlayback] = useState<PlaybackPayload | null>(null);
  const [reloadToken, setReloadToken] = useState(0);

  const startSeconds =
    typeof playback?.startSeconds === "number" && playback.startSeconds >= 0
      ? Math.floor(playback.startSeconds)
      : null;

  const clipEndSeconds = useMemo(() => {
    if (musicContinuesOnNextSlide) return undefined;
    const start = startSeconds ?? 0;
    return start + Math.max(1, Math.ceil(slideDurationMs / 1000));
  }, [musicContinuesOnNextSlide, slideDurationMs, startSeconds]);

  const loadPlayback = useCallback(() => {
    setLoadError("");

    fetch(`/api/community/story-music/playback?trackId=${encodeURIComponent(music.trackId)}`, {
      cache: "no-store",
    })
      .then(async (response) => {
        const data = await readJsonResponse<PlaybackPayload>(response);
        if (!response.ok) {
          throw new Error(data.error ?? "Audio unavailable for this song.");
        }
        return data;
      })
      .then((data) => {
        if (data.mode === "audio" && data.audioUrl) {
          setPlayback(data);
          sessionTrackRef.current = music.trackId;
          return;
        }
        if (data.mode === "youtube" && (data.youtubeVideoId || music.youtubeVideoId)) {
          setPlayback({
            ...data,
            youtubeVideoId: data.youtubeVideoId ?? music.youtubeVideoId,
          });
          sessionTrackRef.current = music.trackId;
          return;
        }
        setLoadError("Audio unavailable for this song.");
      })
      .catch((error) => {
        setLoadError(error instanceof Error ? error.message : "Could not load story music.");
      });
  }, [music.trackId, music.youtubeVideoId]);

  useEffect(() => {
    loadPlayback();
  }, [loadPlayback, reloadToken]);

  useEffect(() => {
    return () => {
      sessionTrackRef.current = null;
    };
  }, [music.trackId]);

  const youtubeEmbedSrc = useMemo(() => {
    if (playback?.mode !== "youtube" || !playback.youtubeVideoId) return "";
    return getYouTubeStoryBackgroundEmbedSrc(
      playback.youtubeVideoId,
      { paused, soundOn },
      startSeconds ?? undefined,
      clipEndSeconds,
    );
  }, [clipEndSeconds, paused, playback?.mode, playback?.youtubeVideoId, soundOn, startSeconds]);

  const youtubeEmbedKey = `${music.trackId}-${reloadToken}`;

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || playback?.mode !== "audio" || !playback.audioUrl) return;

    const isContinuingTrack = sessionTrackRef.current === music.trackId && audio.src;
    if (!isContinuingTrack) {
      audio.src = playback.audioUrl;
      audio.loop = false;
      audio.load();
    }

    const applyStart = () => {
      if (startSeconds != null && startSeconds > 0 && !isContinuingTrack) {
        try {
          audio.currentTime = startSeconds;
        } catch {
          // ignore seek before metadata
        }
      }
    };

    const onError = () => setLoadError("Tap to retry sound");

    audio.addEventListener("loadedmetadata", applyStart, { once: true });
    audio.addEventListener("error", onError);

    if (!paused && soundOn) {
      void audio.play().catch(() => setLoadError("Tap to retry sound"));
    }

    let clipTimer: number | undefined;
    if (!musicContinuesOnNextSlide && slideDurationMs > 0) {
      clipTimer = window.setTimeout(() => {
        audio.pause();
      }, slideDurationMs);
    }

    return () => {
      audio.removeEventListener("loadedmetadata", applyStart);
      audio.removeEventListener("error", onError);
      if (clipTimer != null) window.clearTimeout(clipTimer);
    };
  }, [
    music.trackId,
    musicContinuesOnNextSlide,
    paused,
    playback,
    slideDurationMs,
    soundOn,
    startSeconds,
  ]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || playback?.mode !== "audio") return;
    audio.muted = !soundOn;
    if (paused || !soundOn) {
      audio.pause();
    } else if (playback.audioUrl) {
      void audio.play().catch(() => setLoadError("Tap to retry sound"));
    }
  }, [paused, playback, soundOn]);

  function handleStickerClick() {
    if (loadError) {
      sessionTrackRef.current = null;
      setReloadToken((value) => value + 1);
      return;
    }
    onToggleSound?.();
  }

  return (
    <>
      {playback?.mode === "audio" ? (
        <audio ref={audioRef} playsInline preload="auto" className="sr-only" aria-hidden tabIndex={-1} />
      ) : null}
      {playback?.mode === "youtube" && youtubeEmbedSrc ? (
        <iframe
          key={youtubeEmbedKey}
          title={`${music.title} by ${music.artist}`}
          src={youtubeEmbedSrc}
          className="pointer-events-none absolute left-0 top-0 h-px w-px opacity-0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          tabIndex={-1}
          aria-hidden
        />
      ) : null}
      <div className="pointer-events-none absolute inset-x-0 bottom-[4.75rem] z-20 flex justify-center px-4">
        <div className="pointer-events-auto max-w-full rounded-full bg-black/55 px-3 py-1.5 shadow-lg ring-1 ring-white/15 backdrop-blur-md">
          <button
            type="button"
            className="flex max-w-[min(100vw-3rem,20rem)] items-center gap-2 text-left"
            onClick={handleStickerClick}
            aria-label={loadError ? "Retry story music" : soundOn ? "Mute story music" : "Play story music"}
          >
            <span className="shrink-0 text-sm" aria-hidden>
              {soundOn && !loadError ? "🔊" : "🔇"}
            </span>
            <span className="min-w-0 truncate text-xs font-semibold text-white">
              {loadError
                ? `${music.title} · tap to retry sound`
                : `${music.title} · ${music.artist}`}
            </span>
          </button>
        </div>
      </div>
    </>
  );
}
