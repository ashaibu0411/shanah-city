"use client";

import { useCallback, useEffect, useState } from "react";
import { CouplesCommunityFeedLayout } from "@/components/couples/CouplesCommunityFeedLayout";
import {
  COUPLES_COMMUNITY_GROUP_ID,
  couplesCommunityFeedFilter,
  type CouplesCommunityFeedMode,
} from "@/lib/couples-community-constants";
import type { CommunityPost } from "@/lib/member-types";
import { readJsonResponse } from "@/lib/read-json-response";

export function CouplesCommunityFeedEmbedded({
  mode,
  onBack,
}: {
  mode: CouplesCommunityFeedMode;
  onBack: () => void;
}) {
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const types =
      mode === "prayer"
        ? "prayer,praise"
        : mode === "announcements"
          ? "announcement"
          : "prayer,praise,general,announcement";
    const response = await fetch(
      `/api/community?groupId=${encodeURIComponent(COUPLES_COMMUNITY_GROUP_ID)}&types=${types}`,
      { cache: "no-store" },
    );
    const data = await readJsonResponse<{ posts?: CommunityPost[] }>(response);
    let list = data.posts ?? [];
    if (mode === "discussions") {
      list = list.filter((post) => post.type !== "announcement");
    } else if (mode === "prayer") {
      list = list.filter((post) => post.type === "prayer" || post.type === "praise");
    } else {
      list = list.filter((post) => post.type === "announcement");
    }
    setPosts(list);
    setLoading(false);
  }, [mode]);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading) {
    return (
      <div className="px-4 pb-8">
        <button type="button" className="text-sm font-semibold text-[var(--couples-text-muted)]" onClick={onBack}>
          ← Couples Hub
        </button>
        <p className="mt-8 text-center text-sm text-[var(--couples-sheet-muted)]">Loading community…</p>
      </div>
    );
  }

  return (
    <CouplesCommunityFeedLayout
      mode={mode}
      initialPosts={posts}
      initialFilter={couplesCommunityFeedFilter(mode)}
      groupName="Shanah Power Couples"
      embedded
      onBack={onBack}
    />
  );
}
