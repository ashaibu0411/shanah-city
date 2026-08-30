"use client";

import { useState } from "react";
import type { CommunityStatus } from "@/lib/member-types";
import { authorInitial } from "@/lib/community-ui-utils";
import { resolveStoryMediaUrl } from "@/lib/community-story-utils";

type CommunityStoryRingProps = {
  authorName: string;
  authorId: string;
  preview?: CommunityStatus | null;
  hasUnseen?: boolean;
  showAddBadge?: boolean;
  onPress: () => void;
  onAddPress?: () => void;
  disabled?: boolean;
  label: string;
};

export function CommunityStoryRing({
  authorName,
  authorId,
  preview = null,
  hasUnseen = false,
  showAddBadge = false,
  onPress,
  onAddPress,
  disabled = false,
  label,
}: CommunityStoryRingProps) {
  const [avatarFailed, setAvatarFailed] = useState(false);
  const [previewFailed, setPreviewFailed] = useState(false);
  const avatarSrc =
    authorId && !avatarFailed
      ? `/api/profile/avatar?userId=${encodeURIComponent(authorId)}`
      : null;
  const previewUrl = preview ? resolveStoryMediaUrl(preview.mediaUrl) : null;
  const showPreview =
    preview &&
    previewUrl &&
    !previewFailed &&
    (preview.mediaType === "image" || preview.mediaType === "video");
  const ringClass = preview
    ? hasUnseen
      ? "community-story-ring-unseen"
      : "community-story-ring-seen"
    : "community-story-ring-empty";

  return (
    <div className="community-story-item">
      <button
        type="button"
        onClick={onPress}
        disabled={disabled}
        className="relative disabled:opacity-60"
        aria-label={label}
      >
        <div className={`community-story-ring ${ringClass}`}>
          <div className="community-story-ring-inner">
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
            ) : avatarSrc ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={avatarSrc}
                alt={authorName}
                className="h-full w-full object-cover"
                onError={() => setAvatarFailed(true)}
              />
            ) : (
              <span className="text-base font-bold text-[#050505]">{authorInitial(authorName)}</span>
            )}
          </div>
        </div>
        {showAddBadge ? (
          <span
            role="button"
            tabIndex={0}
            onClick={(event) => {
              event.stopPropagation();
              onAddPress?.();
            }}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                event.stopPropagation();
                onAddPress?.();
              }
            }}
            className="absolute bottom-0 right-0 flex h-6 w-6 items-center justify-center rounded-full bg-[#1877f2] text-lg font-bold leading-none text-white ring-2 ring-white"
            aria-label="Add story"
          >
            +
          </span>
        ) : null}
      </button>
      <span className="community-story-label">{label}</span>
    </div>
  );
}
