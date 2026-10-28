"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { resolveStoryMediaUrl } from "@/lib/community-story-utils";

type CommunityStoryMemberAudioAttachProps = {
  slideId: string;
  audioUrl: string;
  slideDurationMs: number;
  audioContinuesOnNextSlide: boolean;
  paused: boolean;
  soundOn: boolean;
  onToggleSound?: () => void;
};

export function CommunityStoryMemberAudioAttach({
  slideId,
  audioUrl,
  slideDurationMs,
  audioContinuesOnNextSlide,
  paused,
  soundOn,
  onToggleSound,
}: CommunityStoryMemberAudioAttachProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [loadError, setLoadError] = useState("");

  const src = resolveStoryMediaUrl(audioUrl);

  useEffect(() => {
    setLoadError("");
  }, [slideId, audioUrl]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !src) return;

    audio.src = src;
    audio.loop = false;
    audio.load();

    const onError = () => setLoadError("Tap to retry your recording");

    audio.addEventListener("error", onError);

    if (!paused && soundOn) {
      void audio.play().catch(() => setLoadError("Tap to play your recording"));
    }

    let clipTimer: number | undefined;
    if (!audioContinuesOnNextSlide && slideDurationMs > 0) {
      clipTimer = window.setTimeout(() => audio.pause(), slideDurationMs);
    }

    return () => {
      audio.removeEventListener("error", onError);
      if (clipTimer != null) window.clearTimeout(clipTimer);
      audio.pause();
      audio.removeAttribute("src");
      audio.load();
    };
  }, [audioContinuesOnNextSlide, paused, slideDurationMs, slideId, soundOn, src]);

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
    const onVisibility = () => {
      if (document.hidden) audioRef.current?.pause();
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, []);

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
      <audio ref={audioRef} playsInline preload="auto" className="sr-only" aria-hidden tabIndex={-1} />
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
              {loadError ? "Your recording · tap to retry" : "Your recording · tap for sound"}
            </span>
          </button>
        </div>
      </div>
    </>
  );
}
