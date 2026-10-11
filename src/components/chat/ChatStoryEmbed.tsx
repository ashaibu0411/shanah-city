"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { communityStoryDeepLink } from "@/lib/story-dm-links";
import { resolveStoryMediaUrl } from "@/lib/community-story-utils";
import type { CommunityStatusMediaType } from "@/lib/member-types";

type StoryPreview = {
  id: string;
  authorName: string;
  mediaUrl: string;
  mediaType: CommunityStatusMediaType;
  caption: string;
  expired: boolean;
};

export function ChatStoryEmbed({ statusId, mine }: { statusId: string; mine?: boolean }) {
  const [preview, setPreview] = useState<StoryPreview | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    void fetch(`/api/community/statuses/${encodeURIComponent(statusId)}/preview`)
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error ?? "Could not load story.");
        if (!cancelled) setPreview(data.preview as StoryPreview);
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Could not load story.");
        }
      });
    return () => {
      cancelled = true;
    };
  }, [statusId]);

  const shell = mine
    ? "border-white/20 bg-white/10"
    : "border-night-900/10 bg-sand-50 dark:border-white/10 dark:bg-night-900/40";

  if (error) {
    return (
      <p className={`mt-2 text-xs ${mine ? "text-white/85" : "text-night-600 dark:text-sand-300"}`}>
        {error}
      </p>
    );
  }

  if (!preview) {
    return (
      <p className={`mt-2 text-xs ${mine ? "text-white/75" : "text-night-500 dark:text-sand-400"}`}>
        Loading story…
      </p>
    );
  }

  const mediaUrl =
    preview.mediaType === "image" || preview.mediaType === "video"
      ? resolveStoryMediaUrl(preview.mediaUrl)
      : null;

  return (
    <Link
      href={communityStoryDeepLink(statusId)}
      className={`mt-2 block w-full min-w-[min(100%,16rem)] max-w-xs overflow-hidden rounded-2xl border ${shell}`}
    >
      <div className="px-3 py-2">
        <p className="text-[10px] font-bold uppercase tracking-wider text-night-500 dark:text-sand-400">
          Story {preview.expired ? "· expired" : ""}
        </p>
        <p className="text-xs font-semibold text-night-900 dark:text-sand-100">{preview.authorName}</p>
      </div>
      {mediaUrl ? (
        <div className="relative aspect-[9/16] max-h-48 w-full bg-night-900">
          {preview.mediaType === "video" ? (
            <video src={mediaUrl} className="h-full w-full object-cover" muted playsInline preload="metadata" />
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={mediaUrl} alt="" className="h-full w-full object-cover" />
          )}
        </div>
      ) : (
        <div className="px-3 py-3">
          <p className="line-clamp-4 text-sm text-night-700 dark:text-sand-200">
            {preview.caption || "Text story"}
          </p>
        </div>
      )}
      {preview.caption && mediaUrl ? (
        <p className="line-clamp-2 px-3 py-2 text-xs text-night-600 dark:text-sand-300">{preview.caption}</p>
      ) : null}
      <p className="border-t border-night-900/5 px-3 py-2 text-[11px] font-semibold text-teal-800 dark:border-white/10 dark:text-teal-300">
        View in Community
      </p>
    </Link>
  );
}
