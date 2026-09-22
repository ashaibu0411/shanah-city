"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useAuth } from "@/components/auth/AuthProvider";
import { getCampus } from "@/lib/site";
import type { Comment, CommunityPost } from "@/lib/member-types";
import { totalCommentCount } from "@/lib/community-comments";
import {
  COMMUNITY_SHARE_POST_TYPES,
  formatCommunityTimeAgo,
  postTypeLabel,
  reactionEmoji,
} from "@/lib/community-ui-utils";
import {
  postReactionButtons,
  topPostReactionEmojis,
  totalPostReactionCount,
  type CommunityPostReactionKind,
} from "@/lib/community-post-reactions";
import { CommunityAvatar } from "@/components/community/CommunityAvatar";
import { CommunityMediaCarousel } from "@/components/community/CommunityMediaCarousel";
import { canManageCommunityPostClient } from "@/lib/community-post-access";
import { isUrgentAlertCommunityPostId } from "@/lib/urgent-alert-utils";
import { canManageCommunityComment } from "@/lib/community-comment-access";
import { communityPostHasMedia, communityPostMediaItems } from "@/lib/community-post-media";

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
  onDelete?: (postId: string) => void;
  compact?: boolean;
};

type PostCommentRowProps = {
  comment: Comment;
  depth?: number;
  postId: string;
  reactionButtons: ReturnType<typeof postReactionButtons>;
  reactionBusy: boolean;
  manageBusy: boolean;
  canManageForComment: (comment: Comment) => boolean;
  onReact: (commentId: string, kind: CommunityPostReactionKind) => void;
  onReply: (comment: Comment) => void;
  onEdit: (commentId: string, content: string) => Promise<boolean>;
  onDelete: (commentId: string) => void;
};

