"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { readJsonResponse } from "@/lib/read-json-response";

type LiveComment = {
  id: string;
  authorId: string;
  authorName: string;
  content: string;
  createdAt: string;
};

type CommunityLiveCommentsPanelProps = {
  statusId: string;
  compact?: boolean;
  className?: string;
};

export function CommunityLiveCommentsPanel({
  statusId,
  compact = false,
  className = "",
}: CommunityLiveCommentsPanelProps) {
  const [comments, setComments] = useState<LiveComment[]>([]);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const lastTimestampRef = useRef<string | null>(null);
  const scrollerRef = useRef<HTMLDivElement | null>(null);

  const pollComments = useCallback(async () => {
    const since = lastTimestampRef.current;
    const query = since
      ? `?statusId=${encodeURIComponent(statusId)}&since=${encodeURIComponent(since)}`
      : `?statusId=${encodeURIComponent(statusId)}`;
    try {
      const response = await fetch(`/api/community/live/comments${query}`, { cache: "no-store" });
      const data = await readJsonResponse<{ comments?: LiveComment[]; error?: string }>(response);
      if (!response.ok) return;
      const incoming = data.comments ?? [];
      if (incoming.length === 0) return;
      setComments((current) => {
        const ids = new Set(current.map((entry) => entry.id));
        const merged = [...current];
        for (const entry of incoming) {
          if (!ids.has(entry.id)) merged.push(entry);
        }
        return merged.slice(-120);
      });
      lastTimestampRef.current = incoming[incoming.length - 1]?.createdAt ?? since;
    } catch {
      // ignore poll errors
    }
  }, [statusId]);

  useEffect(() => {
    lastTimestampRef.current = null;
    setComments([]);
    void pollComments();
    const timer = window.setInterval(() => void pollComments(), 2500);
    return () => window.clearInterval(timer);
  }, [pollComments, statusId]);

  useEffect(() => {
    const scroller = scrollerRef.current;
    if (!scroller) return;
    scroller.scrollTop = scroller.scrollHeight;
  }, [comments.length]);

  async function submitComment(event: React.FormEvent) {
    event.preventDefault();
    if (!draft.trim() || busy) return;
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/community/live/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ statusId, content: draft.trim() }),
      });
      const data = await readJsonResponse<{ comment?: LiveComment; error?: string }>(response);
      if (!response.ok || !data.comment) {
        setError(data.error ?? "Could not send comment.");
        return;
      }
      setComments((current) => [...current, data.comment!].slice(-120));
      lastTimestampRef.current = data.comment.createdAt;
      setDraft("");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className={`community-live-comments ${compact ? "community-live-comments-compact" : ""} ${className}`}>
      <div ref={scrollerRef} className="community-live-comments-scroll" aria-live="polite">
        {comments.length === 0 ? (
          <p className="community-live-comments-empty">Be the first to comment on this live.</p>
        ) : (
          comments.map((comment) => (
            <div key={comment.id} className="community-live-comment">
              <span className="community-live-comment-author">{comment.authorName}</span>
              <span className="community-live-comment-text">{comment.content}</span>
            </div>
          ))
        )}
      </div>
      <form className="community-live-comments-form" onSubmit={(event) => void submitComment(event)}>
        <input
          type="text"
          value={draft}
          onChange={(event) => setDraft(event.target.value.slice(0, 280))}
          placeholder="Comment on live…"
          className="community-live-comments-input"
          maxLength={280}
        />
        <button type="submit" disabled={busy || !draft.trim()} className="community-live-comments-send">
          Send
        </button>
      </form>
      {error ? <p className="community-live-comments-error">{error}</p> : null}
    </div>
  );
}
