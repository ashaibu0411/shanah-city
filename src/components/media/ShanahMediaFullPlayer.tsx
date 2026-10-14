"use client";

import { createPortal } from "react-dom";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useShanahMedia } from "@/components/media/ShanahMediaPlayerProvider";
import { ShanahMediaMoreOptionsSheet } from "@/components/media/ShanahMediaMoreOptionsSheet";
import { ShanahYouTubeIframePlayer } from "@/components/media/ShanahYouTubeIframePlayer";
import { getShanahMediaCapabilities } from "@/lib/shanah-media-capabilities";
import { resolveAbsoluteMediaUrl } from "@/lib/shanah-media-helpers";
import { SHANAH_MEDIA_SPEEDS } from "@/lib/shanah-media-types";
import { setNativeVideoPictureInPictureEligible } from "@/lib/native-webview-bridge";
import "@/components/media/shanah-media-full-player.css";

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

function IconChevronDown() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function IconCast() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M4 16.5A8.5 8.5 0 0 1 12 8m0 0a8.5 8.5 0 0 1 8 8.5M8 16a4 4 0 0 1 8 0M12 20h.01"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function IconPip() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
      <rect x="3" y="5" width="14" height="10" rx="1.5" stroke="currentColor" strokeWidth="2" />
      <rect x="11" y="11" width="10" height="8" rx="1.5" stroke="currentColor" strokeWidth="2" fill="#000" />
    </svg>
  );
}

function IconPlay() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M8 5v14l11-7z" />
    </svg>
  );
}

function IconPause() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M6 5h4v14H6zm8 0h4v14h-4z" />
    </svg>
  );
}

function IconSkipBack() {
  return (
    <svg className="shanah-media-full-player__skip-icon" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M12 6v2.5l-5 3.5 5 3.5V18M19 6v12"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconSkipForward() {
  return (
    <svg className="shanah-media-full-player__skip-icon" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M12 18v-2.5l5-3.5-5-3.5V6M5 18V6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconMore() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <circle cx="5" cy="12" r="1.75" />
      <circle cx="12" cy="12" r="1.75" />
      <circle cx="19" cy="12" r="1.75" />
    </svg>
  );
}

function IconVideoMode() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
      <rect x="2" y="6" width="20" height="12" rx="2" stroke="currentColor" strokeWidth="2" />
      <path d="M10 10l5 2-5 2v-4z" fill="currentColor" />
    </svg>
  );
}

