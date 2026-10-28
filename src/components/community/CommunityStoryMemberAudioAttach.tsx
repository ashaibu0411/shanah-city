"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { inferCommunityAudioContentType } from "@/lib/community-media-shared";
import { communityAudioNameFromUrl } from "@/lib/community-story-member-audio-playback";
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
  const onDurationKnownRef = useRef(onDurationKnown);
  const onProgressRef = useRef(onProgress);
  const onPlaybackEndedRef = useRef(onPlaybackEnded);
  const [needsUserPlay, setNeedsUserPlay] = useState(false);
  const [loadError, setLoadError] = useState("");
  const endedRef = useRef(false);

  slideDurationMsRef.current = slideDurationMs;
  onDurationKnownRef.current = onDurationKnown;
  onProgressRef.current = onProgress;
  onPlaybackEndedRef.current = onPlaybackEnded;

  const src = resolveStoryMediaUrl(audioUrl);
  const contentType = inferCommunityAudioContentType(
    communityAudioNameFromUrl(audioUrl),
    undefined,
  );

  const tryPlay = useCallback(async () => {
    const audio = audioRef.current;
    if (!audio || !src) return false;
    try {
      await audio.play();
      setNeedsUserPlay(false);
      setLoadError("");
      return true;
    } catch {
      setNeedsUserPlay(true);
      setLoadError("");
      return false;
    }
  }, [src]);

  useEffect(() => {
    setLoadError("");
    setNeedsUserPlay(false);
    endedRef.current = false;
  }, [slideId, audioUrl]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !src) return;

    const onError = () => {
      setLoadError("Could not load your recording");
      setNeedsUserPlay(true);
    };

    const onLoadedMetadata = () => {
      const durationMs =
        Number.isFinite(audio.duration) && audio.duration > 0
          ? Math.ceil(audio.duration * 1000)
          : 0;
      if (durationMs > 0) onDurationKnownRef.current?.(durationMs);
    };

    const onTimeUpdate = () => {
      const durationMs = slideDurationMsRef.current;
      if (durationMs <= 0) return;
      const pct = Math.min(100, ((audio.currentTime * 1000) / durationMs) * 100);
      onProgressRef.current?.(pct);
    };

    const onEnded = () => {
      if (endedRef.current) return;
      endedRef.current = true;
      onPlaybackEndedRef.current?.();
    };

    audio.pause();
    audio.removeAttribute("src");
    audio.load();
    audio.src = src;
    audio.loop = false;
    audio.load();

    audio.addEventListener("error", onError);
    audio.addEventListener("loadedmetadata", onLoadedMetadata);
    audio.addEventListener("timeupdate", onTimeUpdate);
    audio.addEventListener("ended", onEnded);

    return () => {
      audio.removeEventListener("error", onError);
      audio.removeEventListener("loadedmetadata", onLoadedMetadata);
      audio.removeEventListener("timeupdate", onTimeUpdate);
      audio.removeEventListener("ended", onEnded);
      audio.pause();
      audio.removeAttribute("src");
      audio.load();
    };
  }, [slideId, src]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !src) return;
    audio.muted = !soundOn;
    if (paused || !soundOn) {
      audio.pause();
      return;
    }
    if (needsUserPlay) return;
    void tryPlay();
  }, [needsUserPlay, paused, soundOn, src, tryPlay]);

  useEffect(() => {
    if (audioContinuesOnNextSlide) return;
    const onVisibility = () => {
      if (document.hidden) audioRef.current?.pause();
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, [audioContinuesOnNextSlide]);

  const handleStickerPress = useCallback(() => {
    if (loadError || needsUserPlay) {
      void tryPlay();
      return;
    }
    onToggleSound?.();
  }, [loadError, needsUserPlay, onToggleSound, tryPlay]);

  if (!audioUrl.trim()) return null;

  const showPlayVoice = needsUserPlay || Boolean(loadError);
  const label = showPlayVoice
    ? "Play voice"
    : soundOn
      ? "Your recording · tap to mute"
      : "Your recording · tap to play";

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
            onClick={handleStickerPress}
            aria-label={showPlayVoice ? "Play voice on this story" : label}
          >
            <span className="shrink-0 text-sm" aria-hidden>
              {showPlayVoice ? "▶️" : soundOn ? "🎙️" : "🔇"}
            </span>
            <span className="min-w-0 truncate text-xs font-semibold text-white">{label}</span>
          </button>
        </div>
      </div>
    </>
  );
}
