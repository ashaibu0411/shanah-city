"use client";

import { useEffect, useMemo, useState } from "react";
import type { CommunityPost } from "@/lib/member-types";
import {
  COMMUNITY_FEED_FILTERS,
  filterCommunityPosts,
  type CommunityFeedFilter,
} from "@/lib/community-ui-utils";
import { CommunityComposer } from "@/components/community/CommunityComposer";
import { CommunityPostCard } from "@/components/community/CommunityPostCard";
import { CommunityStatusRow } from "@/components/community/CommunityStatusRow";
import { SectionTitle } from "@/components/ui";

export function CommunityFeed({ initialPosts }: { initialPosts: CommunityPost[] }) {
  const [posts, setPosts] = useState(initialPosts);
  const [filter, setFilter] = useState<CommunityFeedFilter>("all");

  useEffect(() => {
    setPosts(initialPosts);
  }, [initialPosts]);

  const filteredPosts = useMemo(
    () => filterCommunityPosts(posts, filter),
    [posts, filter],
  );

  function updatePost(updated: CommunityPost) {
    setPosts((current) =>
      current.map((post) => (post.id === updated.id ? updated : post)),
    );
  }

  function prependPost(post: CommunityPost) {
    setPosts((current) => [post, ...current]);
  }

  return (
    <div className="community-feed">
      <div className="community-feed-header">
        <CommunityStatusRow />
        <CommunityComposer onLocalPost={prependPost} />

        <div className="community-feed-card community-feed-tabs" role="tablist" aria-label="Feed filters">
          {COMMUNITY_FEED_FILTERS.map((entry) => (
            <button
              key={entry.id}
              type="button"
              role="tab"
              aria-selected={filter === entry.id}
              onClick={() => setFilter(entry.id)}
              className={`community-feed-tab ${filter === entry.id ? "community-feed-tab-active" : ""}`}
            >
              {entry.label}
            </button>
          ))}
        </div>
      </div>

      <div className="community-feed-posts">
        {filteredPosts.length === 0 ? (
          <div className="community-feed-card community-feed-empty">
            <p className="text-[15px] font-semibold text-[#050505]">No posts yet</p>
            <p className="mt-1 text-sm text-[#65676b]">
              {filter === "all"
                ? "Be the first to share a prayer or praise with the community."
                : `No ${entryLabel(filter)} posts yet.`}
            </p>
          </div>
        ) : (
          filteredPosts.map((post) => (
            <CommunityPostCard key={post.id} post={post} onUpdate={updatePost} />
          ))
        )}
      </div>
    </div>
  );
}

function entryLabel(filter: CommunityFeedFilter) {
  return COMMUNITY_FEED_FILTERS.find((entry) => entry.id === filter)?.label.toLowerCase() ?? filter;
}

export function CommunityPreview({ initialPosts }: { initialPosts: CommunityPost[] }) {
  return (
    <section className="mb-8">
      <SectionTitle title="Community pulse" href="/community" />
      <div className="community-feed community-feed-preview">
        <div className="community-feed-posts">
          {initialPosts.slice(0, 2).map((post) => (
            <CommunityPostCard
              key={post.id}
              post={post}
              onUpdate={() => undefined}
              compact
            />
          ))}
        </div>
      </div>
    </section>
  );
}
