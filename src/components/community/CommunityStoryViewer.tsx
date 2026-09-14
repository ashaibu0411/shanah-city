"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { CommunityAvatar } from "@/components/community/CommunityAvatar";
import { formatCommunityTimeAgo } from "@/lib/community-ui-utils";
import { inferCommunityAudioContentType } from "@/lib/community-media-shared";
import { readJsonResponse } from "@/lib/read-json-response";
import type { CommunityStatus, CommunityStoryReactionKind } from "@/lib/member-types";
import { getNextWorshipService } from "@/lib/community-worship-service";
import {
  resolveStoryMediaUrl,
  STORY_IMAGE_MS,
  type StoryDeck,
} from "@/lib/community-story-utils";
import { StorySlideLink } from "@/components/community/StorySlideLink";

function reactionButtonsForSlide(slide: CommunityStatus) {
  if (slide.storyKind === "service_invite") {
    return [
      { kind: "coming" as const, label: "I'm going", emoji: "🙋" },
      { kind: "pray" as const, label: "Pray", emoji: "🙏" },
      { kind: "amen" as const, label: "Amen", emoji: "🙌" },
    ];
  }
  return [
    { kind: "pray" as const, label: "Pray", emoji: "🙏" },
    { kind: "coming" as const, label: "I'm in", emoji: "✓" },
    { kind: "amen" as const, label: "Amen", emoji: "🙌" },
  ];
}

type CommunityStoryViewerProps = {
  decks: StoryDeck[];
  initialDeckIndex: number;
  initialSlideIndex?: number;
  currentUserId: string;
  onClose: () => void;
  onStoriesSeen?: (statusIds: string[]) => void;
  onStoryDeleted?: (statusId: string) => void;
  onStatusReactionChange?: (
    statusId: string,
    reactions: NonNullable<CommunityStatus["reactions"]>,
    viewerReactions: CommunityStoryReactionKind[],
  ) => void;
};

function StorySlideVideo({
  src,
  paused,
  muted,
  onProgress,
  onEnded,
  onError,
}: {
  src: string;
  fileName?: string;
  paused: boolean;
  muted: boolean;
  onProgress: (percent: number) => void;
  onEnded: () => void;
  onError: (detail?: string) => void;
}) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const mediaUrl = resolveStoryMediaUrl(src);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    setProgressSafe(video, onProgress);
    void video.play().catch(() => undefined);
  }, [mediaUrl, onProgress, reloadKey]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    if (paused) {
      video.pause();
    } else {
      void video.play().catch(() => undefined);
    }
  }, [paused]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = muted;
    if (!paused) {
      void video.play().catch(() => undefined);
    }
  }, [muted, paused]);

  function setProgressSafe(video: HTMLVideoElement, progress: (percent: number) => void) {
    if (!video.duration || !Number.isFinite(video.duration)) return;
    progress(Math.min(100, (video.currentTime / video.duration) * 100));
  }

  return (
    <video
      ref={videoRef}
      key={`${mediaUrl}-${reloadKey}`}
      src={mediaUrl}
      playsInline
      muted={muted}
      autoPlay
      preload="auto"
      className="h-full w-full object-contain"
      onLoadedMetadata={(event) => {
        setProgressSafe(event.currentTarget, onProgress);
        void event.currentTarget.play().catch(() => undefined);
      }}
      onTimeUpdate={(event) => {
        setProgressSafe(event.currentTarget, onProgress);
      }}
      onWaiting={() => {
        const video = videoRef.current;
        if (video && video.paused && !paused) {
          void video.play().catch(() => undefined);
        }
      }}
      onStalled={() => {
        const video = videoRef.current;
        if (video && !paused) {
          void video.play().catch(() => undefined);
        }
      }}
      onEnded={onEnded}
      onError={() => {
        if (reloadKey === 0) {
          setReloadKey(1);
          return;
        }
        onError(
          "This video could not play on this device. Try posting an MP4 (under 100 MB) or a shorter clip.",
        );
      }}
    />
  );
}

