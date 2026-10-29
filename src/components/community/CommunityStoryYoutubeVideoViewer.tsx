"use client";

import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { getYouTubeStoryVisibleEmbedSrc, getYouTubeWatchUrlWithSegment } from "@/lib/worship-youtube-timestamp-utils";
import { openExternalUrl } from "@/lib/native-app";

type CommunityStoryYoutubeVideoViewerProps = {
  open: boolean;
  onClose: () => void;
  videoId: string;
  title: string;
  artist: string;
  startSeconds?: number | null;
  soundOn: boolean;
  /** Story photo shown above the player — not covered by the embed. */
  storyPhotoUrl?: string | null;
  embedUnavailable?: boolean;
};

export function CommunityStoryYoutubeVideoViewer({
  open,
  onClose,
  videoId,
  title,
  artist,
  startSeconds,
  soundOn,
  storyPhotoUrl,
  embedUnavailable = false,
}: CommunityStoryYoutubeVideoViewerProps) {
  const [mounted, setMounted] = useState(false);
  const [origin, setOrigin] = useState("");

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setOrigin(window.location.origin);
    }
  }, []);

  useEffect(() => {
    if (!open) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.stopPropagation();
        onClose();
      }
    }
    window.addEventListener("keydown", onKeyDown, true);
    return () => window.removeEventListener("keydown", onKeyDown, true);
  }, [open, onClose]);

  const embedSrc = useMemo(() => {
    if (!videoId.trim() || embedUnavailable) return "";
    return getYouTubeStoryVisibleEmbedSrc(
      videoId,
      { paused: false, soundOn },
      startSeconds ?? undefined,
      origin || undefined,
    );
  }, [embedUnavailable, origin, soundOn, startSeconds, videoId]);

  const watchUrl = useMemo(
    () => getYouTubeWatchUrlWithSegment(videoId, startSeconds ?? undefined, undefined),
    [startSeconds, videoId],
  );

  if (!mounted || !open) return null;

  return createPortal(
    <div
      className="community-story-youtube-viewer"
      role="dialog"
      aria-modal="true"
      aria-label={`YouTube gospel video: ${title}`}
    >
      <div className="community-story-youtube-viewer-panel">
        <header className="community-story-youtube-viewer-header">
          <button type="button" className="community-story-youtube-viewer-back" onClick={onClose}>
            Back to Story
          </button>
          <p className="community-story-youtube-viewer-kicker">Gospel music video · YouTube</p>
          <h2 className="community-story-youtube-viewer-title">{title}</h2>
          {artist ? <p className="community-story-youtube-viewer-artist">{artist}</p> : null}
        </header>

        {storyPhotoUrl?.trim() ? (
          <div className="community-story-youtube-viewer-photo-wrap">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={storyPhotoUrl} alt="" className="community-story-youtube-viewer-photo" />
          </div>
        ) : null}

        <div className="community-story-youtube-viewer-player-wrap">
          {embedSrc ? (
            <iframe
              title={`YouTube video: ${title}`}
              src={embedSrc}
              className="community-story-youtube-viewer-iframe"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
              referrerPolicy="strict-origin-when-cross-origin"
            />
          ) : (
            <div className="community-story-youtube-viewer-fallback">
              <p>This video cannot be embedded here. You can watch it on YouTube instead.</p>
              <button
                type="button"
                className="community-story-youtube-viewer-open-external"
                onClick={() => void openExternalUrl(watchUrl)}
              >
                Open in YouTube
              </button>
            </div>
          )}
        </div>

        <footer className="community-story-youtube-viewer-footer">
          <p className="community-story-youtube-viewer-attribution">
            Video hosted by YouTube. Use YouTube&apos;s player controls for playback.
          </p>
          {embedSrc ? (
            <button
              type="button"
              className="community-story-youtube-viewer-open-link"
              onClick={() => void openExternalUrl(watchUrl)}
            >
              Open in YouTube
            </button>
          ) : null}
        </footer>
      </div>
    </div>,
    document.body,
  );
}