function PostCommentRow({
  comment,
  depth = 0,
  postId,
  reactionButtons,
  reactionBusy,
  manageBusy,
  canManageForComment,
  onReact,
  onReply,
  onEdit,
  onDelete,
}: PostCommentRowProps) {
  const [editing, setEditing] = useState(false);
  const [editDraft, setEditDraft] = useState(comment.content);
  const [editError, setEditError] = useState("");

  useEffect(() => {
    if (!editing) {
      setEditDraft(comment.content);
      setEditError("");
    }
  }, [comment.content, editing]);

  const reactionTotal = totalPostReactionCount(comment.reactionCounts);
  const reactionSummaryEmojis =
    reactionTotal > 0 ? topPostReactionEmojis(comment.reactionCounts) : [];

  const canManageComment = canManageForComment(comment);

  function startEdit() {
    setEditDraft(comment.content);
    setEditError("");
    setEditing(true);
  }

  function cancelEdit() {
    setEditing(false);
    setEditDraft(comment.content);
    setEditError("");
  }

  function saveEdit() {
    const next = editDraft.trim();
    if (!next) {
      setEditError("Add a message.");
      return;
    }
    void (async () => {
      const saved = await onEdit(comment.id, next);
      if (saved) {
        setEditing(false);
      }
    })();
  }

  return (
    <div className={depth > 0 ? "mt-2 border-l-2 border-night-900/8 pl-2 dark:border-sand-100/10" : ""}>
      <div className="flex items-start gap-2">
        <CommunityAvatar name={comment.author} size="sm" />
        <div className="min-w-0 flex-1">
          {editing ? (
            <div className="space-y-2">
              <textarea
                value={editDraft}
                onChange={(event) => setEditDraft(event.target.value)}
                rows={2}
                className="w-full rounded-2xl border border-night-900/12 bg-sand-100 px-3 py-2 text-[15px] text-night-900 outline-none focus:border-clay-500 dark:border-white/15 dark:bg-night-900 dark:text-sand-100"
              />
              {editError ? <p className="text-xs text-red-600">{editError}</p> : null}
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  disabled={manageBusy}
                  onClick={saveEdit}
                  className="rounded-lg bg-clay-500 px-3 py-1.5 text-xs font-semibold text-sand-50 disabled:opacity-60"
                >
                  {manageBusy ? "Saving..." : "Save"}
                </button>
                <button
                  type="button"
                  disabled={manageBusy}
                  onClick={cancelEdit}
                  className="rounded-lg bg-sand-200 px-3 py-1.5 text-xs font-semibold text-night-900 disabled:opacity-60"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="community-comment-bubble">
                <p className="text-[13px] font-semibold leading-tight text-night-900 dark:text-sand-100">
                  {comment.author}
                </p>
                <p className="community-post-content mt-0.5 text-[15px] leading-snug text-night-900 dark:text-sand-100">
                  {comment.content}
                </p>
              </div>
              <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 px-1">
                <span className="text-[11px] font-semibold text-night-600">
                  {formatCommunityTimeAgo(comment.createdAt)}
                </span>
                {reactionTotal > 0 ? (
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-night-600">
                    <span className="inline-flex items-center -space-x-0.5">
                      {reactionSummaryEmojis.map((emoji, index) => (
                        <span key={`${comment.id}-rx-${index}`} className="text-[11px]">
                          {emoji}
                        </span>
                      ))}
                    </span>
                    {reactionTotal}
                  </span>
                ) : null}
                <button
                  type="button"
                  onClick={() => onReply(comment)}
                  className="text-[11px] font-semibold text-night-600 hover:text-clay-600"
                >
                  Reply
                </button>
                {canManageComment ? (
                  <>
                    <button
                      type="button"
                      onClick={startEdit}
                      disabled={manageBusy}
                      className="text-[11px] font-semibold text-night-600 hover:text-clay-600 disabled:opacity-50"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => onDelete(comment.id)}
                      disabled={manageBusy}
                      className="text-[11px] font-semibold text-rose-600 hover:text-rose-700 disabled:opacity-50"
                    >
                      Delete
                    </button>
                  </>
                ) : null}
              </div>
              <div
                className="community-comment-reactions mt-1 flex flex-wrap gap-0.5 px-0.5"
                role="toolbar"
                aria-label={`React to ${comment.author}'s comment`}
              >
                {reactionButtons.map((button) => {
                  const active = comment.viewerReactions?.includes(button.kind);
                  return (
                    <button
                      key={`${comment.id}-${button.kind}`}
                      type="button"
                      disabled={reactionBusy}
                      onClick={() => onReact(comment.id, button.kind)}
                      className={`community-comment-reaction-btn ${active ? "community-comment-reaction-btn-active" : ""}`}
                      aria-label={button.label}
                      aria-pressed={active}
                    >
                      <span aria-hidden>{button.emoji}</span>
                    </button>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </div>
      {!editing && comment.replies?.length ? (
        <div className="mt-1 space-y-0">
          {comment.replies.map((reply) => (
            <PostCommentRow
              key={reply.id}
              comment={reply}
              depth={depth + 1}
              postId={postId}
              reactionButtons={reactionButtons}
              reactionBusy={reactionBusy}
              manageBusy={manageBusy}
              canManageForComment={canManageForComment}
              onReact={onReact}
              onReply={onReply}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}

export function CommunityPostCard({
  post,
  onUpdate,
  onDelete,
  compact = false,
}: CommunityPostCardProps) {
  const { user, permissions } = useAuth();
  const menuButtonRef = useRef<HTMLButtonElement | null>(null);
  const [commentDraft, setCommentDraft] = useState("");
  const [replyingTo, setReplyingTo] = useState<Comment | null>(null);
  const [commentReactionBusy, setCommentReactionBusy] = useState(false);
  const [commentManageBusy, setCommentManageBusy] = useState(false);
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [reactionBusy, setReactionBusy] = useState(false);
  const [shareMessage, setShareMessage] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ top: 0, right: 16 });
  const [mounted, setMounted] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editDraft, setEditDraft] = useState(post.content);
  const [editType, setEditType] = useState<CommunityPost["type"]>(post.type);
  const [editError, setEditError] = useState("");
  const campus = getCampus(post.campusId);
  const isUrgentNews = isUrgentAlertCommunityPostId(post.id);

  const canManage = Boolean(
    post.canManage || canManageCommunityPostClient(user, post, permissions.canManageAdmin),
  );
  const canChangeType = post.type !== "announcement";

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!menuOpen) return;
    function closeMenu() {
      setMenuOpen(false);
    }
    window.addEventListener("scroll", closeMenu, true);
    window.addEventListener("resize", closeMenu);
    return () => {
      window.removeEventListener("scroll", closeMenu, true);
      window.removeEventListener("resize", closeMenu);
    };
  }, [menuOpen]);

  function openMenu() {
    const button = menuButtonRef.current;
    if (!button) return;
    const rect = button.getBoundingClientRect();
    setMenuPosition({
      top: rect.bottom + 6,
      right: Math.max(12, window.innerWidth - rect.right),
    });
    setMenuOpen(true);
  }

  useEffect(() => {
    if (!editing) {
      setEditDraft(post.content);
      setEditType(post.type);
      setEditError("");
    }
  }, [post.content, post.type, editing]);

  const comments = post.comments ?? [];
  const commentCount = totalCommentCount(comments);
  const timeLabel = formatCommunityTimeAgo(post.createdAt, post.timeAgo);
  const reactionButtons = postReactionButtons();
  const reactionTotal = totalPostReactionCount(post.reactionCounts, post.reactions);
  const reactionSummaryEmojis =
    post.reactionCounts && reactionTotal > 0
      ? topPostReactionEmojis(post.reactionCounts)
      : post.reactions > 0
        ? [reactionEmoji(post.type)]
        : [];

  function toggleComments(focusInput = false) {
    if (commentsOpen && !focusInput) {
      setCommentsOpen(false);
      return;
    }
    setCommentsOpen(true);
    if (focusInput) {
      window.setTimeout(() => {
        document.getElementById(`comment-input-${post.id}`)?.focus();
      }, 0);
    }
  }

  const audienceLabel = useMemo(() => {
    if (post.targetGroupName) return post.targetGroupName;
    return campus.name;
  }, [campus.name, post.targetGroupName]);

  async function submitComment() {
    if (!commentDraft.trim()) return;
    setLoading(true);
    const isReply = Boolean(replyingTo?.id);
    const response = await fetch("/api/community", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: isReply ? "reply" : "comment",
        postId: post.id,
        parentCommentId: replyingTo?.id,
        content: commentDraft.trim(),
      }),
    });
    const data = await response.json();
    setLoading(false);
    if (response.ok) {
      onUpdate(data.post);
      setCommentDraft("");
      setReplyingTo(null);
      setCommentsOpen(true);
    }
  }

  function commentCanManage(comment: Comment) {
    return Boolean(
      comment.canManage ??
        (user && canManageCommunityComment(user, comment, permissions.canManageAdmin)),
    );
  }

  async function editComment(commentId: string, content: string) {
    setCommentManageBusy(true);
    try {
      const response = await fetch("/api/community", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "editComment",
          postId: post.id,
          commentId,
          content,
        }),
      });
      const data = await response.json();
      if (response.ok) {
        onUpdate(data.post);
        return true;
      }
      return false;
    } finally {
      setCommentManageBusy(false);
    }
  }

  async function deleteComment(commentId: string) {
    if (!window.confirm("Delete this comment? Replies will be removed too.")) return;
    setCommentManageBusy(true);
    try {
      const response = await fetch("/api/community", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "deleteComment",
          postId: post.id,
          commentId,
        }),
      });
      const data = await response.json();
      if (response.ok) {
        onUpdate(data.post);
        if (replyingTo?.id === commentId) {
          setReplyingTo(null);
        }
      }
    } finally {
      setCommentManageBusy(false);
    }
  }

  async function toggleCommentReaction(commentId: string, kind: CommunityPostReactionKind) {
    if (commentReactionBusy) return;
    setCommentReactionBusy(true);
    try {
      const response = await fetch("/api/community", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "reactComment",
          postId: post.id,
          commentId,
          kind,
        }),
      });
      const data = await response.json();
      if (response.ok) {
        onUpdate(data.post);
      }
    } finally {
      setCommentReactionBusy(false);
    }
  }

  function startReply(comment: Comment) {
    setReplyingTo(comment);
    setCommentsOpen(true);
    window.setTimeout(() => {
      document.getElementById(`comment-input-${post.id}`)?.focus();
    }, 0);
  }

  async function toggleReaction(kind: CommunityPostReactionKind) {
    if (reactionBusy) return;
    setReactionBusy(true);
    try {
      const response = await fetch("/api/community", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "react", postId: post.id, kind }),
      });
      const data = await response.json();
      if (response.ok && data.post) {
        onUpdate(data.post);
      }
    } finally {
      setReactionBusy(false);
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

  async function saveEdit() {
    if (!editDraft.trim() && !communityPostHasMedia(post)) {
      setEditError("Add a message or keep the attached photo/video.");
      return;
    }

    setLoading(true);
    setEditError("");
    const response = await fetch("/api/community", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "edit",
        postId: post.id,
        content: editDraft.trim(),
        type: editType,
      }),
    });
    const data = await response.json();
    setLoading(false);

    if (!response.ok) {
      setEditError(data.error ?? "Could not save your changes.");
      return;
    }

    onUpdate({ ...data.post, canManage: true });
    setEditing(false);
    setMenuOpen(false);
  }

  async function deletePost() {
    if (!window.confirm("Delete this post? This cannot be undone.")) return;

    setLoading(true);
    setEditError("");
    const response = await fetch("/api/community", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "delete",
        postId: post.id,
      }),
    });
    const data = await response.json();
    setLoading(false);

    if (!response.ok) {
      setEditError(data.error ?? "Could not delete this post.");
      return;
    }

    onDelete?.(post.id);
    setMenuOpen(false);
  }

  const menu = menuOpen && mounted && canManage && !compact && !editing
    ? createPortal(
        <>
          <button
            type="button"
            className="fixed inset-0 z-[120] cursor-default bg-transparent"
            aria-label="Close post menu"
            onClick={() => setMenuOpen(false)}
          />
          <div
            className="fixed z-[121] min-w-[168px] overflow-hidden rounded-xl border border-night-900/10 bg-white py-1 shadow-lg"
            style={{ top: menuPosition.top, right: menuPosition.right }}
            role="menu"
          >
            <button
              type="button"
              role="menuitem"
              className="block w-full px-4 py-3 text-left text-sm font-semibold text-night-900 hover:bg-sand-100"
              onClick={() => {
                setMenuOpen(false);
                setEditing(true);
                setEditDraft(post.content);
                setEditType(post.type);
                setEditError("");
              }}
            >
              Edit post
            </button>
            <button
              type="button"
              role="menuitem"
              className="block w-full px-4 py-3 text-left text-sm font-semibold text-red-700 hover:bg-red-50"
              onClick={() => void deletePost()}
            >
              Delete post
            </button>
          </div>
        </>,
        document.body,
      )
    : null;

  return (
    <article
      id={`post-${post.id}`}
      className={`community-post-card scroll-mt-24 ${isUrgentNews ? "community-post-card-urgent" : ""}`}
    >
      <header className="community-post-header">
        <CommunityAvatar name={post.author} authorId={post.authorId} size="md" />
        <div className="community-post-header-main min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <p className="community-post-author min-w-0 flex-1 truncate">{post.author}</p>
            {canManage && !compact && !editing ? (
              <button
                ref={menuButtonRef}
                type="button"
                aria-label="Post options"
                aria-haspopup="menu"
                aria-expanded={menuOpen}
                onClick={() => (menuOpen ? setMenuOpen(false) : openMenu())}
                className="community-post-menu-btn -mr-1 shrink-0 rounded-full px-2 py-1 text-lg font-bold leading-none text-night-600 hover:bg-sand-100 dark:text-sand-300 dark:hover:bg-[var(--color-bg-soft)]"
              >
                •••
              </button>
            ) : null}
          </div>
          <p className="community-post-meta" title={`${timeLabel} · ${audienceLabel}`}>
            <span className="community-post-meta-type">
              {isUrgentNews ? "Urgent alert · News" : postTypeLabel(post.type)}
            </span>
            <span className="community-post-meta-dot" aria-hidden>
              ·
            </span>
            <span>{timeLabel}</span>
            <span className="community-post-meta-dot" aria-hidden>
              ·
            </span>
            <span className="min-w-0 truncate">{audienceLabel}</span>
            <GlobeIcon />
          </p>
        </div>
      </header>

      {editing ? (
        <div className="community-post-edit-panel space-y-3">
          {canChangeType ? (
            <div className="flex flex-wrap gap-2">
              {COMMUNITY_SHARE_POST_TYPES.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => setEditType(option.id)}
                  className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
                    editType === option.id
                      ? "bg-clay-500 text-sand-50"
                      : "bg-sand-100 text-night-900"
                  }`}
                >
                  {postTypeLabel(option.id)}
                </button>
              ))}
            </div>
          ) : (
            <p className="text-xs font-semibold text-night-600">
              Church news posts keep the News label. Edit the message below.
            </p>
          )}
          <textarea
            value={editDraft}
            onChange={(event) => setEditDraft(event.target.value)}
            rows={4}
            className="w-full rounded-2xl border border-night-900/12 bg-sand-100 px-3 py-2 text-[15px] text-night-900 outline-none focus:border-clay-500"
          />
          {editError ? <p className="text-sm text-red-600">{editError}</p> : null}
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => void saveEdit()}
              disabled={loading}
              className="rounded-lg bg-clay-500 px-4 py-2 text-sm font-semibold text-sand-50 disabled:opacity-60"
            >
              {loading ? "Saving..." : "Save changes"}
            </button>
            <button
              type="button"
              onClick={() => {
                setEditing(false);
                setEditDraft(post.content);
                setEditType(post.type);
                setEditError("");
              }}
              disabled={loading}
              className="rounded-lg bg-sand-200 px-4 py-2 text-sm font-semibold text-night-900 disabled:opacity-60"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <div className={`community-post-body ${compact ? "community-post-body-compact" : ""}`}>
          <p className="community-post-content whitespace-pre-wrap text-night-900 dark:text-sand-100">
            {post.content}
          </p>
        </div>
      )}

      {!editing && communityPostMediaItems(post).length > 0 ? (
        <div className="community-post-media">
          <CommunityMediaCarousel
            items={communityPostMediaItems(post)}
            imageFit={isUrgentNews || post.type === "announcement" ? "contain" : "cover"}
            flyerLayout={isUrgentNews || post.type === "announcement"}
          />
        </div>
      ) : null}

      {(reactionTotal > 0 || commentCount > 0) && (
        <div className="community-post-stats flex items-center justify-between text-xs text-night-600">
          <div className="inline-flex items-center gap-1.5">
            {reactionTotal > 0 ? (
              <>
                <span className="inline-flex items-center -space-x-1">
                  {reactionSummaryEmojis.map((emoji, index) => (
                    <span
                      key={`${emoji}-${index}`}
                      className="inline-flex h-[18px] w-[18px] items-center justify-center rounded-full bg-clay-500 text-[10px] text-sand-50 ring-2 ring-white dark:ring-[var(--color-surface)]"
                    >
                      {emoji}
                    </span>
                  ))}
                </span>
                <span>{reactionTotal}</span>
              </>
            ) : null}
          </div>
          {commentCount > 0 ? (
            <button
              type="button"
              onClick={() => toggleComments()}
              className="hover:underline"
            >
              {commentCount} comment{commentCount === 1 ? "" : "s"}
            </button>
          ) : null}
        </div>
      )}

      {!compact && !editing ? (
        <div
          className="community-post-reactions"
          role="toolbar"
          aria-label="React to post"
        >
          {reactionButtons.map((button) => {
            const active = post.viewerReactions?.includes(button.kind);
            return (
              <button
                key={button.kind}
                type="button"
                disabled={reactionBusy}
                onClick={() => void toggleReaction(button.kind)}
                className={`community-post-reaction-btn ${active ? "community-post-reaction-btn-active" : ""}`}
                aria-label={button.label}
                aria-pressed={active}
              >
                <span aria-hidden>{button.emoji}</span>
              </button>
            );
          })}
        </div>
      ) : null}

      <div className="community-post-divider border-t border-night-900/10" />

      <div className="community-post-actions grid grid-cols-2 py-0.5">
        <button
          type="button"
          onClick={() => toggleComments(true)}
          className={`community-action-btn ${commentsOpen ? "community-action-btn-active" : ""}`}
          aria-expanded={commentsOpen}
        >
          <CommentIcon />
          <span>{commentsOpen ? "Hide comments" : "Comment"}</span>
        </button>
        <button type="button" onClick={sharePost} className="community-action-btn">
          <ShareIcon />
          <span>{shareMessage || "Share"}</span>
        </button>
      </div>

      {commentsOpen && !compact ? (
        <div className="community-post-comments space-y-3 pt-1">
          {comments.length === 0 ? (
            <p className="px-1 text-sm text-night-500">No comments yet. Be the first.</p>
          ) : (
            comments.map((comment) => (
              <PostCommentRow
                key={comment.id}
                comment={comment}
                postId={post.id}
                reactionButtons={reactionButtons}
                reactionBusy={commentReactionBusy}
                manageBusy={commentManageBusy}
                canManageForComment={commentCanManage}
                onReact={(commentId, kind) => void toggleCommentReaction(commentId, kind)}
                onReply={startReply}
                onEdit={(commentId, content) => editComment(commentId, content)}
                onDelete={(commentId) => void deleteComment(commentId)}
              />
            ))
          )}

          {replyingTo ? (
            <div className="flex items-center justify-between gap-2 rounded-xl bg-sand-100 px-3 py-2 text-xs text-night-700 dark:bg-night-900/40 dark:text-sand-200">
              <span>
                Replying to <span className="font-semibold">{replyingTo.author}</span>
              </span>
              <button
                type="button"
                onClick={() => setReplyingTo(null)}
                className="font-semibold text-clay-600"
              >
                Cancel
              </button>
            </div>
          ) : null}

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
                placeholder={
                  replyingTo ? `Reply to ${replyingTo.author}...` : "Write a comment..."
                }
                className="community-comment-input"
              />
              {commentDraft.trim() ? (
                <button
                  type="button"
                  onClick={submitComment}
                  disabled={loading}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-xs font-semibold text-clay-600 disabled:opacity-50"
                >
                  {loading ? "..." : "Post"}
                </button>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}
      {menu}
    </article>
  );
}