function IconAudioMode() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M12 3v18M8 7v10M16 7v10M4 10v4M20 10v4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
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
    registerYouTubeController,
    handleYouTubeTimeUpdate,
    handleYouTubePlayingChange,
    handleYouTubeEnded,
    handleYouTubeError,
  } = useShanahMedia();

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!fullPlayerOpen) {
      delete document.body.dataset.mediaPlayerImmersive;
      setNativeVideoPictureInPictureEligible(false);
      return;
    }
    document.body.dataset.mediaPlayerImmersive = "true";
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      delete document.body.dataset.mediaPlayerImmersive;
      document.body.style.overflow = previous;
      setNativeVideoPictureInPictureEligible(false);
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
  const isYouTubeVideo =
    Boolean(item?.youtubeVideoId && isVideoMode && !item?.hostedVideoUrl);
  const customTimeline = !isVideoMode || Boolean(hostedVideoSrc) || isYouTubeVideo;
  const showHostedVideo = Boolean(hostedVideoSrc && isVideoMode);

  useEffect(() => {
    const eligible =
      fullPlayerOpen &&
      showHostedVideo &&
      caps.pictureInPicture &&
      playing &&
      !paused;
    setNativeVideoPictureInPictureEligible(eligible);
  }, [caps.pictureInPicture, fullPlayerOpen, paused, playing, showHostedVideo]);

  useEffect(() => {
    if (videoLocalRef.current && caps.playbackSpeed) {
      videoLocalRef.current.playbackRate = playbackRate;
    }
  }, [playbackRate, caps.playbackSpeed, hostedVideoSrc]);

  const bindVideoRef = useCallback(
    (element: HTMLVideoElement | null) => {
      videoLocalRef.current = element;
      registerVideoElement(element);
    },
    [registerVideoElement],
  );

  const cycleSpeed = useCallback(() => {
    if (!caps.playbackSpeed) return;
    const index = SHANAH_MEDIA_SPEEDS.indexOf(playbackRate);
    const next = SHANAH_MEDIA_SPEEDS[(index + 1) % SHANAH_MEDIA_SPEEDS.length];
    setPlaybackRate(next);
  }, [caps.playbackSpeed, playbackRate, setPlaybackRate]);

  if (!mounted || !fullPlayerOpen || !item) return null;

  const remaining = duration > 0 ? Math.max(0, duration - position) : 0;

  const playPauseDisabled = loading && !isVideoMode && !isYouTubeVideo;

  return createPortal(
    <div className="shanah-media-full-player fixed inset-0 z-[200]">
      <header className="shanah-media-full-player__header">
        <button
          type="button"
          className="shanah-media-full-player__icon-btn"
          aria-label="Minimize player"
          onClick={() => setFullPlayerOpen(false)}
        >
          <IconChevronDown />
        </button>
        <div className="shanah-media-full-player__title-block">
          <p className="shanah-media-full-player__title">{item.title}</p>
          {publishedLabel ? <p className="shanah-media-full-player__date">{publishedLabel}</p> : null}
        </div>
        <div className="shanah-media-full-player__header-actions">
          {caps.cast ? (
            <button
              type="button"
              className="shanah-media-full-player__icon-btn"
              aria-label="Cast"
              onClick={() => void openCast()}
            >
              <IconCast />
            </button>
          ) : null}
          {caps.pictureInPicture ? (
            <button
              type="button"
              className="shanah-media-full-player__icon-btn"
              aria-label="Picture in Picture"
              onClick={() => void enterPictureInPicture()}
            >
              <IconPip />
            </button>
          ) : null}
        </div>
      </header>

      <div className="shanah-media-full-player__stage">
        {isVideoMode ? (
          <div className="shanah-media-full-player__video-wrap">
            {hostedVideoSrc ? (
              <video
                ref={bindVideoRef}
                src={hostedVideoSrc}
                className="shanah-media-full-player__video"
                playsInline
                controls={false}
              />
            ) : isYouTubeVideo && item.youtubeVideoId ? (
              <ShanahYouTubeIframePlayer
                videoId={item.youtubeVideoId}
                origin={window.location.origin}
                playbackRate={playbackRate}
                onControllerReady={registerYouTubeController}
                onTimeUpdate={handleYouTubeTimeUpdate}
                onPlayingChange={handleYouTubePlayingChange}
                onEnded={handleYouTubeEnded}
                onError={handleYouTubeError}
              />
            ) : null}
          </div>
        ) : (
          <div className="shanah-media-full-player__artwork">
            {item.artworkUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={item.artworkUrl} alt="" />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-5xl text-white/40">♪</div>
            )}
          </div>
        )}
      </div>

      {!isVideoMode ? (
        <div className="shanah-media-full-player__audio-meta">
          <h2>{item.title}</h2>
          <p>{item.artist}</p>
        </div>
      ) : null}

      <footer className="shanah-media-full-player__dock">
        {customTimeline ? (
          <div className="shanah-media-full-player__timeline">
            <span className="shanah-media-full-player__time">{formatTime(position)}</span>
            <input
              type="range"
              min={0}
              max={duration || 100}
              value={Math.min(position, duration || position || 0)}
              onChange={(event) => seek(Number(event.target.value))}
              className="shanah-media-full-player__seek"
              aria-label="Playback position"
            />
            <span className="shanah-media-full-player__time shanah-media-full-player__time--right">
              −{formatTime(remaining)}
            </span>
            <span className="shanah-media-full-player__mode-icon" aria-hidden>
              {isVideoMode ? <IconVideoMode /> : <IconAudioMode />}
            </span>
          </div>
        ) : null}

        <div className="shanah-media-full-player__controls">
          <button
            type="button"
            className="shanah-media-full-player__speed"
            aria-label="Playback speed"
            disabled={!caps.playbackSpeed}
            onClick={cycleSpeed}
          >
            {playbackRate}x
          </button>
          <button
            type="button"
            className="shanah-media-full-player__skip"
            aria-label="Rewind 15 seconds"
            disabled={!customTimeline}
            onClick={() => skipBackward(15)}
          >
            <IconSkipBack />
            <span>15</span>
          </button>
          <button
            type="button"
            className="shanah-media-full-player__play"
            aria-label={paused || !playing ? "Play" : "Pause"}
            disabled={playPauseDisabled}
            onClick={paused || !playing ? resume : pause}
          >
            {loading || buffering ? (
              <span className="text-sm font-bold">…</span>
            ) : paused || !playing ? (
              <IconPlay />
            ) : (
              <IconPause />
            )}
          </button>
          <button
            type="button"
            className="shanah-media-full-player__skip"
            aria-label="Forward 15 seconds"
            disabled={!customTimeline}
            onClick={() => skipForward(15)}
          >
            <IconSkipForward />
            <span>15</span>
          </button>
          <button
            type="button"
            className="shanah-media-full-player__icon-btn"
            aria-label="More options"
            onClick={() => setMoreOpen(true)}
          >
            <IconMore />
          </button>
        </div>

        {error ? (
          <div className="shanah-media-full-player__error">
            {error}{" "}
            <button type="button" className="font-bold underline" onClick={retry}>
              Retry
            </button>
          </div>
        ) : null}
      </footer>

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
        onStop={stop}
        queue={queue}
        onNextInQueue={nextInQueue}
        onRemoveFromQueue={removeFromQueue}
        onClearQueue={clearQueue}
      />
    </div>,
    document.body,
  );
}
