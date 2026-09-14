"use client";

import { useEffect, useMemo, useState } from "react";
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
  const linkUrl = useMemo(
    () => (linkMeta?.url ?? "").trim(),
    [linkMeta?.url],
  );
  const [preview, setPreview] = useState<StoryLinkPreview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!linkUrl) {
      setLoading(false);
      setError("Invalid link.");
      setPreview(null);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError("");
    setPreview(null);

    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 12_000);

    fetch(`/api/community/statuses/link-preview?url=${encodeURIComponent(linkUrl)}`, {
      cache: "no-store",
      signal: controller.signal,
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
        if (loadError instanceof Error && loadError.name === "AbortError") {
          setError("Preview took too long. Tap the right side to continue or open the link below.");
        } else {
          setError(loadError instanceof Error ? loadError.message : "Could not load this link.");
        }
        setPreview(null);
      })
      .finally(() => {
        window.clearTimeout(timeout);
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
      window.clearTimeout(timeout);
      controller.abort();
    };
  }, [linkUrl, slide.id]);

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
      <div className="community-story-link-slide community-story-link-slide-card">
        <p className="community-story-link-kicker">{platformLabel}</p>
        <p className="community-story-link-body">
          {slide.caption?.trim() || error || "Link unavailable."}
        </p>
        {linkUrl ? (
          <a
            href={linkUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="community-story-link-open"
          >
            Open on {platformLabel}
          </a>
        ) : null}
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
