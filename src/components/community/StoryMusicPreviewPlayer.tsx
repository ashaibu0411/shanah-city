"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { readJsonResponse } from "@/lib/read-json-response";
import type { StoryMusicPlaybackApiResponse } from "@/lib/story-music/playback-response";
import { normalizeStoryMusicClipStart, storyMusicClipEnd } from "@/lib/story-music/story-music-clip";

type StoryMusicPreviewPlayerProps = {
  trackId: string;
  startSeconds?: number;
  durationSec?: 30 | 60;
  label?: string;
  className?: string;
};

export function StoryMusicPreviewPlayer({ trackId, startSeconds, durationSec = 30, label = "Preview", className = "" }: StoryMusicPreviewPlayerProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [status, setStatus] = useState<"idle" | "loading" | "playing" | "paused" | "unavailable">("idle");
  const [reason, setReason] = useState("");
  const loadedUrlRef = useRef<string | null>(null);
  const startRef = useRef(0);
  const endRef = useRef(30);
  const [clipComplete, setClipComplete] = useState(false);

  const stop = useCallback(() => {
    const audio = audioRef.current;
    if (audio) {
      audio.pause();
      audio.removeAttribute("src");
      audio.load();
    }
    loadedUrlRef.current = null;
    setStatus("idle");
  }, []);

  const preview = useCallback(async () => {
    setReason("");
    const audio = audioRef.current;
    if (!audio) return;

    if (status === "paused" && loadedUrlRef.current) {
      try {
        await audio.play();
        setStatus("playing");
      } catch {
        setStatus("unavailable");
        setReason("Could not resume preview.");
      }
      return;
    }

    stop();
    setClipComplete(false);
    setStatus("loading");
    try {
      const response = await fetch(
        `/api/community/story-music/playback?trackId=${encodeURIComponent(trackId)}`,
        { cache: "no-store" },
      );
      const data = await readJsonResponse<StoryMusicPlaybackApiResponse>(response);
      if (data.mode === "unavailable" || !data.audioUrl) {
        setStatus("unavailable");
        setReason(data.unavailableReason ?? "Preview unavailable.");
        return;
      }
      if (data.mode !== "audio") {
        setStatus("unavailable");
        setReason("Preview requires authorized audio (same as story playback).");
        return;
      }

      const start = normalizeStoryMusicClipStart(startSeconds, data.startSeconds ?? 0);
      startRef.current = start;
      endRef.current = storyMusicClipEnd(start, durationSec);
      loadedUrlRef.current = data.audioUrl;
      audio.src = data.audioUrl;
      audio.load();
      const seekStart = () => {
        // Browsers sometimes ignore currentTime until metadata is available.
        const maxStart = Number.isFinite(audio.duration) ? Math.max(0, audio.duration - 0.25) : start;
        audio.currentTime = Math.min(start, maxStart);
      };
      if (audio.readyState >= 1) seekStart();
      else audio.addEventListener("loadedmetadata", seekStart, { once: true });
      await audio.play();
      setStatus("playing");
    } catch {
      setStatus("unavailable");
      setReason("Could not load preview.");
    }
  }, [status, stop, trackId, startSeconds, durationSec]);

  useEffect(() => () => stop(), [stop]);
  useEffect(() => {
    // Recheck the selected segment whenever its bounds or song changes.
    stop();
  }, [trackId, startSeconds, durationSec, stop]);

  function handleTimeUpdate() {
    const audio = audioRef.current;
    if (!audio) return;
    if (audio.currentTime + 0.05 >= endRef.current) {
      audio.pause();
      setClipComplete(true);
      setStatus("idle");
      return;
    }
  }


  const buttonLabel =
    status === "loading"
      ? "…"
      : status === "playing"
        ? "Pause"
        : status === "paused"
          ? "Resume"
          : label;

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <audio ref={audioRef} playsInline preload="none" onTimeUpdate={handleTimeUpdate} onEnded={() => { setClipComplete(true); setStatus("idle"); }} className="sr-only" aria-hidden tabIndex={-1} />
      <button
        type="button"
        className="shrink-0 rounded-full bg-clay-600 px-2.5 py-1 text-[11px] font-semibold text-white disabled:opacity-50"
        disabled={status === "loading"}
        onClick={() => {
          if (status === "playing") {
            audioRef.current?.pause();
            setStatus("paused");
            return;
          }
          void preview();
        }}
      >
        {buttonLabel}
      </button>
      {clipComplete && status === "idle" ? (
        <span className="text-[11px] text-night-600 dark:text-sand-300">Clip ended</span>
      ) : null}
      {status === "unavailable" ? (
        <span className="text-[11px] text-amber-800 dark:text-amber-200">{reason}</span>
      ) : null}
    </div>
  );
}
