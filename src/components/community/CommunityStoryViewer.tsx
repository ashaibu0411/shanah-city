"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { CommunityAvatar } from "@/components/community/CommunityAvatar";
import { formatCommunityTimeAgo } from "@/lib/community-ui-utils";
import { inferCommunityVideoContentType } from "@/lib/community-media-shared";
import { readJsonResponse } from "@/lib/read-json-response";
import {
  resolveStoryMediaUrl,
  STORY_IMAGE_MS,
  type StoryDeck,
} from "@/lib/community-story-utils";

type CommunityStoryViewerProps = {
  decks: StoryDeck[];
  initialDeckIndex: number;
  initialSlideIndex?: number;
  currentUserId: string;
  onClose: () => void;
  onStoriesSeen?: (statusIds: string[]) => void;
  onStoryDeleted?: (statusId: string) => void;
};

function StorySlideVideo({
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
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const mediaUrl = resolveStoryMediaUrl(src);
  const mimeType = inferCommunityVideoContentType(fileName ?? mediaUrl);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    video.load();
    void video.play().catch(() => undefined);
  }, [mediaUrl]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    if (paused) {
      video.pause();
    } else {
      void video.play().catch(() => undefined);
    }
  }, [paused]);

  return (
    <video
      ref={videoRef}
      key={mediaUrl}
      playsInline
      muted
      autoPlay
      preload="auto"
      className="h-full w-full object-contain"
      onTimeUpdate={(event) => {
        const video = event.currentTarget;
        if (!video.duration || !Number.isFinite(video.duration)) return;
        onProgress(Math.min(100, (video.currentTime / video.duration) * 100));
      }}
      onEnded={onEnded}
      onError={onError}
    >
      <source src={mediaUrl} type={mimeType} />
    </video>
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
}: CommunityStoryViewerProps) {
  const [mounted, setMounted] = useState(false);
  const [deckIndex, setDeckIndex] = useState(initialDeckIndex);
  const [slideIndex, setSlideIndex] = useState(initialSlideIndex);
  const [progress, setProgress] = useState(0);
  const [paused, setPaused] = useState(false);
  const [mediaFailed, setMediaFailed] = useState(false);
  const [replyDraft, setReplyDraft] = useState("");
  const [replyBusy, setReplyBusy] = useState(false);
  const [replyNotice, setReplyNotice] = useState("");
  const [replyError, setReplyError] = useState("");
  const [replyFocused, setReplyFocused] = useState(false);
  const [deleting, setDeleting] = useState(false);
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
    if (!slide || slide.mediaType !== "image" || playbackPaused) return;

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
            <p className="text-sm text-white/80">This story could not be loaded.</p>
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
        ) : slide.mediaType === "video" ? (
          <StorySlideVideo
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
      </div>

      {slide.caption ? (
        <p className="community-story-viewer-caption">{slide.caption}</p>
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
