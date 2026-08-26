"use client";

import { useMemo, useState } from "react";
import { getCampus } from "@/lib/site";
import type { CommunityPost } from "@/lib/member-types";
import {
  formatCommunityTimeAgo,
  postTypeLabel,
  reactionActionLabel,
  reactionEmoji,
} from "@/lib/community-ui-utils";
import { CommunityAvatar } from "@/components/community/CommunityAvatar";

function LikeIcon({ active }: { active: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden
      className={`h-[18px] w-[18px] ${active ? "fill-[#1877f2]" : "fill-none stroke-current"}`}
      strokeWidth={active ? 0 : 1.8}
    >
      <path d="M7.5 10.5V18h-2.25A1.125 1.125 0 0 1 4.125 16.875V11.625A1.125 1.125 0 0 1 5.25 10.5H7.5Z" />
      <path d="M7.5 10.5 9.75 4.875A2.25 2.25 0 0 1 14.25 6.75V10.5h4.125a2.25 2.25 0 0 1 2.205 2.775l-1.125 4.5A2.25 2.25 0 0 1 17.25 18H10.5" />
    </svg>
  );
}

function CommentIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className="h-[18px] w-[18px] fill-none stroke-current" strokeWidth={1.8}>
      <path d="M12 20.25c4.97 0 9-3.694 9-8.25S16.97 3.75 12 3.75 3 7.444 3 12c0 2.104.859 4.023 2.273 5.484L4.5 20.25l3.75-.75Z" />
    </svg>
  );
}

function ShareIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className="h-[18px] w-[18px] fill-none stroke-current" strokeWidth={1.8}>
      <path d="M16.5 8.25 12 3.75 7.5 8.25" />
      <path d="M12 4.5v10.5" />
      <path d="M6 12.75v4.125A2.625 2.625 0 0 0 8.625 19.5h6.75A2.625 2.625 0 0 0 18 16.875V12.75" />
    </svg>
  );
}

function GlobeIcon() {
  return (
    <svg viewBox="0 0 16 16" aria-hidden className="h-3.5 w-3.5 fill-current opacity-60">
      <path d="M8 1.5a6.5 6.5 0 1 0 0 13 6.5 6.5 0 0 0 0-13Zm5.02 3h-2.36a10.7 10.7 0 0 0-1.12-2.4A5.48 5.48 0 0 1 13.02 4.5ZM8 2.57c.58.74 1.08 1.74 1.42 2.93H6.58C6.92 4.31 7.42 3.31 8 2.57ZM5.46 4.5a10.7 10.7 0 0 0-1.12 2.4H1.98a5.48 5.48 0 0 1 3.48-2.4ZM1.98 7.5h2.36c.08.83.22 1.62.4 2.36H2.38A5.48 5.48 0 0 1 1.98 7.5Zm.4 3.14h2.36c.28.84.64 1.6 1.06 2.26H3.46A5.48 5.48 0 0 1 2.38 10.64Zm2.96 3.76c.42-.66.78-1.42 1.06-2.26h2.36c-.38 1.19-.88 2.19-1.46 2.93-1.02-.2-1.96-.52-2.96-.67Zm4.08.67c-.58-.74-1.08-1.74-1.42-2.93h2.84c-.34 1.19-.84 2.19-1.42 2.93ZM10.54 11.5c.18-.74.32-1.53.4-2.36h2.36a5.48 5.48 0 0 1-2.76 2.36c-.42-.66-.78-1.42-1.06-2.26Zm1.06-5.64c-.18-.74-.32-1.53-.4-2.36h2.36a5.48 5.48 0 0 1 2.76 2.36h-2.36c-.08.83-.22 1.62-.4 2.36Z" />
    </svg>
  );
}

type CommunityPostCardProps = {
  post: CommunityPost;
  onUpdate: (post: CommunityPost) => void;
  compact?: boolean;
};