function StorySlideAudio({
  src,
  fileName,
  paused,
  onProgress,
  onEnded,
  onError,
}: {
  src: string;
  fileName?: string;
  paused: boolean;
  onProgress: (percent: number) => void;
  onEnded: () => void;
  onError: () => void;
}) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const mediaUrl = resolveStoryMediaUrl(src);
  const mimeType = inferCommunityAudioContentType(fileName ?? mediaUrl);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.load();
    void audio.play().catch(() => undefined);
  }, [mediaUrl]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (paused) {
      audio.pause();
    } else {
      void audio.play().catch(() => undefined);
    }
  }, [paused]);

  return (
    <div className="community-story-audio-slide">
      <div className="community-story-audio-visual" aria-hidden>
        <span className="community-story-audio-icon">♪</span>
        <p className="community-story-audio-label">Audio moment</p>
      </div>
      <audio
        ref={audioRef}
        key={mediaUrl}
        playsInline
        preload="auto"
        className="community-story-audio-element"
        onTimeUpdate={(event) => {
          const audio = event.currentTarget;
          if (!audio.duration || !Number.isFinite(audio.duration)) return;
          onProgress(Math.min(100, (audio.currentTime / audio.duration) * 100));
        }}
        onEnded={onEnded}
        onError={onError}
      >
        <source src={mediaUrl} type={mimeType} />
      </audio>
    </div>
  );
}

