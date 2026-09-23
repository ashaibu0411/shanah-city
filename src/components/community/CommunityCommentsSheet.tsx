"use client";

import type { ReactNode } from "react";
import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import type { Comment, CommunityPost } from "@/lib/member-types";
import { IgShareIcon } from "@/components/community/CommunityPostIcons";
import { CommunityAvatar } from "@/components/community/CommunityAvatar";
import {
  postReactionButtons,
  type CommunityPostReactionKind,
} from "@/lib/community-post-reactions";

type CommunityCommentsSheetProps = {
  open: boolean;
  onClose: () => void;
  post: CommunityPost;
  comments: Comment[];
  commentDraft: string;
  onCommentDraftChange: (value: string) => void;
  onSubmitComment: () => void;
  submitting: boolean;
  replyingTo: Comment | null;
  onCancelReply: () => void;
  sharePost: () => void;
  onTogglePostReaction: (kind: CommunityPostReactionKind) => void;
  reactionBusy: boolean;
  renderComment: (comment: Comment) => ReactNode;
};

export function CommunityCommentsSheet({
  open,
  onClose,
  post,
  comments,
  commentDraft,
  onCommentDraftChange,
  onSubmitComment,
  submitting,
  replyingTo,
  onCancelReply,
  sharePost,
  onTogglePostReaction,
  reactionBusy,
  renderComment,
}: CommunityCommentsSheetProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const reactionButtons = postReactionButtons();

  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

  useEffect(() => {
    if (open) {
      window.setTimeout(() => inputRef.current?.focus(), 120);
    }
  }, [open]);

  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <div className="community-comments-sheet" role="dialog" aria-modal aria-label="Comments">
      <button type="button" className="community-comments-sheet-backdrop" aria-label="Close comments" onClick={onClose} />
      <div className="community-comments-sheet-panel">
        <div className="community-comments-sheet-handle" aria-hidden />
        <header className="community-comments-sheet-header">
          <p className="text-sm font-semibold text-night-900 dark:text-sand-100">Comments</p>
          <button
            type="button"
            onClick={sharePost}
            className="rounded-full p-2 text-night-800 hover:bg-sand-100 dark:text-sand-100 dark:hover:bg-night-800"
            aria-label="Share post"
          >
            <IgShareIcon />
          </button>
        </header>

        <div className="community-comments-sheet-scroll">
          {comments.length === 0 ? (
            <p className="px-4 py-8 text-center text-sm text-night-500">No comments yet. Start the conversation.</p>
          ) : (
            comments.map((comment) => (
              <div key={comment.id} className="px-3">
                {renderComment(comment)}
              </div>
            ))
          )}
        </div>

        <footer className="community-comments-sheet-footer">
          <div className="community-comments-sheet-emoji-row" role="toolbar" aria-label="React to post">
            {reactionButtons.map((button) => {
              const active = post.viewerReactions?.includes(button.kind);
              return (
                <button
                  key={button.kind}
                  type="button"
                  disabled={reactionBusy}
                  onClick={() => onTogglePostReaction(button.kind)}
                  className={`community-comments-sheet-emoji-btn ${active ? "community-comments-sheet-emoji-btn-active" : ""}`}
                  aria-label={button.label}
                  aria-pressed={active}
                >
                  {button.emoji}
                </button>
              );
            })}
          </div>

          {replyingTo ? (
            <div className="mb-2 flex items-center justify-between gap-2 px-1 text-xs text-night-600 dark:text-sand-300">
              <span>
                Replying to <span className="font-semibold">{replyingTo.author}</span>
              </span>
              <button type="button" onClick={onCancelReply} className="font-semibold text-clay-600">
                Cancel
              </button>
            </div>
          ) : null}

          <div className="flex items-center gap-2">
            <CommunityAvatar name="You" size="sm" />
            <div className="relative min-w-0 flex-1">
              <input
                ref={inputRef}
                value={commentDraft}
                onChange={(event) => onCommentDraftChange(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && !event.shiftKey) {
                    event.preventDefault();
                    onSubmitComment();
                  }
                }}
                placeholder={replyingTo ? `Reply to ${replyingTo.author}…` : `Add a comment for ${post.author}…`}
                className="community-comments-sheet-input"
              />
              {commentDraft.trim() ? (
                <button
                  type="button"
                  onClick={onSubmitComment}
                  disabled={submitting}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-clay-600 disabled:opacity-50"
                >
                  {submitting ? "…" : "Post"}
                </button>
              ) : null}
            </div>
          </div>
        </footer>
      </div>
    </div>,
    document.body,
  );
}
