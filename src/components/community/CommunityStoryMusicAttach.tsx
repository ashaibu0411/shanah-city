"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { CommunityStatusMusic } from "@/lib/member-types";
import { readJsonResponse } from "@/lib/read-json-response";
import { getYouTubeWatchUrlWithSegment } from "@/lib/worship-youtube-timestamp-utils";
import type { StoryMusicPlaybackApiResponse } from "@/lib/story-music/playback-response";
import { storyMusicHybridClientEnabled } from "@/lib/story-music/story-music-config";
import { CommunityStoryYoutubeVideoViewer } from "@/components/community/CommunityStoryYoutubeVideoViewer";
import { openExternalUrl } from "@/lib/native-app";

type CommunityStoryMusicAttachProps = {
  slideId: string;
  music: CommunityStatusMusic;
  slideDurationMs: number;
  musicContinuesOnNextSlide: boolean;
  paused: boolean;
  soundOn: boolean;
  onToggleSound?: () => void;
  onNativeAudioAvailable?: (available: boolean) => void;
  storyPhotoUrl?: string | null;
  onYoutubeViewerActiveChange?: (active: boolean) => void;
};

type PlaybackPayload = StoryMusicPlaybackApiResponse;

type PlaybackEngine = "audio" | "youtube" | "unavailable";

