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
  hideFilterTabs = false,
  hideComposer = false,
  lockedFilter,
  excludePostTypes,
  includePostTypes,
  postCardVariant = "default",
  bookmarkedIds,
  onToggleBookmark,
}: {
  initialPosts: CommunityPost[];
  initialFilter?: CommunityFeedFilter;
  initialGroupId?: string;
  groupFilterLabel?: string;
  hideFilterTabs?: boolean;
  hideComposer?: boolean;
  /** When set, feed tabs are hidden and this filter is always applied. */
  lockedFilter?: CommunityFeedFilter;
  excludePostTypes?: CommunityPost["type"][];
  includePostTypes?: CommunityPost["type"][];
  postCardVariant?: "default" | "couples";
  bookmarkedIds?: Set<string>;
  onToggleBookmark?: (postId: string) => void;
}) {
  const [posts, setPosts] = useState(initialPosts);
  const { members: mentionMembers } = useMentionMembers();
  const [filter, setFilter] = useState<CommunityFeedFilter>(() => {
    if (lockedFilter) return lockedFilter;
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

  const activeFilter = lockedFilter ?? filter;

  const filteredPosts = useMemo(() => {
    let list = filterCommunityPosts(posts, activeFilter);
    if (groupId) {
      list = list.filter((post) => post.targetGroupId === groupId);
    }
    if (excludePostTypes?.length) {
      const excluded = new Set(excludePostTypes);
      list = list.filter((post) => !excluded.has(post.type));
    }
    if (includePostTypes?.length) {
      const included = new Set(includePostTypes);
      list = list.filter((post) => included.has(post.type));
    }
    return list;
  }, [posts, activeFilter, groupId, excludePostTypes, includePostTypes]);

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
      {groupFilterLabel && groupId && !hideFilterTabs ? (
        <p className="mb-4 rounded-2xl border border-violet-200/80 bg-violet-50/70 px-4 py-3 text-sm text-night-800">
          Showing <strong>{groupFilterLabel}</strong> prayer &amp; praise on Community. Only members
          of this group can see these posts.
        </p>
      ) : null}
      <div className="community-feed-header">
        {!hideComposer ? (
          <CommunityComposer
            onLocalPost={prependPost}
            mentionMembers={mentionMembers}
            defaultTargetGroupId={groupId}
            defaultTargetGroupName={groupFilterLabel}
          />
        ) : null}

        {!hideFilterTabs ? (
          <div className="community-feed-tabs" role="tablist" aria-label="Feed filters">
            {COMMUNITY_FEED_FILTERS.map((entry) => (
              <button
                key={entry.id}
                type="button"
                role="tab"
                aria-selected={activeFilter === entry.id}
                onClick={() => setFilter(entry.id)}
                className={`community-feed-tab ${activeFilter === entry.id ? "community-feed-tab-active" : ""}`}
              >
                {entry.label}
              </button>
            ))}
          </div>
        ) : null}
      </div>

      <div className="community-feed-posts">
        {filteredPosts.length === 0 ? (
          <div className="community-feed-card community-feed-empty">
            <p className="text-[15px] font-semibold text-night-900 font-display">No posts yet</p>
            <p className="mt-1 text-sm text-night-600">
              {activeFilter === "all"
                ? "Be the first to share a prayer, praise, or update with the community."
                : `No ${entryLabel(activeFilter)} posts yet.`}
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
              variant={postCardVariant}
              bookmarked={bookmarkedIds?.has(post.id)}
              onToggleBookmark={
                onToggleBookmark ? () => onToggleBookmark(post.id) : undefined
              }
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
