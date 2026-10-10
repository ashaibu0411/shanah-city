"use client";

import { useCallback, useEffect, useState } from "react";
import { CommunityFeed } from "@/components/community/CommunityFeed";
import { CommunityComposer } from "@/components/community/CommunityComposer";
import { COUPLES_COMMUNITY_GROUP_ID } from "@/lib/couples-community-constants";
import { CouplesCommunityFeedPreviews } from "@/components/couples/CouplesCommunityFeedPreviews";
import { readCouplesCommunityBookmarks, writeCouplesCommunityBookmarks } from "@/lib/couple-community-ui";
import type { CommunityFeedFilter } from "@/lib/community-ui-utils";
import type { CommunityPost } from "@/lib/member-types";

export function CouplesCommunityDiscussionsTab({
  initialPosts,
  initialFilter,
  groupName,
  composeOpen,
  onComposeOpenChange,
}: {
  initialPosts: CommunityPost[];
  initialFilter: CommunityFeedFilter;
  groupName: string;
  composeOpen: boolean;
  onComposeOpenChange: (open: boolean) => void;
}) {
  const [posts, setPosts] = useState(initialPosts);
  const [bookmarks, setBookmarks] = useState<Set<string>>(() => readCouplesCommunityBookmarks());

  useEffect(() => {
    setPosts(initialPosts);
  }, [initialPosts]);

  useEffect(() => {
    setBookmarks(readCouplesCommunityBookmarks());
  }, []);

  const toggleBookmark = useCallback((postId: string) => {
    setBookmarks((current) => {
      const next = new Set(current);
      if (next.has(postId)) next.delete(postId);
      else next.add(postId);
      writeCouplesCommunityBookmarks(next);
      return next;
    });
  }, []);

  return (
    <div className="couples-community-premium">
      <CommunityComposer
        onLocalPost={(post) => {
          setPosts((current) => [{ ...post, canManage: post.canManage ?? true }, ...current]);
          onComposeOpenChange(false);
        }}
        defaultTargetGroupId={COUPLES_COMMUNITY_GROUP_ID}
        defaultTargetGroupName={groupName}
        hideInlineBar
        composeOpen={composeOpen}
        onComposeOpenChange={onComposeOpenChange}
        composerPreset="couples"
      />

      {posts.length === 0 ? (
        <CouplesCommunityFeedPreviews />
      ) : (
        <div className="couples-community-feed mt-1">
          <CommunityFeed
            initialPosts={posts}
            initialFilter={initialFilter}
            initialGroupId={COUPLES_COMMUNITY_GROUP_ID}
            groupFilterLabel={groupName}
            hideFilterTabs
            hideComposer
            lockedFilter="all"
            excludePostTypes={["announcement"]}
            postCardVariant="couples"
            bookmarkedIds={bookmarks}
            onToggleBookmark={toggleBookmark}
          />
        </div>
      )}
    </div>
  );
}