function initialEngine(music: CommunityStatusMusic): PlaybackEngine | null {
  if (storyMusicHybridClientEnabled()) return null;
  if (music.youtubeVideoId?.trim()) return "youtube";
  return null;
}

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
  slideDurationMs: _slideDurationMs,
  musicContinuesOnNextSlide: _musicContinuesOnNextSlide,
  paused,
  soundOn,
  onToggleSound,
  onNativeAudioAvailable,
  storyPhotoUrl,
  onYoutubeViewerActiveChange,
}: CommunityStoryMusicAttachProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const nativeAudioCbRef = useRef(onNativeAudioAvailable);
  nativeAudioCbRef.current = onNativeAudioAvailable;

  const [loadError, setLoadError] = useState("");
  const [playback, setPlayback] = useState<PlaybackPayload | null>(null);
  const [engine, setEngine] = useState<PlaybackEngine | null>(() => initialEngine(music));
  const [reloadToken, setReloadToken] = useState(0);
  const [youtubeViewerOpen, setYoutubeViewerOpen] = useState(false);

  useEffect(() => {
    onYoutubeViewerActiveChange?.(youtubeViewerOpen);
  }, [onYoutubeViewerActiveChange, youtubeViewerOpen]);

  useEffect(
    () => () => {
      onYoutubeViewerActiveChange?.(false);
    },
    [onYoutubeViewerActiveChange],
  );

  const youtubeVideoId =
    playback?.youtubeVideoId?.trim() || music.youtubeVideoId?.trim() || "";

  const startSeconds =
    typeof playback?.startSeconds === "number" && playback.startSeconds >= 0
      ? Math.floor(playback.startSeconds)
      : null;

  useEffect(() => {
    nativeAudioCbRef.current?.(engine === "audio");
  }, [engine]);

  const applyYoutubeLink = useCallback(
    (payload?: Partial<PlaybackPayload>) => {
      const videoId = payload?.youtubeVideoId?.trim() || music.youtubeVideoId?.trim();
      if (!videoId) {
        setEngine("unavailable");
        setLoadError("Music unavailable for this story.");
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

    try {
      const response = await fetch(
        `/api/community/story-music/playback?trackId=${encodeURIComponent(music.trackId)}`,
        { cache: "no-store" },
      );
      const data = await readJsonResponse<PlaybackPayload>(response);
      const hybrid = Boolean(data.hybrid);

      if (!response.ok) {
        if (!hybrid && music.youtubeVideoId?.trim()) {
          applyYoutubeLink({ youtubeVideoId: music.youtubeVideoId });
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
        applyYoutubeLink(data);
        return;
      }

      if (data.mode === "audio" && data.audioUrl) {
        setPlayback(data);
        setEngine("audio");
        return;
      }

      if (!hybrid && data.mode === "youtube" && (data.youtubeVideoId || music.youtubeVideoId)) {
        applyYoutubeLink({
          ...data,
          youtubeVideoId: data.youtubeVideoId ?? music.youtubeVideoId,
        });
        return;
      }

      if (!hybrid && music.youtubeVideoId?.trim()) {
        applyYoutubeLink({ youtubeVideoId: music.youtubeVideoId });
        return;
      }

      setEngine("unavailable");
      setLoadError(data.unavailableReason ?? "Audio unavailable for this song.");
    } catch (error) {
      if (!storyMusicHybridClientEnabled() && music.youtubeVideoId?.trim()) {
        applyYoutubeLink({ youtubeVideoId: music.youtubeVideoId });
        return;
      }
      setLoadError(error instanceof Error ? error.message : "Could not load story music.");
    }
  }, [applyYoutubeLink, music.trackId, music.youtubeVideoId]);

  useEffect(() => {
    void loadPlayback();
  }, [loadPlayback, music.trackId, reloadToken, slideId]);

  useEffect(() => {
    setYoutubeViewerOpen(false);
  }, [slideId]);

  const handleAudioFailure = useCallback(() => {
    if (playback?.hybrid) {
      setEngine("unavailable");
      setLoadError("Tap to retry sound");
      return;
    }
    if (engine === "audio" && music.youtubeVideoId?.trim()) {
      applyYoutubeLink();
      return;
    }
    setLoadError("Tap to retry sound");
  }, [applyYoutubeLink, engine, music.youtubeVideoId, playback?.hybrid]);

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

    return () => {
      audio.removeEventListener("loadedmetadata", applyStart);
      audio.removeEventListener("error", onError);
      audio.pause();
    };
  }, [
    engine,
    handleAudioFailure,
    music.trackId,
    paused,
    playback?.audioUrl,
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
      if (document.hidden) audioRef.current?.pause();
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

  function openYoutubeWatchExternal() {
    if (!youtubeVideoId) return;
    const url = getYouTubeWatchUrlWithSegment(
      youtubeVideoId,
      startSeconds ?? undefined,
      undefined,
    );
    void openExternalUrl(url);
  }

  function handleStickerClick() {
    if (loadError || engine === "unavailable") {
      setReloadToken((value) => value + 1);
      return;
    }
    if (engine === "youtube") {
      if (youtubeVideoId) {
        setYoutubeViewerOpen(true);
      } else {
        openYoutubeWatchExternal();
      }
      return;
    }
    onToggleSound?.();
  }

  if (!music.trackId?.trim()) return null;

  const youtubeVideoMode = engine === "youtube";

  return (
    <>
      {engine === "audio" ? (
        <audio ref={audioRef} playsInline preload="auto" className="sr-only" aria-hidden tabIndex={-1} />
      ) : null}
      <CommunityStoryYoutubeVideoViewer
        open={youtubeViewerOpen && Boolean(youtubeVideoId)}
        onClose={() => setYoutubeViewerOpen(false)}
        videoId={youtubeVideoId}
        title={music.title}
        artist={music.artist}
        startSeconds={startSeconds}
        soundOn={soundOn}
        storyPhotoUrl={storyPhotoUrl}
        embedUnavailable={engine === "unavailable"}
      />
      <div className="pointer-events-none absolute inset-x-0 bottom-[4.75rem] z-20 flex justify-center px-4">
        <div className="pointer-events-auto max-w-full rounded-full bg-black/55 px-3 py-1.5 shadow-lg ring-1 ring-white/15 backdrop-blur-md">
          <button
            type="button"
            className="flex max-w-[min(100vw-3rem,20rem)] items-center gap-2 text-left"
            onClick={handleStickerClick}
            aria-label={
              loadError || engine === "unavailable"
                ? "Retry story music"
                : youtubeVideoMode
                  ? `Watch gospel music video: ${music.title}`
                  : soundOn
                    ? "Mute story background audio"
                    : "Play story background audio"
            }
          >
            <span className="shrink-0 text-sm" aria-hidden>
              {youtubeVideoMode ? "▶️" : soundOn && !loadError && engine !== "unavailable" ? "🔊" : "🔇"}
            </span>
            <span className="min-w-0 truncate text-xs font-semibold text-white">
              {loadError || engine === "unavailable"
                ? `${music.title} · tap to retry`
                : youtubeVideoMode
                  ? `${music.title} · Tap for gospel video`
                  : `${music.title} · ${music.artist}`}
            </span>
          </button>
        </div>
      </div>
    </>
  );
}
