"use client";

import { useEffect, useRef, useState } from "react";
import type { CommunityStatusMusic } from "@/lib/member-types";
import { readJsonResponse } from "@/lib/read-json-response";

type CommunityStoryMusicAttachProps = {
  music: CommunityStatusMusic;
  paused: boolean;
  soundOn: boolean;
  onToggleSound?: () => void;
};

type PlaybackPayload = {
  audioUrl?: string;
  startSeconds?: number | null;
  error?: string;
};

export function CommunityStoryMusicAttach({
  music,
  paused,
  soundOn,
  onToggleSound,
}: CommunityStoryMusicAttachProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [loadError, setLoadError] = useState("");
  const [audioSrc, setAudioSrc] = useState("");
  const [startSeconds, setStartSeconds] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoadError("");
    setAudioSrc("");

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
        if (cancelled) return;
        if (!data.audioUrl) {
          setLoadError(data.error ?? "Audio unavailable for this song.");
          return;
        }
        setAudioSrc(data.audioUrl);
        setStartSeconds(
          typeof data.startSeconds === "number" && data.startSeconds >= 0
            ? Math.floor(data.startSeconds)
            : null,
        );
      })
      .catch(() => {
        if (!cancelled) setLoadError("Could not load story music.");
      });

    return () => {
      cancelled = true;
    };
  }, [music.trackId]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !audioSrc) return;

    audio.src = audioSrc;
    audio.loop = true;
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

    audio.addEventListener("loadedmetadata", applyStart, { once: true });

    if (!paused && soundOn) {
      void audio.play().catch(() => undefined);
    }

    return () => {
      audio.removeEventListener("loadedmetadata", applyStart);
      audio.pause();
    };
  }, [audioSrc, music.trackId, paused, soundOn, startSeconds]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.muted = !soundOn;
    if (paused || !soundOn) {
      audio.pause();
    } else if (audioSrc) {
      void audio.play().catch(() => undefined);
    }
  }, [audioSrc, paused, soundOn]);

  return (
    <>
      <audio ref={audioRef} playsInline preload="auto" className="sr-only" aria-hidden tabIndex={-1} />
      <div className="pointer-events-none absolute inset-x-0 bottom-[4.75rem] z-20 flex justify-center px-4">
        <div className="pointer-events-auto max-w-full rounded-full bg-black/55 px-3 py-1.5 shadow-lg ring-1 ring-white/15 backdrop-blur-md">
          <button
            type="button"
            className="flex max-w-[min(100vw-3rem,20rem)] items-center gap-2 text-left"
            onClick={() => onToggleSound?.()}
            aria-label={soundOn ? "Mute story music" : "Play story music"}
          >
            <span className="shrink-0 text-sm" aria-hidden>
              {soundOn ? "🔊" : "🔇"}
            </span>
            <span className="min-w-0 truncate text-xs font-semibold text-white">
              {loadError ? `${music.title} · tap to retry sound` : `${music.title} · ${music.artist}`}
            </span>
          </button>
        </div>
      </div>
    </>
  );
}
