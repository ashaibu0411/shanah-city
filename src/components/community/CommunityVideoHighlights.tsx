"use client";

import { useMemo } from "react";
import type { CommunityPost } from "@/lib/member-types";
import { communityPostMediaItems } from "@/lib/community-post-media";
type HighlightClip = {
  postId: string;
  author: string;
  url: string;
  caption: string;
};

function resolveMediaUrl(url: string) {
  if (!url) return url;
  if (url.startsWith("http://") || url.startsWith("https://") || url.startsWith("blob:")) {
    return url;
  }
  if (typeof window !== "undefined") {
    try {
      return new URL(url, window.location.origin).toString();
    } catch {
      return url;
    }
  }
  return url;
}

export function CommunityVideoHighlights({ posts }: { posts: CommunityPost[] }) {
  const clips = useMemo(() => {
    const list: HighlightClip[] = [];
    for (const post of posts) {
      for (const item of communityPostMediaItems(post)) {
        if (item.type !== "video") continue;
        list.push({
          postId: post.id,
          author: post.author,
          url: item.url,
          caption: post.content.trim().slice(0, 64) || "Community highlight",
        });
        if (list.length >= 12) return list;
      }
    }
    return list;
  }, [posts]);

  if (clips.length === 0) return null;

  return (
    <section className="community-v5-highlights" aria-labelledby="community-v5-highlights-title">
      <div className="community-v5-highlights__head">
        <h2 id="community-v5-highlights-title" className="community-v5-highlights__title">
          Community highlights
        </h2>
      </div>
      <div className="community-v5-highlights__track" role="list">
        {clips.map((clip) => (
          <a
            key={`${clip.postId}-${clip.url}`}
            href={`#post-${clip.postId}`}
            className="community-v5-highlight-card"
            role="listitem"
          >
            <HighlightVideoThumb url={clip.url} />
            <span className="community-v5-highlight-card__play" aria-hidden>
              ▶
            </span>
            <div className="community-v5-highlight-card__meta">
              <p className="community-v5-highlight-card__caption">{clip.caption}</p>
              <p className="community-v5-highlight-card__author">{clip.author}</p>
            </div>
          </a>
        ))}
      </div>
    </section>
  );
}

function HighlightVideoThumb({ url }: { url: string }) {
  const resolved = resolveMediaUrl(url);
  return (
    <video
      src={resolved}
      muted
      playsInline
      preload="metadata"
      className="community-v5-highlight-card__video"
    />
  );
}
