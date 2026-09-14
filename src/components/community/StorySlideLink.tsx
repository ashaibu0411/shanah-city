"use client";

import { useEffect, useState } from "react";
import {
  parseStoryLinkFromStatus,
  storySocialPlatformLabel,
} from "@/lib/community-story-link-shared";
import { readJsonResponse } from "@/lib/read-json-response";
import type { CommunityStatus } from "@/lib/member-types";
import { STORY_LINK_MS } from "@/lib/community-story-utils";

type StoryLinkPreview = import("@/lib/community-story-link-preview-server").StoryLinkPreview;

type StorySlideLinkProps = {
  slide: CommunityStatus;
  paused: boolean;
  onProgress: (percent: number) => void;
  onAdvance: () => void;
};

export function StorySlideLink({ slide, paused, onProgress, onAdvance }: StorySlideLinkProps) {
  const linkMeta = parseStoryLinkFromStatus(slide.mediaType, slide.mediaUrl);
  const [preview, setPreview] = useState<StoryLinkPreview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!linkMeta) {
      setLoading(false);
      setError("Invalid link.");
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError("");

    fetch(`/api/community/statuses/link-preview?url=${encodeURIComponent(linkMeta.url)}`, {
      cache: "no-store",
    })
      .then(async (response) => {
        const data = await readJsonResponse<{ preview?: StoryLinkPreview; error?: string }>(
          response,
        );
        if (cancelled) return;
        if (!response.ok || !data.preview) {
          setError(data.error ?? "Could not load this link.");
          setPreview(null);
          return;
        }
        setPreview(data.preview);
      })
      .catch((loadError) => {
        if (cancelled) return;
        setError(loadError instanceof Error ? loadError.message : "Could not load this link.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [linkMeta, slide.id]);

  useEffect(() => {
    if (loading || preview?.kind === "youtube" || preview?.kind === "instagram_embed") {
      return;
    }

    let frame = 0;
    let start = Date.now();
    let elapsed = 0;

    const tick = () => {
      if (!paused) {
        const total = elapsed + (Date.now() - start);
        const nextProgress = Math.min(100, (total / STORY_LINK_MS) * 100);
        onProgress(nextProgress);
        if (nextProgress >= 100) {
          onAdvance();
          return;
        }
      }
      frame = window.requestAnimationFrame(tick);
    };

    frame = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(frame);
  }, [loading, onAdvance, onProgress, paused, preview?.kind]);

  useEffect(() => {
    if (paused) return;
    if (preview?.kind === "youtube" || preview?.kind === "instagram_embed") {
      onProgress(20);
    }
  }, [onProgress, paused, preview?.kind]);

  const platformLabel = linkMeta
    ? storySocialPlatformLabel(linkMeta.platform)
    : "Social";

  if (loading) {
    return (
      <div className="community-story-link-slide">
        <p className="community-story-link-kicker">{platformLabel}</p>
        <p className="community-story-link-loading">Loading preview…</p>
      </div>
    );
  }

  if (error || !preview) {
    return (
      <div className="community-story-link-slide">
        <p className="community-story-link-kicker">{platformLabel}</p>
        <p className="community-story-link-body">{slide.caption ?? error ?? "Link unavailable."}</p>
      </div>
    );
  }

  if (preview.kind === "youtube") {
    return (
      <div className="community-story-link-slide community-story-link-slide-embed">
        <iframe
          title={preview.title ?? "YouTube video"}
          src={`${preview.embedUrl}${paused ? "" : "&autoplay=1&mute=1"}`}
          className="community-story-link-iframe"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>
    );
  }

  if (preview.kind === "instagram_embed") {
    return (
      <div className="community-story-link-slide community-story-link-slide-embed">
        <iframe
          title="Instagram post"
          src={preview.embedUrl}
          className="community-story-link-iframe community-story-link-iframe-instagram"
          allow="autoplay; encrypted-media"
          allowFullScreen
        />
      </div>
    );
  }

  return (
    <div className="community-story-link-slide community-story-link-slide-card">
      {preview.imageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={preview.imageUrl} alt="" className="community-story-link-thumb" />
      ) : (
        <div className="community-story-link-thumb-placeholder">{platformLabel}</div>
      )}
      <div className="community-story-link-card-text">
        <p className="community-story-link-kicker">{platformLabel}</p>
        {preview.title ? <p className="community-story-link-title">{preview.title}</p> : null}
        <p className="community-story-link-body">
          {slide.caption?.trim() ||
            preview.description ||
            "Shared from social media."}
        </p>
        {preview.note === "story_no_embed" ? (
          <p className="community-story-link-tip">
            Tip: save the story to your gallery, then post it with{" "}
            <strong>Photo, video, or audio</strong> so it plays inside Shanah City.
          </p>
        ) : null}
      </div>
    </div>
  );
}
