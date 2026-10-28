"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { inferCommunityAudioContentType } from "@/lib/community-media-shared";
import { resolveStoryMediaUrl } from "@/lib/community-story-utils";

type CommunityStoryMemberAudioAttachProps = {
  slideId: string;
  audioUrl: string;
  slideDurationMs: number;
  audioContinuesOnNextSlide: boolean;
  paused: boolean;
  soundOn: boolean;
  onToggleSound?: () => void;
  onDurationKnown?: (durationMs: number) => void;
  onProgress?: (progressPercent: number) => void;
  onPlaybackEnded?: () => void;
};

export function CommunityStoryMemberAudioAttach({
  slideId,
  audioUrl,
  slideDurationMs,
  audioContinuesOnNextSlide,
  paused,
  soundOn,
  onToggleSound,
  onDurationKnown,
  onProgress,
  onPlaybackEnded,
}: CommunityStoryMemberAudioAttachProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const slideDurationMsRef = useRef(slideDurationMs);
  const [loadError, setLoadError] = useState("");
  const endedRef = useRef(false);

  slideDurationMsRef.current = slideDurationMs;

  const src = resolveStoryMediaUrl(audioUrl);
  const contentType = inferCommunityAudioContentType(audioUrl);

  useEffect(() => {
    setLoadError("");
    endedRef.current = false;
  }, [slideId, audioUrl]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !src) return;

    const onError = () => setLoadError("Tap to play your recording");

    const onLoadedMetadata = () => {
      const durationMs =
        Number.isFinite(audio.duration) && audio.duration > 0
          ? Math.ceil(audio.duration * 1000)
          : 0;
      if (durationMs > 0) onDurationKnown?.(durationMs);
    };

    const onTimeUpdate = () => {
      const durationMs = slideDurationMsRef.current;
      if (durationMs <= 0) return;
      const pct = Math.min(100, ((audio.currentTime * 1000) / durationMs) * 100);
      onProgress?.(pct);
    };

    const onEnded = () => {
      if (endedRef.current) return;
      endedRef.current = true;
      onPlaybackEnded?.();
    };

    audio.src = src;
    audio.loop = false;
    audio.load();

    audio.addEventListener("error", onError);
    audio.addEventListener("loadedmetadata", onLoadedMetadata);
    audio.addEventListener("timeupdate", onTimeUpdate);
    audio.addEventListener("ended", onEnded);

    if (!paused && soundOn) {
      void audio.play().catch(() => setLoadError("Tap to play your recording"));
    }

    return () => {
      audio.removeEventListener("error", onError);
      audio.removeEventListener("loadedmetadata", onLoadedMetadata);
      audio.removeEventListener("timeupdate", onTimeUpdate);
      audio.removeEventListener("ended", onEnded);
      audio.pause();
      audio.removeAttribute("src");
      audio.load();
    };
  }, [onDurationKnown, onPlaybackEnded, onProgress, paused, slideId, soundOn, src]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.muted = !soundOn;
    if (paused || !soundOn) {
      audio.pause();
    } else {
      void audio.play().catch(() => setLoadError("Tap to play your recording"));
    }
  }, [paused, soundOn]);

  useEffect(() => {
    if (audioContinuesOnNextSlide) return;
    const onVisibility = () => {
      if (document.hidden) audioRef.current?.pause();
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, [audioContinuesOnNextSlide]);

  const retry = useCallback(() => {
    setLoadError("");
    const audio = audioRef.current;
    if (!audio || !src) return;
    audio.src = src;
    void audio.play().catch(() => setLoadError("Could not play recording"));
  }, [src]);

  if (!audioUrl.trim()) return null;

  return (
    <>
      <audio ref={audioRef} playsInline preload="auto" className="sr-only" aria-hidden tabIndex={-1}>
        <source src={src} type={contentType} />
      </audio>
      <div className="pointer-events-none absolute inset-x-0 bottom-[4.75rem] z-20 flex justify-center px-4">
        <div className="pointer-events-auto max-w-full rounded-full bg-black/55 px-3 py-1.5 shadow-lg ring-1 ring-white/15 backdrop-blur-md">
          <button
            type="button"
            className="flex max-w-[min(100vw-3rem,20rem)] items-center gap-2 text-left"
            onClick={() => {
              if (loadError) retry();
              else onToggleSound?.();
            }}
            aria-label={
              loadError ? "Retry story recording" : soundOn ? "Mute your recording" : "Play your recording"
            }
          >
            <span className="shrink-0 text-sm" aria-hidden>
              {soundOn && !loadError ? "🎙️" : "🔇"}
            </span>
            <span className="min-w-0 truncate text-xs font-semibold text-white">
              {loadError ? "Your recording · tap to play" : "Your recording · tap for sound"}
            </span>
          </button>
        </div>
      </div>
    </>
  );
}
