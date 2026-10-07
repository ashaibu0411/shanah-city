"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useApp } from "@/components/app/AppProvider";
import { CommunityPostCard } from "@/components/community/CommunityPostCard";
import { useMentionMembers } from "@/components/mentions/useMentionAutocomplete";
import { Button } from "@/components/ui";
import {
  ministryHubCommunityUrl,
  ministryHubPrayerTabUrl,
} from "@/lib/group-ministry-community-shared";
import type { CommunityPost } from "@/lib/member-types";
import { readJsonResponse } from "@/lib/read-json-response";

export function GroupMinistryPrayerPanel({
  groupId,
  groupLabel,
}: {
  groupId: string;
  groupLabel: string;
}) {
  const { campus } = useApp();
  const { members: mentionMembers } = useMentionMembers();
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [content, setContent] = useState("");
  const [type, setType] = useState<"prayer" | "praise">("prayer");
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);

  const loadFeed = useCallback(async () => {
    setLoading(true);
    const response = await fetch(
      `/api/community?groupId=${encodeURIComponent(groupId)}&types=prayer,praise`,
      { cache: "no-store" },
    );
    const data = await readJsonResponse<{ posts?: CommunityPost[]; error?: string }>(response);
    setLoading(false);
    if (response.ok) {
      setPosts(data.posts ?? []);
      setMessage(null);
    } else {
      setMessage(data.error ?? "Could not load prayer wall.");
    }
  }, [groupId]);

  useEffect(() => {
    void loadFeed();
  }, [loadFeed]);

  async function submitPost() {
    setBusy(true);
    setMessage(null);
    const response = await fetch("/api/community", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        campusId: campus.id,
        content,
        type,
        targetGroupId: groupId,
        targetGroupName: groupLabel,
      }),
    });
    const data = await readJsonResponse<{ post?: CommunityPost; error?: string }>(response);
    setBusy(false);
    if (!response.ok || !data.post) {
      setMessage(data.error ?? "Could not post.");
      return;
    }
    setPosts((current) => [data.post!, ...current]);
    setContent("");
    setMessage("Posted to Community for your group.");
  }

  function updatePost(updated: CommunityPost) {
    setPosts((current) => current.map((post) => (post.id === updated.id ? updated : post)));
  }

  function deletePost(postId: string) {
    setPosts((current) => current.filter((post) => post.id !== postId));
  }

  const communityHref = ministryHubCommunityUrl(groupId);

  return (
    <div className="mt-4 space-y-4">
      <div className="rounded-2xl border border-violet-200/80 bg-violet-50/60 p-4">
        <p className="text-sm text-night-800">
          Prayer and praise here are <strong>Community posts</strong> for {groupLabel} members.
          They do not appear on the public church-wide feed — only for people in this group.
        </p>
        <Link
          href={communityHref}
          className="mt-2 inline-flex text-sm font-semibold text-violet-800 underline"
        >
          Open in Community →
        </Link>
      </div>

      <div className="rounded-2xl border border-amber-200/80 bg-gradient-to-br from-amber-50/90 to-orange-50/50 p-4">
        <div className="flex flex-wrap gap-2">
          {(["prayer", "praise"] as const).map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => setType(option)}
              className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
                type === option
                  ? "bg-night-900 text-white"
                  : "bg-white text-night-800 ring-1 ring-night-900/10"
              }`}
            >
              {option === "prayer" ? "Prayer" : "Praise"}
            </button>
          ))}
        </div>
        <textarea
          value={content}
          onChange={(event) => setContent(event.target.value)}
          rows={4}
          placeholder="Share a prayer request or praise…"
          className="mt-3 w-full rounded-xl border border-night-900/10 bg-white px-3 py-2.5 text-sm outline-none ring-night-900/5 focus:ring-2"
        />
        <Button className="mt-3" disabled={busy || !content.trim()} onClick={() => void submitPost()}>
          {busy ? "Posting…" : "Post to Community"}
        </Button>
      </div>

      {loading ? (
        <p className="text-sm text-night-500">Loading prayer wall…</p>
      ) : posts.length === 0 ? (
        <p className="rounded-2xl bg-sand-50 px-4 py-3 text-sm text-night-600">
          No prayer or praise posts yet. Be the first — your group will get a notification.
        </p>
      ) : (
        <ul className="space-y-4">
          {posts.map((post) => (
            <li key={post.id} id={`post-${post.id}`}>
              <CommunityPostCard
                post={post}
                mentionMembers={mentionMembers}
                onUpdate={updatePost}
                onDelete={deletePost}
              />
            </li>
          ))}
        </ul>
      )}

      {message ? <p className="text-sm text-night-600">{message}</p> : null}

      <p className="text-center text-xs text-night-500">
        <Link href={ministryHubPrayerTabUrl(groupId)} className="underline">
          Refresh this tab
        </Link>
        {" · "}
        <Link href={communityHref} className="underline">
          Community filter
        </Link>
      </p>
    </div>
  );
}