export function CommunityPostCard({ post, onUpdate, compact = false }: CommunityPostCardProps) {
  const [commentDraft, setCommentDraft] = useState("");
  const [showAllComments, setShowAllComments] = useState(false);
  const [loading, setLoading] = useState(false);
  const [reacted, setReacted] = useState(false);
  const [shareMessage, setShareMessage] = useState("");
  const campus = getCampus(post.campusId);

  const comments = post.comments ?? [];
  const visibleComments = showAllComments ? comments : comments.slice(-2);
  const hiddenCommentCount = Math.max(0, comments.length - visibleComments.length);
  const timeLabel = formatCommunityTimeAgo(post.createdAt, post.timeAgo);

  const audienceLabel = useMemo(() => {
    if (post.targetGroupName) return post.targetGroupName;
    return campus.name;
  }, [campus.name, post.targetGroupName]);

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
      setShowAllComments(true);
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

  async function sharePost() {
    const text = `${post.author}: ${post.content}`.slice(0, 240);
    const url = `${window.location.origin}/community#post-${post.id}`;

    try {
      if (navigator.share) {
        await navigator.share({ title: "Shanah City Community", text, url });
        return;
      }
      await navigator.clipboard.writeText(`${text}\n${url}`);
      setShareMessage("Link copied");
    } catch {
      setShareMessage("Could not share");
    }

    window.setTimeout(() => setShareMessage(""), 2000);
  }

  return (
    <article id={`post-${post.id}`} className="community-post-card">
      <header className="flex items-start gap-2.5 px-3 pt-3">
        <CommunityAvatar name={post.author} authorId={post.authorId} size="md" />
        <div className="min-w-0 flex-1 pt-0.5">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <h3 className="truncate text-[15px] font-semibold leading-tight text-[#050505]">
                {post.author}
              </h3>
              <div className="mt-0.5 flex flex-wrap items-center gap-1 text-xs text-[#65676b]">
                <span>{timeLabel}</span>
                <span aria-hidden>·</span>
                <span className="inline-flex items-center gap-1">
                  {audienceLabel}
                  <GlobeIcon />
                </span>
              </div>
            </div>
            <span className="community-post-badge">{postTypeLabel(post.type)}</span>
          </div>
        </div>
      </header>

      <div className={`px-3 ${compact ? "pb-2 pt-2" : "pb-3 pt-2.5"}`}>
        <p className="whitespace-pre-wrap text-[15px] leading-[1.3333] text-[#050505]">
          {post.content}
        </p>
      </div>

      {post.mediaUrl ? (
        <div className="border-y border-[#dadde1] bg-black">
          {post.mediaType === "video" ? (
            <video
              src={post.mediaUrl}
              controls
              playsInline
              className="max-h-[32rem] w-full object-contain"
            />
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={post.mediaUrl}
              alt=""
              decoding="async"
              className="max-h-[32rem] w-full object-cover"
            />
          )}
        </div>
      ) : null}

      {(post.reactions > 0 || comments.length > 0) && (
        <div className="flex items-center justify-between px-3 py-2.5 text-xs text-[#65676b]">
          <div className="inline-flex items-center gap-1.5">
            {post.reactions > 0 ? (
              <>
                <span className="inline-flex h-[18px] w-[18px] items-center justify-center rounded-full bg-[#1877f2] text-[10px] text-white">
                  {reactionEmoji(post.type)}
                </span>
                <span>{post.reactions}</span>
              </>
            ) : null}
          </div>
          {comments.length > 0 ? (
            <button
              type="button"
              onClick={() => setShowAllComments(true)}
              className="hover:underline"
            >
              {comments.length} comment{comments.length === 1 ? "" : "s"}
            </button>
          ) : null}
        </div>
      )}

      <div className="mx-3 border-t border-[#dadde1]" />

      <div className="grid grid-cols-3 px-1 py-0.5">
        <button
          type="button"
          onClick={react}
          disabled={reacted}
          className={`community-action-btn ${reacted ? "community-action-btn-active" : ""}`}
        >
          <LikeIcon active={reacted} />
          <span>{reactionActionLabel(post.type)}</span>
        </button>
        <button
          type="button"
          onClick={() => {
            setShowAllComments(true);
            document.getElementById(`comment-input-${post.id}`)?.focus();
          }}
          className="community-action-btn"
        >
          <CommentIcon />
          <span>Comment</span>
        </button>
        <button type="button" onClick={sharePost} className="community-action-btn">
          <ShareIcon />
          <span>{shareMessage || "Share"}</span>
        </button>
      </div>

      {(visibleComments.length > 0 || !compact) && (
        <div className="space-y-2 px-3 pb-3 pt-1">
          {hiddenCommentCount > 0 && !showAllComments ? (
            <button
              type="button"
              onClick={() => setShowAllComments(true)}
              className="text-xs font-semibold text-[#65676b] hover:underline"
            >
              View previous comments
            </button>
          ) : null}

          {visibleComments.map((comment) => (
            <div key={comment.id} className="flex items-start gap-2">
              <CommunityAvatar name={comment.author} size="sm" />
              <div className="min-w-0 flex-1">
                <div className="community-comment-bubble">
                  <p className="text-[13px] font-semibold leading-tight text-[#050505]">
                    {comment.author}
                  </p>
                  <p className="mt-0.5 text-[15px] leading-snug text-[#050505]">{comment.content}</p>
                </div>
                <p className="mt-1 px-3 text-[11px] font-semibold text-[#65676b]">
                  {formatCommunityTimeAgo(comment.createdAt)}
                </p>
              </div>
            </div>
          ))}

          {!compact ? (
            <div className="flex items-center gap-2 pt-1">
              <CommunityAvatar name="You" size="sm" />
              <div className="relative min-w-0 flex-1">
                <input
                  id={`comment-input-${post.id}`}
                  value={commentDraft}
                  onChange={(event) => setCommentDraft(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" && !event.shiftKey) {
                      event.preventDefault();
                      void submitComment();
                    }
                  }}
                  placeholder="Write a comment..."
                  className="community-comment-input"
                />
                {commentDraft.trim() ? (
                  <button
                    type="button"
                    onClick={submitComment}
                    disabled={loading}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-xs font-semibold text-[#1877f2] disabled:opacity-50"
                  >
                    {loading ? "..." : "Post"}
                  </button>
                ) : null}
              </div>
            </div>
          ) : null}
        </div>
      )}
    </article>
  );
}
