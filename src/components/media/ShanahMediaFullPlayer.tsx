"use client";

import { createPortal } from "react-dom";
import { useEffect, useMemo, useRef, useState } from "react";
import { useShanahMedia } from "@/components/media/ShanahMediaPlayerProvider";
import { ShanahMediaMoreOptionsSheet } from "@/components/media/ShanahMediaMoreOptionsSheet";
import { getSermonYouTubeEmbedSrc } from "@/components/sermons/SermonYouTubeEmbed";
import { getShanahMediaCapabilities } from "@/lib/shanah-media-capabilities";
import { resolveAbsoluteMediaUrl } from "@/lib/shanah-media-helpers";
import { SHANAH_MEDIA_SPEEDS } from "@/lib/shanah-media-types";

function formatTime(seconds: number) {
  if (!Number.isFinite(seconds) || seconds < 0) return "0:00";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${String(secs).padStart(2, "0")}`;
}

function formatPublished(iso?: string) {
  if (!iso) return null;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

export function ShanahMediaFullPlayer() {
  const [mounted, setMounted] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const videoLocalRef = useRef<HTMLVideoElement | null>(null);

  const {
    item,
    playing,
    paused,
    loading,
    buffering,
    error,
    position,
    duration,
    playbackRate,
    playbackMode,
    queue,
    fullPlayerOpen,
    setFullPlayerOpen,
    registerVideoElement,
    pause,
    resume,
    stop,
    seek,
    skipBackward,
    skipForward,
    setPlaybackRate,
    nextInQueue,
    retry,
    removeFromQueue,
    clearQueue,
    switchToAudio,
    switchToVideo,
    enterPictureInPicture,
    openCast,
    shareCurrent,
  } = useShanahMedia();

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!fullPlayerOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [fullPlayerOpen]);

  const caps = useMemo(
    () => getShanahMediaCapabilities(item, playbackMode),
    [item, playbackMode],
  );

  const publishedLabel = formatPublished(item?.publishedAt);
  const isVideoMode = playbackMode === "video" && item && (item.hostedVideoUrl || item.youtubeVideoId);
  const hostedVideoSrc =
    item?.hostedVideoUrl && isVideoMode ? resolveAbsoluteMediaUrl(item.hostedVideoUrl) : "";

  const bindVideoRef = (element: HTMLVideoElement | null) => {
    videoLocalRef.current = element;
    registerVideoElement(element);
  };

  if (!mounted || !fullPlayerOpen || !item) return null;

  const progress = duration > 0 ? Math.min(100, (position / duration) * 100) : 0;
  const youtubeSrc =
    item.youtubeVideoId && isVideoMode
      ? getSermonYouTubeEmbedSrc(item.youtubeVideoId, window.location.origin)
      : "";

  return createPortal(
    <div className="fixed inset-0 z-[200] flex flex-col bg-night-950 text-white">
      <div className="flex items-center justify-between px-3 pb-2 pt-[max(0.5rem,env(safe-area-inset-top))]">
        <button
          type="button"
          className="min-h-[44px] rounded-full px-3 text-sm font-semibold text-white/90"
          onClick={() => setFullPlayerOpen(false)}
        >
          Minimize
        </button>
        <div className="flex items-center gap-1">
          {caps.cast ? (
            <button
              type="button"
              className="min-h-[44px] min-w-[44px] rounded-full text-lg"
              aria-label="Cast"
              onClick={() => void openCast()}
            >
              📺
            </button>
          ) : null}
          {caps.pictureInPicture ? (
            <button
              type="button"
              className="min-h-[44px] min-w-[44px] rounded-full text-lg"
              aria-label="Picture in Picture"
              onClick={() => void enterPictureInPicture()}
            >
              ⧉
            </button>
          ) : null}
          <button
            type="button"
            className="min-h-[44px] rounded-full px-3 text-sm font-semibold text-white/90"
            onClick={() => setMoreOpen(true)}
          >
            More
          </button>
        </div>
      </div>

      <div className="flex min-h-0 flex-1 flex-col px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
        {isVideoMode ? (
          <div className="w-full shrink-0 overflow-hidden rounded-2xl bg-black ring-1 ring-white/10">
            {hostedVideoSrc ? (
              <video
                ref={bindVideoRef}
                src={hostedVideoSrc}
                className="aspect-video w-full bg-black object-contain"
                playsInline
                controls={false}
              />
            ) : youtubeSrc ? (
              <div className="aspect-video w-full">
                <iframe
                  src={youtubeSrc}
                  title={item.title}
                  className="h-full w-full"
                  allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture; fullscreen"
                  allowFullScreen
                />
              </div>
            ) : null}
          </div>
        ) : (
          <div className="mx-auto aspect-square w-full max-w-[min(100%,280px)] overflow-hidden rounded-3xl bg-night-800 ring-1 ring-white/10">
            {item.artworkUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={item.artworkUrl} alt="" className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-5xl">♪</div>
            )}
          </div>
        )}

        <h1 className="mt-4 line-clamp-2 font-display text-xl font-semibold leading-snug">{item.title}</h1>
        <p className="mt-1 text-sm text-sand-300">{item.artist}</p>
        {publishedLabel ? <p className="mt-1 text-xs text-sand-500">{publishedLabel}</p> : null}

        {!isVideoMode || hostedVideoSrc ? (
          <div className="mt-5 w-full">
            <input
              type="range"
              min={0}
              max={duration || 100}
              value={Math.min(position, duration || position)}
              onChange={(event) => seek(Number(event.target.value))}
              className="w-full accent-clay-400"
              aria-label="Playback position"
            />
            <div className="mt-1 flex justify-between text-xs text-sand-400">
              <span>{formatTime(position)}</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>
        ) : (
          <p className="mt-4 text-xs leading-relaxed text-sand-400">
            YouTube controls the timeline here. Use Listen for background audio when your team has published it.
          </p>
        )}

        {(!isVideoMode || hostedVideoSrc) && (
          <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              className="min-h-[44px] min-w-[44px] rounded-full bg-white/10 px-4 text-sm font-bold"
              onClick={() => skipBackward(15)}
            >
              −15s
            </button>
            <button
              type="button"
              className="flex h-14 w-14 items-center justify-center rounded-full bg-white text-lg font-bold text-night-900"
              onClick={paused || !playing ? resume : pause}
              disabled={loading && !isVideoMode}
            >
              {loading || buffering ? "…" : paused || !playing ? "▶" : "❚❚"}
            </button>
            <button
              type="button"
              className="min-h-[44px] min-w-[44px] rounded-full bg-white/10 px-4 text-sm font-bold"
              onClick={() => skipForward(15)}
            >
              +15s
            </button>
          </div>
        )}

        {caps.switchToAudio && isVideoMode ? (
          <button
            type="button"
            className="mt-4 min-h-[44px] w-full rounded-full bg-clay-500/90 text-sm font-bold text-night-950"
            onClick={() => void switchToAudio()}
          >
            Switch to audio
          </button>
        ) : null}

        {caps.switchToVideo && !isVideoMode ? (
          <button
            type="button"
            className="mt-4 min-h-[44px] w-full rounded-full bg-white/10 text-sm font-bold"
            onClick={() => void switchToVideo()}
          >
            Switch to video
          </button>
        ) : null}

        {!isVideoMode ? (
          <label className="mt-4 block text-center text-sm text-sand-300">
            Speed{" "}
            <select
              value={playbackRate}
              onChange={(event) =>
                setPlaybackRate(Number(event.target.value) as (typeof SHANAH_MEDIA_SPEEDS)[number])
              }
              className="ml-2 rounded-lg border border-white/15 bg-night-900 px-2 py-1 text-white"
            >
              {SHANAH_MEDIA_SPEEDS.map((speed) => (
                <option key={speed} value={speed}>
                  {speed}x
                </option>
              ))}
            </select>
          </label>
        ) : null}

        {error ? (
          <div className="mt-4 rounded-2xl bg-red-950/50 px-4 py-3 text-sm text-red-100">
            {error}
            <button type="button" className="ml-3 font-bold underline" onClick={retry}>
              Retry
            </button>
          </div>
        ) : null}

        {queue.length > 0 ? (
          <div className="mt-6 rounded-2xl bg-white/5 p-4 ring-1 ring-white/10">
            <div className="mb-2 flex items-center justify-between">
              <p className="text-xs font-bold uppercase tracking-wide text-sand-400">Up next</p>
              <button type="button" className="text-xs font-semibold text-clay-300" onClick={clearQueue}>
                Clear
              </button>
            </div>
            <ul className="space-y-2 text-sm">
              {queue.slice(0, 5).map((entry) => (
                <li key={entry.id} className="flex items-center justify-between gap-2">
                  <span className="truncate">{entry.title}</span>
                  <button
                    type="button"
                    className="shrink-0 text-xs text-sand-400"
                    onClick={() => removeFromQueue(entry.id)}
                  >
                    Remove
                  </button>
                </li>
              ))}
            </ul>
            <button type="button" className="mt-3 text-sm font-semibold text-clay-300" onClick={nextInQueue}>
              Play next in queue
            </button>
          </div>
        ) : null}
      </div>

      <ShanahMediaMoreOptionsSheet
        open={moreOpen}
        onClose={() => setMoreOpen(false)}
        item={item}
        playbackMode={playbackMode}
        playbackRate={playbackRate}
        onSetPlaybackRate={setPlaybackRate}
        onSwitchToAudio={() => void switchToAudio()}
        onSwitchToVideo={() => void switchToVideo()}
        onCast={() => void openCast()}
        onPictureInPicture={() => void enterPictureInPicture()}
        onShare={() => void shareCurrent()}
      />

      <button
        type="button"
        className="absolute bottom-[max(1rem,env(safe-area-inset-bottom))] right-4 min-h-[44px] rounded-full bg-white/10 px-4 text-xs font-bold"
        onClick={stop}
      >
        Stop
      </button>
    </div>,
    document.body,
  );
}
