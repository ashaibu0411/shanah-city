"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { CommunityStatusMusic } from "@/lib/member-types";
import { isNativeAppPlatform } from "@/lib/native-app";
import { readJsonResponse } from "@/lib/read-json-response";
import { getYouTubeStoryBackgroundEmbedSrc } from "@/lib/worship-youtube-timestamp-utils";
import type { StoryMusicPlaybackApiResponse } from "@/lib/story-music/playback-response";
import { storyMusicHybridClientEnabled } from "@/lib/story-music/story-music-config";

type CommunityStoryMusicAttachProps = {
  slideId: string;
  music: CommunityStatusMusic;
  slideDurationMs: number;
  musicContinuesOnNextSlide: boolean;
  paused: boolean;
  soundOn: boolean;
  onToggleSound?: () => void;
};

type PlaybackPayload = StoryMusicPlaybackApiResponse;

type PlaybackEngine = "audio" | "youtube" | "unavailable";

async function audioStreamReachable(audioUrl: string) {
  try {
    const response = await fetch(audioUrl, {
      method: "GET",
      headers: { Range: "bytes=0-2047" },
      cache: "no-store",
    });
    return response.ok || response.status === 206;
  } catch {
    return false;
  }
}

export function CommunityStoryMusicAttach({
  slideId,
  music,
  slideDurationMs,
  musicContinuesOnNextSlide,
  paused,
  soundOn,
  onToggleSound,
}: CommunityStoryMusicAttachProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [loadError, setLoadError] = useState("");
  const [playback, setPlayback] = useState<PlaybackPayload | null>(null);
  const [engine, setEngine] = useState<PlaybackEngine | null>(null);
  const [reloadToken, setReloadToken] = useState(0);
  const [youtubeUnmuted, setYoutubeUnmuted] = useState(false);

  const youtubeVideoId =
    playback?.youtubeVideoId?.trim() || music.youtubeVideoId?.trim() || "";

  const startSeconds =
    typeof playback?.startSeconds === "number" && playback.startSeconds >= 0
      ? Math.floor(playback.startSeconds)
      : null;

  const clipEndSeconds = useMemo(() => {
    if (musicContinuesOnNextSlide) return undefined;
    const start = startSeconds ?? 0;
    return start + Math.max(1, Math.ceil(slideDurationMs / 1000));
  }, [musicContinuesOnNextSlide, slideDurationMs, startSeconds]);

  const applyYoutubeFallback = useCallback(
    (payload?: Partial<PlaybackPayload>) => {
      const videoId = payload?.youtubeVideoId?.trim() || music.youtubeVideoId?.trim();
      if (!videoId) {
        setLoadError("Audio unavailable for this song.");
        return;
      }
      setEngine("youtube");
      setPlayback((current) => ({
        mode: "youtube",
        youtubeVideoId: videoId,
        startSeconds: payload?.startSeconds ?? current?.startSeconds ?? null,
        audioUrl: undefined,
      }));
      setLoadError("");
    },
    [music.youtubeVideoId],
  );

  const loadPlayback = useCallback(async () => {
    setLoadError("");
    setEngine(null);

    try {
      const response = await fetch(
        `/api/community/story-music/playback?trackId=${encodeURIComponent(music.trackId)}`,
        { cache: "no-store" },
      );
      const data = await readJsonResponse<PlaybackPayload>(response);
      const hybrid = Boolean(data.hybrid);

      if (!response.ok) {
        if (!hybrid && music.youtubeVideoId?.trim()) {
          applyYoutubeFallback({ youtubeVideoId: music.youtubeVideoId });
          return;
        }
        throw new Error(data.error ?? "Audio unavailable for this song.");
      }

      if (data.mode === "unavailable" || data.playability === "unavailable") {
        setPlayback(data);
        setEngine("unavailable");
        setLoadError(data.unavailableReason ?? "Music unavailable for this story.");
        return;
      }

      if (data.mode === "audio" && data.audioUrl && data.youtubeVideoId && !hybrid) {
        const streamOk = await audioStreamReachable(data.audioUrl);
        if (streamOk) {
          setPlayback(data);
          setEngine("audio");
          return;
        }
        applyYoutubeFallback(data);
        return;
      }

      if (data.mode === "audio" && data.audioUrl) {
        setPlayback(data);
        setEngine("audio");
        return;
      }

      if (!hybrid && data.mode === "youtube" && (data.youtubeVideoId || music.youtubeVideoId)) {
        setPlayback({
          ...data,
          youtubeVideoId: data.youtubeVideoId ?? music.youtubeVideoId,
        });
        setEngine("youtube");
        return;
      }

      if (!hybrid && music.youtubeVideoId?.trim()) {
        applyYoutubeFallback({ youtubeVideoId: music.youtubeVideoId });
        return;
      }

      setEngine("unavailable");
      setLoadError(data.unavailableReason ?? "Audio unavailable for this song.");
    } catch (error) {
      if (!storyMusicHybridClientEnabled() && music.youtubeVideoId?.trim()) {
        applyYoutubeFallback({ youtubeVideoId: music.youtubeVideoId });
        return;
      }
      setLoadError(error instanceof Error ? error.message : "Could not load story music.");
    }
  }, [applyYoutubeFallback, music.trackId, music.youtubeVideoId]);

  useEffect(() => {
    setPlayback(null);
    setEngine(null);
    setLoadError("");
    setYoutubeUnmuted(false);
    void loadPlayback();
  }, [loadPlayback, music.trackId, slideId, reloadToken]);

  const unmuteDelayMs = isNativeAppPlatform() ? 650 : 300;

  useEffect(() => {
    if (!soundOn || paused || engine !== "youtube") {
      setYoutubeUnmuted(false);
      return;
    }
    setYoutubeUnmuted(false);
    const timer = window.setTimeout(() => setYoutubeUnmuted(true), unmuteDelayMs);
    return () => window.clearTimeout(timer);
  }, [engine, slideId, music.trackId, paused, soundOn, unmuteDelayMs]);

  const embedOrigin = useMemo(
    () => (typeof window !== "undefined" ? window.location.origin : undefined),
    [],
  );

  const youtubeEmbedSrc = useMemo(() => {
    if (engine !== "youtube" || !youtubeVideoId) return "";
    return getYouTubeStoryBackgroundEmbedSrc(
      youtubeVideoId,
      {
        paused,
        soundOn,
        preferMutedAutoplay: soundOn && !youtubeUnmuted,
      },
      startSeconds ?? undefined,
      clipEndSeconds,
      embedOrigin,
    );
  }, [
    clipEndSeconds,
    embedOrigin,
    engine,
    paused,
    soundOn,
    startSeconds,
    youtubeUnmuted,
    youtubeVideoId,
  ]);

  const youtubeEmbedKey = `${slideId}-${music.trackId}-${youtubeUnmuted ? "on" : "muted"}-${reloadToken}`;

  const handleAudioFailure = useCallback(() => {
    if (playback?.hybrid) {
      setEngine("unavailable");
      setLoadError("Tap to retry sound");
      return;
    }
    if (engine === "audio" && music.youtubeVideoId?.trim()) {
      applyYoutubeFallback();
      return;
    }
    setLoadError("Tap to retry sound");
  }, [applyYoutubeFallback, engine, music.youtubeVideoId, playback?.hybrid]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || engine !== "audio" || !playback?.audioUrl) return;

    audio.src = playback.audioUrl;
    audio.loop = false;
    audio.load();

    const applyStart = () => {
      if (startSeconds != null && startSeconds > 0) {
        try {
          audio.currentTime = startSeconds;
        } catch {
          // ignore seek before metadata
        }
      }
    };

    const onError = () => handleAudioFailure();

    audio.addEventListener("loadedmetadata", applyStart, { once: true });
    audio.addEventListener("error", onError);

    if (!paused && soundOn) {
      void audio.play().catch(() => handleAudioFailure());
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
      audio.pause();
    };
  }, [
    engine,
    handleAudioFailure,
    music.trackId,
    musicContinuesOnNextSlide,
    paused,
    playback?.audioUrl,
    slideDurationMs,
    slideId,
    soundOn,
    startSeconds,
  ]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || engine !== "audio") return;
    audio.muted = !soundOn;
    if (paused || !soundOn) {
      audio.pause();
    } else if (playback?.audioUrl) {
      void audio.play().catch(() => handleAudioFailure());
    }
  }, [engine, handleAudioFailure, paused, playback?.audioUrl, soundOn]);

  useEffect(() => {
    const onVisibility = () => {
      if (document.hidden) {
        audioRef.current?.pause();
      }
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, []);

  useEffect(
    () => () => {
      const audio = audioRef.current;
      if (!audio) return;
      audio.pause();
      audio.removeAttribute("src");
      audio.load();
    },
    [],
  );

  function handleStickerClick() {
    if (loadError) {
      setReloadToken((value) => value + 1);
      return;
    }
    onToggleSound?.();
  }

  if (!music.trackId?.trim()) return null;

  return (
    <>
      {engine === "audio" ? (
        <audio ref={audioRef} playsInline preload="auto" className="sr-only" aria-hidden tabIndex={-1} />
      ) : null}
      {engine === "youtube" && youtubeEmbedSrc ? (
        <iframe
          key={youtubeEmbedKey}
          title={`${music.title} by ${music.artist}`}
          src={youtubeEmbedSrc}
          className="pointer-events-none fixed left-0 top-0 h-[200px] w-[320px] -translate-x-[120%] opacity-[0.01]"
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
            aria-label={
              loadError || engine === "unavailable"
                ? "Retry story music"
                : soundOn
                  ? "Mute story music"
                  : "Play story music"
            }
          >
            <span className="shrink-0 text-sm" aria-hidden>
              {soundOn && !loadError && engine !== "unavailable" ? "🔊" : "🔇"}
            </span>
            <span className="min-w-0 truncate text-xs font-semibold text-white">
              {loadError || engine === "unavailable"
                ? `${music.title} · tap to retry sound`
                : `${music.title} · ${music.artist}`}
            </span>
          </button>
        </div>
      </div>
    </>
  );
}