export function CommunityStoryViewer({
  decks,
  initialDeckIndex,
  initialSlideIndex = 0,
  currentUserId,
  onClose,
  onStoriesSeen,
  onStoryDeleted,
  onStatusReactionChange,
}: CommunityStoryViewerProps) {
  const [mounted, setMounted] = useState(false);
  const [deckIndex, setDeckIndex] = useState(initialDeckIndex);
  const [slideIndex, setSlideIndex] = useState(initialSlideIndex);
  const [progress, setProgress] = useState(0);
  const [paused, setPaused] = useState(false);
  const [mediaFailed, setMediaFailed] = useState(false);
  const [mediaErrorDetail, setMediaErrorDetail] = useState("");
  const [replyDraft, setReplyDraft] = useState("");
  const [replyBusy, setReplyBusy] = useState(false);
  const [replyNotice, setReplyNotice] = useState("");
  const [replyError, setReplyError] = useState("");
  const [replyFocused, setReplyFocused] = useState(false);
  const [reactionBusy, setReactionBusy] = useState(false);
  const [reactionError, setReactionError] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [soundOn, setSoundOn] = useState(false);
  const pausedRef = useRef(false);
  const elapsedRef = useRef(0);
  const startRef = useRef(Date.now());
  const seenThisSessionRef = useRef(new Set<string>());
  const dragStartYRef = useRef<number | null>(null);
  const holdTimerRef = useRef<number | null>(null);
  const didHoldRef = useRef(false);

  const deck = decks[deckIndex];
  const slide = deck?.items[slideIndex];
  const mediaUrl = slide ? resolveStoryMediaUrl(slide.mediaUrl) : "";
  const isOwnStory = deck?.authorId === currentUserId;
  const playbackPaused = paused || replyFocused;
  const nextService = useMemo(() => getNextWorshipService(), []);
  const reactionButtons = slide ? reactionButtonsForSlide(slide) : [];
  const goingCount = slide?.reactions?.coming ?? 0;
  const isServiceInvite = slide?.storyKind === "service_invite";

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    setDeckIndex(initialDeckIndex);
    setSlideIndex(initialSlideIndex);
  }, [initialDeckIndex, initialSlideIndex]);

  useEffect(() => {
    if (!mounted) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [mounted]);

  useEffect(() => {
    if (decks.length === 0) {
      onClose();
      return;
    }
    if (deckIndex >= decks.length) {
      setDeckIndex(Math.max(0, decks.length - 1));
      setSlideIndex(0);
      setProgress(0);
    }
  }, [deckIndex, decks.length, onClose]);

  useEffect(() => {
    if (!deck) return;
    if (slideIndex >= deck.items.length) {
      setSlideIndex(Math.max(0, deck.items.length - 1));
      setProgress(0);
    }
  }, [deck, slideIndex]);

  useEffect(() => {
    setReplyDraft("");
    setReplyNotice("");
    setReplyError("");
    setMediaFailed(false);
    setMediaErrorDetail("");
    setSoundOn(false);
  }, [slide?.id]);

  const markCurrentSeen = useCallback(() => {
    if (!slide) return;
    if (seenThisSessionRef.current.has(slide.id)) return;
    seenThisSessionRef.current.add(slide.id);
    onStoriesSeen?.([slide.id]);
  }, [onStoriesSeen, slide]);

  const goNext = useCallback(() => {
    if (!deck) return;
    markCurrentSeen();

    if (slideIndex < deck.items.length - 1) {
      setSlideIndex((current) => current + 1);
      setProgress(0);
      setMediaFailed(false);
      return;
    }

    if (deckIndex < decks.length - 1) {
      setDeckIndex((current) => current + 1);
      setSlideIndex(0);
      setProgress(0);
      setMediaFailed(false);
      return;
    }

    onClose();
  }, [deck, deckIndex, decks.length, markCurrentSeen, onClose, slideIndex]);

  const goPrev = useCallback(() => {
    markCurrentSeen();

    if (slideIndex > 0) {
      setSlideIndex((current) => current - 1);
      setProgress(0);
      setMediaFailed(false);
      return;
    }

    if (deckIndex > 0) {
      const previousDeck = decks[deckIndex - 1];
      setDeckIndex((current) => current - 1);
      setSlideIndex(Math.max(0, previousDeck.items.length - 1));
      setProgress(0);
      setMediaFailed(false);
      return;
    }

    setProgress(0);
  }, [deckIndex, decks, markCurrentSeen, slideIndex]);

  useEffect(() => {
    if (!slide || playbackPaused) return;
    if (
      slide.mediaType !== "image" &&
      slide.mediaType !== "text" &&
      slide.mediaType !== "link"
    ) {
      return;
    }
    if (slide.mediaType === "link") {
      return;
    }

    elapsedRef.current = 0;
    startRef.current = Date.now();
    setProgress(0);
    setMediaFailed(false);

    let frame = 0;
    const tick = () => {
      if (!pausedRef.current) {
        const elapsed = elapsedRef.current + (Date.now() - startRef.current);
        const nextProgress = Math.min(100, (elapsed / STORY_IMAGE_MS) * 100);
        setProgress(nextProgress);
        if (nextProgress >= 100) {
          goNext();
          return;
        }
      }
      frame = window.requestAnimationFrame(tick);
    };

    frame = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(frame);
  }, [deckIndex, goNext, playbackPaused, slide, slideIndex]);

  useEffect(() => {
    if (!slide) return;
    const timer = window.setTimeout(() => markCurrentSeen(), 400);
    return () => window.clearTimeout(timer);
  }, [markCurrentSeen, slide]);

  useEffect(() => {
    if (!mounted) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
      if (event.key === "ArrowRight") goNext();
      if (event.key === "ArrowLeft") goPrev();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [goNext, goPrev, mounted, onClose]);

  function pausePlayback() {
    pausedRef.current = true;
    setPaused(true);
    elapsedRef.current += Date.now() - startRef.current;
  }

  function resumePlayback() {
    pausedRef.current = false;
    setPaused(false);
    startRef.current = Date.now();
  }

  function clearHoldTimer() {
    if (holdTimerRef.current != null) {
      window.clearTimeout(holdTimerRef.current);
      holdTimerRef.current = null;
    }
  }

  function handleMediaPointerDown() {
    didHoldRef.current = false;
    clearHoldTimer();
    holdTimerRef.current = window.setTimeout(() => {
      didHoldRef.current = true;
      pausePlayback();
    }, 220);
  }

  function handleMediaPointerUp(event: React.PointerEvent<HTMLDivElement>) {
    clearHoldTimer();
    if (didHoldRef.current) {
      didHoldRef.current = false;
      resumePlayback();
      return;
    }

    const rect = event.currentTarget.getBoundingClientRect();
    const x = event.clientX - rect.left;
    if (x < rect.width * 0.25) {
      goPrev();
    } else {
      goNext();
    }
  }

  async function toggleReaction(kind: CommunityStoryReactionKind) {
    if (!slide || isOwnStory || reactionBusy) return;
    setReactionBusy(true);
    setReactionError("");
    try {
      const response = await fetch(`/api/community/statuses/${encodeURIComponent(slide.id)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind }),
      });
      const data = await readJsonResponse<{
        error?: string;
        reactions?: NonNullable<CommunityStatus["reactions"]>;
        viewerReactions?: CommunityStoryReactionKind[];
      }>(response);
      if (!response.ok || !data.reactions) {
        setReactionError(data.error ?? "Could not react.");
        return;
      }
      onStatusReactionChange?.(slide.id, data.reactions, data.viewerReactions ?? []);
    } catch (error) {
      setReactionError(error instanceof Error ? error.message : "Could not react.");
    } finally {
      setReactionBusy(false);
    }
  }

  async function deleteCurrentStory() {
    if (!slide || !isOwnStory || deleting) return;
    if (!window.confirm("Delete this story?")) return;

    setDeleting(true);
    try {
      const response = await fetch(`/api/community/statuses/${encodeURIComponent(slide.id)}`, {
        method: "DELETE",
      });
      const data = await readJsonResponse<{ error?: string }>(response);
      if (!response.ok) {
        setReplyError(data.error ?? "Could not delete story.");
        return;
      }

      onStoryDeleted?.(slide.id);

      const remainingInDeck = deck.items.length - 1;
      if (remainingInDeck <= 0) {
        if (decks.length <= 1) {
          onClose();
          return;
        }
        if (deckIndex >= decks.length - 1) {
          setDeckIndex((current) => Math.max(0, current - 1));
          setSlideIndex(0);
        }
        setProgress(0);
        setMediaFailed(false);
        return;
      }

      if (slideIndex >= remainingInDeck) {
        setSlideIndex(Math.max(0, remainingInDeck - 1));
      }
      setProgress(0);
      setMediaFailed(false);
    } catch (deleteError) {
      setReplyError(
        deleteError instanceof Error ? deleteError.message : "Could not delete story.",
      );
    } finally {
      setDeleting(false);
    }
  }

  async function sendStoryReply(event: React.FormEvent) {
    event.preventDefault();
    if (!deck || !slide || isOwnStory || replyBusy) return;

    const message = replyDraft.trim();
    if (!message) return;

    setReplyBusy(true);
    setReplyError("");
    setReplyNotice("");
    pausePlayback();

    try {
      const response = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recipientId: deck.authorId,
          recipientName: deck.authorName,
          content: `Replied to your story: ${message}`,
        }),
      });
      const data = await readJsonResponse<{ error?: string }>(response);
      if (!response.ok) {
        setReplyError(data.error ?? "Could not send reply.");
        resumePlayback();
        return;
      }

      setReplyDraft("");
      setReplyNotice("Reply sent");
      window.setTimeout(() => setReplyNotice(""), 2500);
      resumePlayback();
    } catch (replyError) {
      setReplyError(replyError instanceof Error ? replyError.message : "Could not send reply.");
      resumePlayback();
    } finally {
      setReplyBusy(false);
    }
  }

  if (!mounted || !deck || !slide) return null;

  return createPortal(
    <div
      className="community-story-viewer"
      onTouchStart={(event) => {
        dragStartYRef.current = event.touches[0]?.clientY ?? null;
      }}
      onTouchMove={(event) => {
        const startY = dragStartYRef.current;
        const currentY = event.touches[0]?.clientY;
        if (startY == null || currentY == null) return;
        if (currentY - startY > 80) {
          dragStartYRef.current = null;
          onClose();
        }
      }}
      onTouchEnd={() => {
        dragStartYRef.current = null;
      }}
    >
      <div className="community-story-viewer-progress">
        {deck.items.map((item, index) => (
          <div key={item.id} className="community-story-viewer-progress-track">
            <div
              className="community-story-viewer-progress-fill"
              style={{
                width:
                  index < slideIndex ? "100%" : index === slideIndex ? `${progress}%` : "0%",
              }}
            />
          </div>
        ))}
      </div>

      <div className="community-story-viewer-header">
        <CommunityAvatar name={deck.authorName} authorId={deck.authorId} size="md" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-white">{deck.authorName}</p>
          <p className="text-xs text-white/70">{formatCommunityTimeAgo(slide.createdAt)}</p>
        </div>
        {isOwnStory ? (
          <button
            type="button"
            onClick={() => void deleteCurrentStory()}
            disabled={deleting}
            className="rounded-full p-2 text-white/90 hover:bg-white/10 disabled:opacity-50"
            aria-label="Delete story"
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
              <path
                fill="currentColor"
                d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"
              />
            </svg>
          </button>
        ) : null}
        {slide.mediaType === "video" ? (
          <button
            type="button"
            onClick={() => setSoundOn((current) => !current)}
            className="rounded-full p-2 text-white/90 hover:bg-white/10"
            aria-label={soundOn ? "Mute video" : "Turn on sound"}
            aria-pressed={soundOn}
          >
            {soundOn ? (
              <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
                <path
                  fill="currentColor"
                  d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.06c1.48-.74 2.5-2.26 2.5-4.03zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"
                />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
                <path
                  fill="currentColor"
                  d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3 3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4 9.91 6.09 12 8.18V4z"
                />
              </svg>
            )}
          </button>
        ) : null}
        <button
          type="button"
          onClick={onClose}
          className="rounded-full p-2 text-white/90 hover:bg-white/10"
          aria-label="Close stories"
        >
          <svg viewBox="0 0 24 24" className="h-6 w-6" aria-hidden="true">
            <path
              fill="currentColor"
              d="M18.3 5.71a.996.996 0 0 0-1.41 0L12 10.59 7.11 5.7A.996.996 0 1 0 5.7 7.11L10.59 12 5.7 16.89a.996.996 0 1 0 1.41 1.41L12 13.41l4.89 4.89a.996.996 0 0 0 1.41-1.41L13.41 12l4.89-4.89c.38-.38.38-1.02 0-1.4z"
            />
          </svg>
        </button>
      </div>

      <div className="community-story-viewer-media">
        {mediaFailed ? (
          <div className="flex h-full flex-col items-center justify-center gap-3 px-6 text-center text-white">
            <p className="text-sm text-white/80">
              {mediaErrorDetail || "This story could not be loaded."}
            </p>
            {mediaUrl ? (
              <a
                href={mediaUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-full bg-white/15 px-4 py-2 text-sm font-semibold text-white"
              >
                Open media
              </a>
            ) : null}
          </div>
        ) : slide.mediaType === "text" ? (
          <div
            className={`community-story-text-slide ${isServiceInvite ? "community-story-text-slide-service" : ""}`}
          >
            {isServiceInvite ? (
              <>
                <p className="community-story-text-slide-kicker">Worship together</p>
                <p className="community-story-text-slide-service-time">{nextService.scheduleLabel}</p>
                {goingCount > 0 ? (
                  <p className="community-story-text-slide-going">
                    {goingCount} {goingCount === 1 ? "person is" : "people are"} going
                  </p>
                ) : null}
              </>
            ) : null}
            <p className="community-story-text-slide-body">{slide.caption ?? ""}</p>
          </div>
        ) : slide.mediaType === "link" ? (
          <StorySlideLink
            slide={slide}
            paused={playbackPaused}
            onProgress={setProgress}
            onAdvance={goNext}
          />
        ) : slide.mediaType === "video" ? (
          <StorySlideVideo
            src={slide.mediaUrl}
            fileName={slide.mediaUrl}
            paused={playbackPaused}
            muted={!soundOn}
            onProgress={setProgress}
            onEnded={goNext}
            onError={(detail) => {
              setMediaErrorDetail(detail ?? "");
              setMediaFailed(true);
            }}
          />
        ) : slide.mediaType === "audio" ? (
          <StorySlideAudio
            src={slide.mediaUrl}
            fileName={slide.mediaUrl}
            paused={playbackPaused}
            onProgress={setProgress}
            onEnded={goNext}
            onError={() => setMediaFailed(true)}
          />
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={mediaUrl}
            alt=""
            className="h-full w-full object-contain"
            onError={() => setMediaFailed(true)}
          />
        )}

        {slide.mediaType !== "link" ? (
        <div
          className="community-story-viewer-tap-layer"
          onPointerDown={handleMediaPointerDown}
          onPointerUp={handleMediaPointerUp}
          onPointerCancel={() => {
            clearHoldTimer();
            if (didHoldRef.current) {
              didHoldRef.current = false;
              resumePlayback();
            }
          }}
          onPointerLeave={() => {
            clearHoldTimer();
            if (didHoldRef.current) {
              didHoldRef.current = false;
              resumePlayback();
            }
          }}
        />
        ) : (
          <>
            <button
              type="button"
              className="community-story-link-nav community-story-link-nav-prev"
              aria-label="Previous story"
              onClick={goPrev}
            />
            <button
              type="button"
              className="community-story-link-nav community-story-link-nav-next"
              aria-label="Next story"
              onClick={goNext}
            />
          </>
        )}
      </div>

      {slide.caption && slide.mediaType !== "text" ? (
        <p className="community-story-viewer-caption">{slide.caption}</p>
      ) : null}

      {!isOwnStory && slide ? (
        <div className="community-story-viewer-reactions">
          {reactionButtons.map((button) => {
            const active = slide.viewerReactions?.includes(button.kind);
            const count = slide.reactions?.[button.kind] ?? 0;
            return (
              <button
                key={button.kind}
                type="button"
                disabled={reactionBusy}
                onClick={() => void toggleReaction(button.kind)}
                className={`community-story-reaction-btn ${active ? "community-story-reaction-btn-active" : ""}`}
              >
                <span aria-hidden>{button.emoji}</span>
                <span>{button.label}</span>
                {count > 0 ? <span className="community-story-reaction-count">{count}</span> : null}
              </button>
            );
          })}
        </div>
      ) : null}

      {reactionError ? (
        <p className="community-story-viewer-feedback">{reactionError}</p>
      ) : null}

      {replyError ? <p className="community-story-viewer-feedback">{replyError}</p> : null}
      {replyNotice ? (
        <p className="community-story-viewer-feedback community-story-viewer-feedback-success">
          {replyNotice}
        </p>
      ) : null}

      {!isOwnStory ? (
        <form className="community-story-viewer-reply" onSubmit={(event) => void sendStoryReply(event)}>
          <input
            type="text"
            value={replyDraft}
            onChange={(event) => setReplyDraft(event.target.value)}
            onFocus={() => {
              setReplyFocused(true);
              pausePlayback();
            }}
            onBlur={() => {
              setReplyFocused(false);
              if (!replyDraft.trim()) resumePlayback();
            }}
            placeholder={`Reply to ${deck.authorName.split(" ")[0] ?? deck.authorName}…`}
            maxLength={500}
            className="community-story-viewer-reply-input"
            disabled={replyBusy}
          />
          <button
            type="submit"
            disabled={replyBusy || !replyDraft.trim()}
            className="community-story-viewer-reply-send"
          >
            Send
          </button>
        </form>
      ) : null}
    </div>,
    document.body,
  );
}
