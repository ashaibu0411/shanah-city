"use client";

import { useEffect, useMemo, useState } from "react";
import { useOnAppRefresh } from "@/hooks/useOnAppRefresh";
import { readJsonResponse } from "@/lib/read-json-response";
import type { CommunityPost } from "@/lib/member-types";
import {
  COMMUNITY_FEED_FILTERS,
  filterCommunityPosts,
  type CommunityFeedFilter,
} from "@/lib/community-ui-utils";
import { isUrgentAlertCommunityPostId } from "@/lib/urgent-alert-utils";
import { useMentionMembers } from "@/components/mentions/useMentionAutocomplete";
import { CommunityComposer } from "@/components/community/CommunityComposer";
import { CommunityPostCard } from "@/components/community/CommunityPostCard";
import { SectionTitle } from "@/components/ui";

export function CommunityFeed({
  initialPosts,
  initialFilter,
  initialGroupId,
  groupFilterLabel,
}: {
  initialPosts: CommunityPost[];
  initialFilter?: CommunityFeedFilter;
  initialGroupId?: string;
  groupFilterLabel?: string;
}) {
  const [posts, setPosts] = useState(initialPosts);
  const { members: mentionMembers } = useMentionMembers();
  const [filter, setFilter] = useState<CommunityFeedFilter>(() => {
    if (initialFilter) return initialFilter;
    if (typeof window === "undefined") return "all";
    const hash = window.location.hash;
    if (!hash.startsWith("#post-")) return "all";
    const postId = decodeURIComponent(hash.slice("#post-".length));
    return isUrgentAlertCommunityPostId(postId) ? "announcement" : "all";
  });
  const groupId = initialGroupId?.trim() || "";

  useEffect(() => {
    setPosts(initialPosts);
  }, [initialPosts]);

  useOnAppRefresh(() => {
    const query = groupId
      ? `?groupId=${encodeURIComponent(groupId)}&types=prayer,praise,general,announcement`
      : "";
    void fetch(`/api/community${query}`, { cache: "no-store" })
      .then(async (response) => {
        const data = await readJsonResponse<{ posts?: CommunityPost[] }>(response);
        if (response.ok && data.posts) {
          setPosts(data.posts);
        }
      })
      .catch(() => undefined);
  });

  const filteredPosts = useMemo(() => {
    let list = filterCommunityPosts(posts, filter);
    if (groupId) {
      list = list.filter((post) => post.targetGroupId === groupId);
    }
    return list;
  }, [posts, filter, groupId]);

  function updatePost(updated: CommunityPost) {
    setPosts((current) =>
      current.map((post) =>
        post.id === updated.id
          ? { ...updated, canManage: updated.canManage ?? post.canManage }
          : post,
      ),
    );
  }

  function removePost(postId: string) {
    setPosts((current) => current.filter((post) => post.id !== postId));
  }

  function prependPost(post: CommunityPost) {
    setPosts((current) => [{ ...post, canManage: post.canManage ?? true }, ...current]);
  }

  useEffect(() => {
    const hash = window.location.hash;
    if (!hash.startsWith("#post-")) return;

    const scrollToPost = () => {
      const target = document.querySelector(hash);
      if (!target) return false;
      target.scrollIntoView({ behavior: "smooth", block: "start" });
      target.classList.add("community-post-card-highlight");
      window.setTimeout(() => target.classList.remove("community-post-card-highlight"), 3200);
      return true;
    };

    if (scrollToPost()) return;

    const retry = window.setInterval(() => {
      if (scrollToPost()) {
        window.clearInterval(retry);
      }
    }, 120);

    return () => window.clearInterval(retry);
  }, [filteredPosts.length]);

  return (
    <div className="community-feed community-feed-solid min-w-0 max-w-full">
      {groupFilterLabel && groupId ? (
        <p className="mb-4 rounded-2xl border border-violet-200/80 bg-violet-50/70 px-4 py-3 text-sm text-night-800">
          Showing <strong>{groupFilterLabel}</strong> prayer &amp; praise on Community. Only members
          of this group can see these posts.
        </p>
      ) : null}
      <div className="community-feed-header">
        <CommunityComposer
          onLocalPost={prependPost}
          mentionMembers={mentionMembers}
          defaultTargetGroupId={groupId}
          defaultTargetGroupName={groupFilterLabel}
        />

        <div className="community-feed-tabs" role="tablist" aria-label="Feed filters">
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
            <p className="text-[15px] font-semibold text-night-900 font-display">No posts yet</p>
            <p className="mt-1 text-sm text-night-600">
              {filter === "all"
                ? "Be the first to share a prayer, praise, or update with the community."
                : `No ${entryLabel(filter)} posts yet.`}
            </p>
          </div>
        ) : (
          filteredPosts.map((post) => (
            <CommunityPostCard
              key={post.id}
              post={post}
              onUpdate={updatePost}
              onDelete={removePost}
              mentionMembers={mentionMembers}
            />
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
