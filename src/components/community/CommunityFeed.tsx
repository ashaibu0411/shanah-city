"use client";

import { useEffect, useState } from "react";
import { useApp } from "@/components/app/AppProvider";
import { useAppShell } from "@/components/app/AppShellContext";
import { useAuth } from "@/components/auth/AuthProvider";
import { getCampus } from "@/lib/site";
import type { CommunityPost } from "@/lib/member-types";
import type { SignupGroupOption } from "@/lib/group-types";
import { Button, Card, SectionTitle } from "@/components/ui";

function formatTime(iso: string) {
  return new Date(iso).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function authorInitial(name: string) {
  return name.trim().charAt(0).toUpperCase() || "?";
}

function PostCard({
  post,
  onUpdate,
}: {
  post: CommunityPost;
  onUpdate: (post: CommunityPost) => void;
}) {
  const { isMobileApp } = useAppShell();
  const [commentDraft, setCommentDraft] = useState("");
  const [showComments, setShowComments] = useState(false);
  const [loading, setLoading] = useState(false);
  const [reacted, setReacted] = useState(false);
  const campus = getCampus(post.campusId);

  const typeStyles = {
    prayer: "bg-violet-100 text-violet-800 ring-violet-200/60",
    praise: "bg-amber-100 text-amber-800 ring-amber-200/60",
    announcement: "bg-sky-100 text-sky-800 ring-sky-200/60",
  };

  async function submitComment() {
    if (!commentDraft.trim()) return;
    setLoading(true);
    const response = await fetch("/api/community", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "comment",
        postId: post.id,
        author: "You",
        content: commentDraft.trim(),
      }),
    });
    const data = await response.json();
    setLoading(false);
    if (response.ok) {
      onUpdate(data.post);
      setCommentDraft("");
      setShowComments(true);
    }
  }

  async function react() {
    if (reacted) return;
    const response = await fetch("/api/community", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "react", postId: post.id }),
    });
    const data = await response.json();
    if (response.ok) {
      onUpdate(data.post);
      setReacted(true);
    }
  }

  return (
    <Card className={isMobileApp ? "!p-3.5" : ""}>
      <div className="flex items-start gap-3">
        <div
          className={`flex shrink-0 items-center justify-center rounded-full bg-night-900 font-bold text-white ${
            isMobileApp ? "h-9 w-9 text-sm" : "h-10 w-10 text-base"
          }`}
          aria-hidden
        >
          {authorInitial(post.author)}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-semibold tracking-tight text-night-900">{post.author}</h3>
            <span
              className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ring-1 ${typeStyles[post.type]}`}
            >
              {post.type}
            </span>
          </div>
          <p className="mt-0.5 text-xs text-night-500">
            {campus.name} · {post.timeAgo}
            {post.targetGroupName ? ` · ${post.targetGroupName}` : ""}
          </p>
        </div>
      </div>

      <p className={`${isMobileApp ? "mt-2.5 text-sm leading-snug" : "mt-3 text-sm leading-relaxed"} text-night-700`}>
        {post.content}
      </p>

      <div className={`${isMobileApp ? "mt-3 gap-2" : "mt-4 gap-3"} flex flex-wrap items-center`}>
        <Button variant={reacted ? "primary" : "secondary"} onClick={react} className={isMobileApp ? "!px-3 !py-2 text-xs" : ""}>
          {post.type === "prayer"
            ? "🙏 I prayed"
            : post.type === "announcement"
              ? "📣 Noted"
              : "♡ Amen"}{" "}
          ({post.reactions})
        </Button>
        <Button variant="ghost" onClick={() => setShowComments((value) => !value)} className={isMobileApp ? "!px-2 !py-2 text-xs" : ""}>
          💬 Comment ({post.comments?.length ?? 0})
        </Button>
      </div>

      {showComments && (
        <div className={`${isMobileApp ? "mt-3 space-y-2 pt-3" : "mt-4 space-y-3 pt-4"} border-t border-night-900/5`}>
          {(post.comments ?? []).map((comment) => (
            <div key={comment.id} className="rounded-xl border border-night-900/5 bg-sand-50/80 p-2.5">
              <p className="text-sm font-semibold text-night-900">{comment.author}</p>
              <p className="mt-1 text-sm text-night-700">{comment.content}</p>
              <p className="mt-1 text-xs text-night-500">{formatTime(comment.createdAt)}</p>
            </div>
          ))}

          <div className="flex gap-2">
            <input
              value={commentDraft}
              onChange={(event) => setCommentDraft(event.target.value)}
              placeholder="Write a comment..."
              className="flex-1 rounded-xl border border-night-900/10 bg-white px-3 py-2 text-sm outline-none ring-night-900/5 focus:ring-2"
            />
            <Button onClick={submitComment}>{loading ? "..." : "Post"}</Button>
          </div>
        </div>
      )}
    </Card>
  );
}

export function CommunityFeed({ initialPosts }: { initialPosts: CommunityPost[] }) {
  const { isMobileApp } = useAppShell();
  const [posts, setPosts] = useState(initialPosts);
  const [draft, setDraft] = useState("");
  const [announcementDraft, setAnnouncementDraft] = useState("");
  const [targetGroupId, setTargetGroupId] = useState("");
  const [targetGroups, setTargetGroups] = useState<SignupGroupOption[]>([]);
  const [postType, setPostType] = useState<"prayer" | "praise">("prayer");
  const { campus } = useApp();
  const { user, permissions } = useAuth();
  const canAnnounce = permissions.canManageAdmin;

  useEffect(() => {
    setPosts(initialPosts);
  }, [initialPosts]);

  useEffect(() => {
    if (!canAnnounce) return;
    fetch("/api/groups/signup-options")
      .then((response) => response.json())
      .then((data) => setTargetGroups(data.groups ?? []))
      .catch(() => setTargetGroups([]));
  }, [canAnnounce]);

  function updatePost(updated: CommunityPost) {
    setPosts((current) =>
      current.map((post) => (post.id === updated.id ? updated : post)),
    );
  }

  async function submitPost() {
    if (!draft.trim()) return;
    const response = await fetch("/api/community", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        campusId: campus.id,
        content: draft.trim(),
        type: postType,
      }),
    });
    const data = await response.json();
    if (response.ok) {
      setPosts((current) => [data.post, ...current]);
      setDraft("");
    }
  }

  async function submitAnnouncement() {
    if (!announcementDraft.trim()) return;
    const selectedGroup = targetGroups.find((group) => group.id === targetGroupId);
    const response = await fetch("/api/community", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        campusId: campus.id,
        content: announcementDraft.trim(),
        type: "announcement",
        targetGroupId: targetGroupId || undefined,
        targetGroupName: selectedGroup?.name,
      }),
    });
    const data = await response.json();
    if (response.ok) {
      setPosts((current) => [data.post, ...current]);
      setAnnouncementDraft("");
      setTargetGroupId("");
    }
  }

  return (
    <div className={isMobileApp ? "space-y-3" : ""}>
      {canAnnounce && (
        <Card className={`border border-sky-100 bg-sky-50/50 ${isMobileApp ? "!p-3.5 mb-0" : "mb-6"}`}>
          <h3 className={`font-display font-semibold text-night-900 ${isMobileApp ? "text-base" : "text-lg"}`}>
            Post a church announcement
          </h3>
          <p className="mt-2 text-sm text-night-600">
            Admin Group only — broadcast to the whole church or target one ministry group.
            Push notifications respect each member&apos;s announcement settings.
          </p>
          <select
            value={targetGroupId}
            onChange={(event) => setTargetGroupId(event.target.value)}
            className="mt-3 w-full rounded-xl border border-night-900/10 bg-white px-3 py-2.5 text-sm outline-none ring-night-900/5 focus:ring-2"
          >
            <option value="">All church members</option>
            {targetGroups.map((group) => (
              <option key={group.id} value={group.id}>
                {group.name} only
              </option>
            ))}
          </select>
          <textarea
            value={announcementDraft}
            onChange={(event) => setAnnouncementDraft(event.target.value)}
            placeholder="Service update, event reminder, campus news..."
            className="mt-3 w-full rounded-xl border border-night-900/10 bg-white p-3 text-sm outline-none ring-night-900/5 focus:ring-2"
            rows={3}
          />
          <div className="mt-3 flex justify-end">
            <Button onClick={submitAnnouncement} disabled={!announcementDraft.trim()}>
              Send announcement
            </Button>
          </div>
        </Card>
      )}

      <Card className={isMobileApp ? "!p-3.5 mb-0" : "mb-6"}>
        <h3 className={`font-display font-semibold text-night-900 ${isMobileApp ? "text-base" : "text-lg"}`}>
          Share a prayer or praise
        </h3>
        <p className="mt-2 text-sm text-night-600">
          Everyone with community notifications enabled gets a push when you post.
        </p>
        <div className={`mt-3 flex gap-2 ${isMobileApp ? "overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden" : ""}`}>
          {(["prayer", "praise"] as const).map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => setPostType(type)}
              className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold capitalize ring-1 ${
                postType === type
                  ? "bg-night-900 text-sand-50 ring-night-900"
                  : "bg-white text-night-600 ring-night-900/10"
              }`}
            >
              {type}
            </button>
          ))}
        </div>
        <textarea
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder="What's on your heart today?"
          className="mt-3 w-full rounded-xl border border-night-900/10 bg-white p-3 text-sm outline-none ring-night-900/5 focus:ring-2"
          rows={3}
        />
        <div className="mt-3 flex justify-end">
          <Button onClick={submitPost}>Post to community</Button>
        </div>
      </Card>

      <div className={isMobileApp ? "space-y-2.5" : "grid gap-4"}>
        {posts.map((post) => (
          <PostCard key={post.id} post={post} onUpdate={updatePost} />
        ))}
      </div>
    </div>
  );
}

export function CommunityPreview({ initialPosts }: { initialPosts: CommunityPost[] }) {
  return (
    <section className="mb-8">
      <SectionTitle title="Community pulse" href="/community" />
      <div className="grid gap-3">
        {initialPosts.slice(0, 2).map((post) => (
          <PostCard
            key={post.id}
            post={post}
            onUpdate={() => undefined}
          />
        ))}
      </div>
    </section>
  );
}
