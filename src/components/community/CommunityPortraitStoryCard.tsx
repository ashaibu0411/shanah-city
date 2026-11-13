"use client";

import { useState } from "react";
import type { CommunityStatus } from "@/lib/member-types";
import { authorInitial } from "@/lib/community-ui-utils";
import { resolveStoryMediaUrl } from "@/lib/community-story-utils";
import { CommunityAvatar } from "@/components/community/CommunityAvatar";

type CommunityPortraitStoryCardProps = {
  authorName: string;
  authorId: string;
  preview?: CommunityStatus | null;
  hasUnseen?: boolean;
  showAddBadge?: boolean;
  label: string;
  variant?: "story" | "create" | "reel";
  disabled?: boolean;
  onPress: () => void;
  onAddPress?: () => void;
};

export function CommunityPortraitStoryCard({
  authorName,
  authorId,
  preview = null,
  hasUnseen = false,
  showAddBadge = false,
  label,
  variant = "story",
  disabled = false,
  onPress,
  onAddPress,
}: CommunityPortraitStoryCardProps) {
  const [previewFailed, setPreviewFailed] = useState(false);
  const previewUrl = preview ? resolveStoryMediaUrl(preview.mediaUrl) : null;
  const isTextPreview = preview?.mediaType === "text";
  const isAudioPreview = preview?.mediaType === "audio";
  const isLinkPreview = preview?.mediaType === "link";
  const isLivePreview = preview?.mediaType === "live";
  const textPreview = isTextPreview ? preview.caption?.trim() : "";
  const showPreview =
    preview &&
    !isTextPreview &&
    !isAudioPreview &&
    !isLinkPreview &&
    !isLivePreview &&
    previewUrl &&
    !previewFailed &&
    (preview.mediaType === "image" || preview.mediaType === "video");

  const ringClass = [
    "community-portrait-story-card",
    variant === "create" ? "community-portrait-story-card--create" : "",
    variant === "reel" ? "community-portrait-story-card--reel" : "",
    variant === "story" && hasUnseen ? "community-portrait-story-card--unseen" : "",
    variant === "story" && preview && !hasUnseen ? "community-portrait-story-card--seen" : "",
  ]
    .filter(Boolean)
    .join(" ");

  if (variant === "create") {
    return (
      <button
        type="button"
        className={ringClass}
        onClick={() => {
          if (showAddBadge) {
            onAddPress?.() ?? onPress();
          } else {
            onPress();
          }
        }}
        disabled={disabled}
        aria-label="Create story"
      >
        <span className="community-portrait-story-card__create-icon" aria-hidden>
          +
        </span>
        <span className="community-portrait-story-card__create-label">Create story</span>
      </button>
    );
  }

  if (variant === "reel") {
    return (
      <button
        type="button"
        className={ringClass}
        onClick={onPress}
        disabled={disabled}
        aria-label="Create reel"
      >
        <span className="community-portrait-story-card__reel-icon" aria-hidden>
          ▶
        </span>
        <span className="community-portrait-story-card__create-label">Create reel</span>
      </button>
    );
  }

  return (
    <button
      type="button"
      className={ringClass}
      onClick={onPress}
      disabled={disabled}
      aria-label={label}
    >
      <div className="community-portrait-story-card__media" aria-hidden>
        {showPreview && preview.mediaType === "image" ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={previewUrl}
            alt=""
            className="h-full w-full object-cover"
            onError={() => setPreviewFailed(true)}
          />
        ) : showPreview && preview.mediaType === "video" ? (
          <video
            src={previewUrl}
            muted
            playsInline
            preload="metadata"
            className="h-full w-full object-cover"
            onError={() => setPreviewFailed(true)}
          />
        ) : isTextPreview && textPreview ? (
          <div className="community-portrait-story-card__text-preview">
            <span>{textPreview.slice(0, 72)}{textPreview.length > 72 ? "…" : ""}</span>
          </div>
        ) : isLivePreview ? (
          <div className="community-portrait-story-card__live">LIVE</div>
        ) : (
          <div className="community-portrait-story-card__fallback">
            {authorInitial(authorName)}
          </div>
        )}
        <div className="community-portrait-story-card__scrim" />
      </div>
      <div className="community-portrait-story-card__avatar">
        <CommunityAvatar name={authorName} authorId={authorId} size="sm" />
      </div>
      <span className="community-portrait-story-card__name">{label}</span>
    </button>
  );
}
