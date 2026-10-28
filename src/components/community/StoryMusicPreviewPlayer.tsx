"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { readJsonResponse } from "@/lib/read-json-response";
import type { StoryMusicPlaybackApiResponse } from "@/lib/story-music/playback-response";

type StoryMusicPreviewPlayerProps = {
  trackId: string;
  label?: string;
  className?: string;
};

export function StoryMusicPreviewPlayer({ trackId, label = "Preview", className = "" }: StoryMusicPreviewPlayerProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [status, setStatus] = useState<"idle" | "loading" | "playing" | "unavailable">("idle");
  const [reason, setReason] = useState("");

  const stop = useCallback(() => {
    const audio = audioRef.current;
    if (audio) {
      audio.pause();
      audio.removeAttribute("src");
    }
    setStatus("idle");
  }, []);

  const preview = useCallback(async () => {
    stop();
    setStatus("loading");
    setReason("");
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

      const audio = audioRef.current;
      if (!audio) return;
      audio.src = data.audioUrl;
      if (typeof data.startSeconds === "number" && data.startSeconds > 0) {
        audio.currentTime = data.startSeconds;
      }
      await audio.play();
      setStatus("playing");
    } catch {
      setStatus("unavailable");
      setReason("Could not load preview.");
    }
  }, [stop, trackId]);

  useEffect(() => () => stop(), [stop]);

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <audio ref={audioRef} playsInline preload="none" className="sr-only" aria-hidden tabIndex={-1} />
      <button
        type="button"
        className="shrink-0 rounded-full bg-clay-600 px-2.5 py-1 text-[11px] font-semibold text-white disabled:opacity-50"
        disabled={status === "loading"}
        onClick={() => {
          if (status === "playing") stop();
          else void preview();
        }}
      >
        {status === "loading" ? "…" : status === "playing" ? "Stop" : label}
      </button>
      {status === "unavailable" ? (
        <span className="text-[11px] text-amber-800 dark:text-amber-200">{reason}</span>
      ) : null}
    </div>
  );
}
