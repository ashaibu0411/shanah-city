"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { CommunityAvatar } from "@/components/community/CommunityAvatar";
import { formatCommunityTimeAgo } from "@/lib/community-ui-utils";
import { inferCommunityAudioContentType } from "@/lib/community-media-shared";
import { readJsonResponse } from "@/lib/read-json-response";
import {
  COMMUNITY_STORY_REACTION_KINDS,
  instagramFloatingQuickReactionButtonsForStory,
  reactionButtonsForStory,
  reactionMeta,
  totalStoryReactionCount,
} from "@/lib/community-story-reactions";
import type { CommunityStatus, CommunityStoryReactionKind } from "@/lib/member-types";
import { getNextWorshipService } from "@/lib/community-worship-service";
import {
  findDeckIndex,
  resolveStoryMediaUrl,
  STORY_IMAGE_MS,
  type StoryDeck,
} from "@/lib/community-story-utils";
import { storyReplyPresetsForKind } from "@/lib/community-story-reply-presets";
import { StorySlideLink } from "@/components/community/StorySlideLink";
import { CommunityLivePlayer } from "@/components/community/CommunityLivePlayer";

type StoryInsightsPayload = {
  reactions: {
    userId: string;
    name: string;
    kind: CommunityStoryReactionKind;
    createdAt: string;
  }[];
  replies: {
    id: string;
    authorId: string;
    authorName: string;
    content: string;
    createdAt: string;
  }[];
};

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
      className="h-full w-full object-cover"
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
  const [activeAuthorId, setActiveAuthorId] = useState(
    () => decks[initialDeckIndex]?.authorId ?? "",
  );
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
  const [showInsights, setShowInsights] = useState(false);
  const [insightsLoading, setInsightsLoading] = useState(false);
  const [insightsError, setInsightsError] = useState("");
  const [insightsData, setInsightsData] = useState<StoryInsightsPayload | null>(null);
  const pausedRef = useRef(false);
  const elapsedRef = useRef(0);
  const startRef = useRef(Date.now());
  const seenThisSessionRef = useRef(new Set<string>());
  const dragStartYRef = useRef<number | null>(null);
  const holdTimerRef = useRef<number | null>(null);
  const didHoldRef = useRef(false);
  const slideIndexRef = useRef(initialSlideIndex);
  const activeAuthorIdRef = useRef(activeAuthorId);
  const navBusyRef = useRef(false);

  /** Deck order frozen for this viewing session so marking seen does not reorder mid-playback. */
  const sessionAuthorOrder = useMemo(
    () => decks.map((entry) => entry.authorId),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- capture order only when viewer opens
    [],
  );

  const navigationDecks = useMemo(() => {
    const liveByAuthor = new Map(decks.map((entry) => [entry.authorId, entry]));
    return sessionAuthorOrder
      .map((authorId) => liveByAuthor.get(authorId))
      .filter((entry): entry is StoryDeck => Boolean(entry));
  }, [decks, sessionAuthorOrder]);

  const deckIndex = useMemo(
    () => (activeAuthorId ? findDeckIndex(navigationDecks, activeAuthorId) : -1),
    [activeAuthorId, navigationDecks],
  );
  const deck = deckIndex >= 0 ? navigationDecks[deckIndex] : undefined;
  const slide = deck?.items[slideIndex];
  const mediaUrl = slide ? resolveStoryMediaUrl(slide.mediaUrl) : "";
  const isOwnStory = deck?.authorId === currentUserId;
  const playbackPaused = paused || replyFocused;
  const nextService = useMemo(() => getNextWorshipService(), []);
  const reactionButtons = slide ? reactionButtonsForStory(slide.storyKind) : [];
  const floatingQuickReactions = slide
    ? instagramFloatingQuickReactionButtonsForStory(slide.storyKind)
    : [];
  const replyPresets = slide ? storyReplyPresetsForKind(slide.storyKind) : [];
  const goingCount = slide?.reactions?.coming ?? 0;
  const isServiceInvite = slide?.storyKind === "service_invite";
  const totalResponseCount = useMemo(
    () => totalStoryReactionCount(slide?.reactions),
    [slide?.reactions],
  );

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    slideIndexRef.current = slideIndex;
  }, [slideIndex]);

  useEffect(() => {
    activeAuthorIdRef.current = activeAuthorId;
  }, [activeAuthorId]);

  useEffect(() => {
    if (!mounted) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [mounted]);

  useEffect(() => {
    if (navigationDecks.length === 0) {
      onClose();
      return;
    }
    if (activeAuthorId && deckIndex < 0) {
      onClose();
    }
  }, [activeAuthorId, deckIndex, navigationDecks.length, onClose]);

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
    setShowInsights(false);
    setInsightsData(null);
    setInsightsError("");
  }, [slide?.id]);

  const markCurrentSeen = useCallback(() => {
    if (!slide) return;
    if (seenThisSessionRef.current.has(slide.id)) return;
    seenThisSessionRef.current.add(slide.id);
    onStoriesSeen?.([slide.id]);
  }, [onStoriesSeen, slide]);

  const goNext = useCallback(() => {
    if (navBusyRef.current) return;
    navBusyRef.current = true;
    window.setTimeout(() => {
      navBusyRef.current = false;
    }, 320);

    const authorId = activeAuthorIdRef.current;
    const dIdx = findDeckIndex(navigationDecks, authorId);
    if (dIdx < 0) {
      onClose();
      return;
    }

    const currentDeck = navigationDecks[dIdx];
    markCurrentSeen();
    const sIdx = slideIndexRef.current;

    if (sIdx < currentDeck.items.length - 1) {
      const next = sIdx + 1;
      slideIndexRef.current = next;
      setSlideIndex(next);
      setProgress(0);
      setMediaFailed(false);
      return;
    }

    if (dIdx < navigationDecks.length - 1) {
      const nextDeck = navigationDecks[dIdx + 1];
      slideIndexRef.current = 0;
      activeAuthorIdRef.current = nextDeck.authorId;
      setActiveAuthorId(nextDeck.authorId);
      setSlideIndex(0);
      setProgress(0);
      setMediaFailed(false);
      return;
    }

    onClose();
  }, [markCurrentSeen, navigationDecks, onClose]);

  const goPrev = useCallback(() => {
    if (navBusyRef.current) return;
    navBusyRef.current = true;
    window.setTimeout(() => {
      navBusyRef.current = false;
    }, 320);

    markCurrentSeen();
    const authorId = activeAuthorIdRef.current;
    const dIdx = findDeckIndex(navigationDecks, authorId);
    if (dIdx < 0) return;

    const sIdx = slideIndexRef.current;

    if (sIdx > 0) {
      const next = sIdx - 1;
      slideIndexRef.current = next;
      setSlideIndex(next);
      setProgress(0);
      setMediaFailed(false);
      return;
    }

    if (dIdx > 0) {
      const previousDeck = navigationDecks[dIdx - 1];
      const nextSlide = Math.max(0, previousDeck.items.length - 1);
      slideIndexRef.current = nextSlide;
      activeAuthorIdRef.current = previousDeck.authorId;
      setActiveAuthorId(previousDeck.authorId);
      setSlideIndex(nextSlide);
      setProgress(0);
      setMediaFailed(false);
      return;
    }

    setProgress(0);
  }, [markCurrentSeen, navigationDecks]);

  useEffect(() => {
    if (!slide || playbackPaused) return;
    if (slide.mediaType === "live") {
      setProgress(100);
      return;
    }
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
  }, [goNext, playbackPaused, slide?.id, slide?.mediaType, slideIndex]);

  useEffect(() => {
    if (!slide) return;
    const timer = window.setTimeout(() => markCurrentSeen(), 400);
    return () => window.clearTimeout(timer);
  }, [markCurrentSeen, slide]);

  const closeStoryInsights = useCallback(() => {
    setShowInsights(false);
    if (!replyFocused) {
      resumePlayback();
    }
  }, [replyFocused]);

  useEffect(() => {
    if (!mounted) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        if (showInsights) {
          closeStoryInsights();
          return;
        }
        onClose();
      }
      if (event.key === "ArrowRight") goNext();
      if (event.key === "ArrowLeft") goPrev();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [closeStoryInsights, goNext, goPrev, mounted, onClose, showInsights]);

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
    const ratio = x / rect.width;
    if (ratio < 0.33) {
      goPrev();
    } else if (ratio > 0.66) {
      goNext();
    }
  }

  async function loadStoryInsights() {
    if (!slide || !isOwnStory) return;
    setInsightsLoading(true);
    setInsightsError("");
    try {
      const response = await fetch(
        `/api/community/statuses/${encodeURIComponent(slide.id)}/insights`,
        { cache: "no-store" },
      );
      const data = await readJsonResponse<StoryInsightsPayload & { error?: string }>(response);
      if (!response.ok) {
        setInsightsError(data.error ?? "Could not load responses.");
        setInsightsData(null);
        return;
      }
      setInsightsData({
        reactions: data.reactions ?? [],
        replies: data.replies ?? [],
      });
    } catch (error) {
      setInsightsError(error instanceof Error ? error.message : "Could not load responses.");
      setInsightsData(null);
    } finally {
      setInsightsLoading(false);
    }
  }

  async function openStoryInsights() {
    if (!slide || !isOwnStory) return;
    pausePlayback();
    setShowInsights(true);
    await loadStoryInsights();
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
        if (navigationDecks.length <= 1) {
          onClose();
          return;
        }
        const dIdx = findDeckIndex(navigationDecks, activeAuthorIdRef.current);
        if (dIdx >= navigationDecks.length - 1) {
          const fallback = navigationDecks[Math.max(0, dIdx - 1)];
          if (fallback) {
            slideIndexRef.current = 0;
            activeAuthorIdRef.current = fallback.authorId;
            setActiveAuthorId(fallback.authorId);
            setSlideIndex(0);
          }
        }
        setProgress(0);
        setMediaFailed(false);
        return;
      }

      const sIdx = slideIndexRef.current;
      if (sIdx >= remainingInDeck) {
        const nextSlide = Math.max(0, remainingInDeck - 1);
        slideIndexRef.current = nextSlide;
        setSlideIndex(nextSlide);
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

  async function sendStoryReplyMessage(message: string) {
    if (!deck || !slide || isOwnStory || replyBusy) return;

    const trimmed = message.trim();
    if (!trimmed) return;

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
          content: `Replied to your story: ${trimmed}`,
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

  async function sendStoryReply(event: React.FormEvent) {
    event.preventDefault();
    await sendStoryReplyMessage(replyDraft);
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
          <>
            <button
              type="button"
              onClick={() => void openStoryInsights()}
              className="rounded-full px-2.5 py-1.5 text-xs font-semibold text-white/95 hover:bg-white/10"
              aria-label="View story responses"
            >
              Responses{totalResponseCount > 0 ? ` · ${totalResponseCount}` : ""}
            </button>
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
          </>
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
                  isOwnStory ? (
                    <button
                      type="button"
                      onClick={() => void openStoryInsights()}
                      className="community-story-text-slide-going community-story-text-slide-going-btn"
                    >
                      {goingCount} {goingCount === 1 ? "person is" : "people are"} going · tap to see who
                    </button>
                  ) : (
                    <p className="community-story-text-slide-going">
                      {goingCount} {goingCount === 1 ? "person is" : "people are"} going
                    </p>
                  )
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
        ) : slide.mediaType === "live" ? (
          <CommunityLivePlayer
            statusId={slide.id}
            authorName={deck?.authorName ?? slide.authorName}
            paused={playbackPaused}
            onLiveEnded={() => {
              setMediaFailed(false);
              goNext();
            }}
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
            className="h-full w-full object-cover"
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
        <div className="community-story-viewer-compose">
          {replyFocused ? (
            <div
              className="community-story-quick-reactions community-story-quick-reactions-floating"
              role="toolbar"
              aria-label="Quick reactions"
            >
              {floatingQuickReactions.map((button) => {
                const active = slide.viewerReactions?.includes(button.kind);
                return (
                  <button
                    key={button.kind}
                    type="button"
                    disabled={reactionBusy}
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => void toggleReaction(button.kind)}
                    className={`community-story-quick-reaction-btn ${active ? "community-story-quick-reaction-btn-active" : ""}`}
                    aria-label={button.label}
                    aria-pressed={active}
                  >
                    <span aria-hidden>{button.emoji}</span>
                  </button>
                );
              })}
            </div>
          ) : null}
          <div
            className="community-story-reply-presets"
            role="toolbar"
            aria-label="Quick replies"
          >
            {replyPresets.map((preset) => (
              <button
                key={preset.id}
                type="button"
                disabled={replyBusy}
                className="community-story-reply-preset-btn"
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => void sendStoryReplyMessage(preset.message)}
              >
                {preset.label}
              </button>
            ))}
          </div>
          <form className="community-story-viewer-reply" onSubmit={(event) => void sendStoryReply(event)}>
            <div className="community-story-viewer-reply-field">
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
                placeholder="Send message"
                maxLength={500}
                className="community-story-viewer-reply-input"
                disabled={replyBusy}
                autoComplete="off"
              />
              {replyDraft.trim() ? (
                <button
                  type="submit"
                  disabled={replyBusy}
                  className="community-story-viewer-reply-send-icon"
                  aria-label="Send message"
                >
                  <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
                    <path fill="currentColor" d="M2.01 21 23 12 2.01 3 2 10l15 2-15 2z" />
                  </svg>
                </button>
              ) : (
                <button
                  type="button"
                  disabled={reactionBusy}
                  className="community-story-viewer-reply-heart"
                  aria-label="React with love"
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => void toggleReaction("love")}
                >
                  <svg viewBox="0 0 24 24" className="h-6 w-6" aria-hidden="true">
                    <path
                      fill={
                        slide.viewerReactions?.includes("love") ? "currentColor" : "none"
                      }
                      stroke="currentColor"
                      strokeWidth="1.75"
                      d="M16.5 3c-1.74 0-3.41 1.01-4.5 2.09C10.91 4.01 9.24 3 7.5 3 4.42 3 2 5.42 2 8.5c0 3.78 3.4 6.86 8.55 11.54L12 21.35l1.45-1.32C18.6 15.36 22 12.28 22 8.5 22 5.42 19.58 3 16.5 3z"
                    />
                  </svg>
                </button>
              )}
            </div>
          </form>
        </div>
      ) : null}

      {isOwnStory && slide ? (
        <div className="community-story-viewer-author-bar">
          {reactionButtons
            .filter((button) => (slide.reactions?.[button.kind] ?? 0) > 0)
            .map((button) => {
            const count = slide.reactions?.[button.kind] ?? 0;
            return (
              <button
                key={button.kind}
                type="button"
                onClick={() => void openStoryInsights()}
                className="community-story-author-stat"
                disabled={insightsLoading && showInsights}
              >
                <span aria-hidden>{button.emoji}</span>
                <span className="community-story-reaction-count">{count}</span>
              </button>
            );
          })}
          <button
            type="button"
            onClick={() => void openStoryInsights()}
            className="community-story-author-view-all"
            disabled={insightsLoading && showInsights}
          >
            {insightsLoading && showInsights ? "Loading…" : "See who responded"}
          </button>
        </div>
      ) : null}

      {showInsights && isOwnStory && slide ? (
        <div
          className="community-story-insights-backdrop"
          role="presentation"
          onClick={closeStoryInsights}
        >
          <div
            className="community-story-insights-sheet"
            role="dialog"
            aria-label="Story responses"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="community-story-insights-header">
              <h2 className="community-story-insights-title">Responses</h2>
              <button
                type="button"
                onClick={closeStoryInsights}
                className="community-story-insights-close"
                aria-label="Close responses"
              >
                ×
              </button>
            </div>

            {insightsLoading ? (
              <p className="community-story-insights-status">Loading…</p>
            ) : insightsError ? (
              <p className="community-story-insights-error">{insightsError}</p>
            ) : insightsData &&
              insightsData.reactions.length === 0 &&
              insightsData.replies.length === 0 ? (
              <p className="community-story-insights-status">No responses yet.</p>
            ) : insightsData ? (
              <div className="community-story-insights-body">
                {COMMUNITY_STORY_REACTION_KINDS.map((kind) => {
                  const rows = insightsData.reactions.filter((row) => row.kind === kind);
                  if (rows.length === 0) return null;
                  const meta = reactionMeta(kind);
                  return (
                    <section key={kind} className="community-story-insights-section">
                      <h3 className="community-story-insights-section-title">
                        <span aria-hidden>{meta.emoji}</span>
                        {meta.label}
                        <span className="community-story-insights-section-count">{rows.length}</span>
                      </h3>
                      <ul className="community-story-insights-list">
                        {rows.map((row) => (
                          <li key={`${row.userId}-${row.kind}-${row.createdAt}`}>
                            <span className="community-story-insights-name">{row.name}</span>
                            <span className="community-story-insights-time">
                              {formatCommunityTimeAgo(row.createdAt)}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </section>
                  );
                })}
                {insightsData.replies.length > 0 ? (
                  <section className="community-story-insights-section">
                    <h3 className="community-story-insights-section-title">
                      Replies
                      <span className="community-story-insights-section-count">
                        {insightsData.replies.length}
                      </span>
                    </h3>
                    <ul className="community-story-insights-list community-story-insights-replies">
                      {insightsData.replies.map((reply) => (
                        <li key={reply.id}>
                          <p className="community-story-insights-reply-meta">
                            <span className="community-story-insights-name">{reply.authorName}</span>
                            <span className="community-story-insights-time">
                              {formatCommunityTimeAgo(reply.createdAt)}
                            </span>
                          </p>
                          <p className="community-story-insights-reply-body">{reply.content}</p>
                        </li>
                      ))}
                    </ul>
                  </section>
                ) : null}
              </div>
            ) : null}
          </div>
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
    </div>,
    document.body,
  );
}
