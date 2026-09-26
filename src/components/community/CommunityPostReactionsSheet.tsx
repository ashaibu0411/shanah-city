"use client";

import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { COMMUNITY_POST_REACTION_KINDS } from "@/lib/community-post-reactions";
import { reactionMeta } from "@/lib/community-story-reactions";
import { formatCommunityTimeAgo } from "@/lib/community-ui-utils";
import type { PostReactionInsight } from "@/lib/community-post-reactions";

type CommunityPostReactionsSheetProps = {
  open: boolean;
  postId: string;
  onClose: () => void;
};

export function CommunityPostReactionsSheet({
  open,
  postId,
  onClose,
}: CommunityPostReactionsSheetProps) {
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [reactions, setReactions] = useState<PostReactionInsight[]>([]);

  useEffect(() => {
    setMounted(true);
  }, []);

  const loadReactions = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch(
        `/api/community/posts/${encodeURIComponent(postId)}/reactions`,
        { credentials: "include" },
      );
      const data = (await response.json()) as { reactions?: PostReactionInsight[]; error?: string };
      if (!response.ok) {
        setError(data.error ?? "Could not load reactions.");
        setReactions([]);
        return;
      }
      setReactions(data.reactions ?? []);
    } catch {
      setError("Could not load reactions.");
      setReactions([]);
    } finally {
      setLoading(false);
    }
  }, [postId]);

  useEffect(() => {
    if (!open) return;
    void loadReactions();
  }, [open, loadReactions]);

  useEffect(() => {
    if (!open) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  if (!open || !mounted) return null;

  return createPortal(
    <>
      <button
        type="button"
        className="community-story-insights-backdrop"
        aria-label="Close reactions"
        onClick={onClose}
      />
      <div
        className="community-story-insights-sheet"
        role="dialog"
        aria-labelledby="post-reactions-title"
      >
        <div className="community-story-insights-header">
          <h2 id="post-reactions-title" className="community-story-insights-title">
            Reactions
          </h2>
          <button type="button" onClick={onClose} className="community-story-insights-close">
            Close
          </button>
        </div>

        {loading ? (
          <p className="community-story-insights-status">Loading…</p>
        ) : error ? (
          <p className="community-story-insights-error">{error}</p>
        ) : reactions.length === 0 ? (
          <p className="community-story-insights-status">
            No emoji reactions yet — only the total count may show for older posts.
          </p>
        ) : (
          <div className="community-story-insights-body">
            {COMMUNITY_POST_REACTION_KINDS.map((kind) => {
              const rows = reactions.filter((row) => row.kind === kind);
              if (rows.length === 0) return null;
              const meta = reactionMeta(kind);
              return (
                <section key={kind} className="community-story-insights-section">
                  <h3 className="community-story-insights-section-title">
                    <span aria-hidden>{meta.emoji}</span>
                    {meta.label}
                    <span className="community-story-insights-section-count">{rows.length}</span>
                  </h3>
                  <ul className="community-story-insights-list">
                    {rows.map((row) => (
                      <li key={`${row.userId}-${row.kind}-${row.createdAt}`}>
                        <span className="community-story-insights-name">{row.name}</span>
                        <span className="community-story-insights-time">
                          {formatCommunityTimeAgo(row.createdAt)}
                        </span>
                      </li>
                    ))}
                  </ul>
                </section>
              );
            })}
          </div>
        )}
      </div>
    </>,
    document.body,
  );
}
