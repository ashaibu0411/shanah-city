"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { ChoirSetlistHeader } from "@/components/groups/choir/setlist/ChoirSetlistHeader";
import { CHOIR_HERO_IMAGE_PATH, SHANAH_WORSHIP_GROUP_ID } from "@/lib/choir-group-constants";
import { choirSongSuggestionsHref } from "@/lib/choir-song-suggestion-links";
import type { ChoirSongSuggestionDetailPayload } from "@/lib/choir-song-suggestion-types";
import { choirSongSuggestionStatusLabel } from "@/lib/choir-song-suggestion-media";
import "../choir-premium.css";

type ChoirSongSuggestionDetailPageProps = {
  groupId: string;
  suggestionId: string;
};

export function ChoirSongSuggestionDetailPage({ groupId, suggestionId }: ChoirSongSuggestionDetailPageProps) {
  const [detail, setDetail] = useState<ChoirSongSuggestionDetailPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [commentBody, setCommentBody] = useState("");
  const [busy, setBusy] = useState(false);
  const [leaderNote, setLeaderNote] = useState("");
  const [internalNote, setInternalNote] = useState("");
  const [libraryQuery, setLibraryQuery] = useState("");
  const [libraryHits, setLibraryHits] = useState<Array<{ id: string; title: string; artist?: string | null }>>([]);

  const load = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams({
      groupId,
      view: "detail",
      suggestionId,
    });
    fetch(`/api/groups/choir-song-suggestions?${params.toString()}`)
      .then((response) => response.json())
      .then((data) => {
        if (!data.detail) {
          setError(data.error ?? "Not found.");
          setDetail(null);
        } else {
          setDetail(data.detail);
          setLeaderNote(data.detail.suggestion.leadershipNote ?? "");
          setInternalNote(data.detail.suggestion.internalReviewNote ?? "");
          setError(null);
        }
        setLoading(false);
      })
      .catch(() => {
        setError("Could not load suggestion.");
        setLoading(false);
      });
  }, [groupId, suggestionId]);

  useEffect(() => {
    load();
    window.scrollTo(0, 0);
  }, [load]);

  async function postAction(body: Record<string, unknown>) {
    setBusy(true);
    const response = await fetch("/api/groups/choir-song-suggestions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ groupId: SHANAH_WORSHIP_GROUP_ID, ...body }),
    });
    setBusy(false);
    if (!response.ok) {
      const data = await response.json();
      alert(data.error ?? "Action failed.");
      return;
    }
    load();
  }

  async function searchLibrary() {
    const response = await fetch("/api/groups/choir-song-suggestions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "search_library",
        groupId: SHANAH_WORSHIP_GROUP_ID,
        query: libraryQuery || detail?.suggestion.title,
      }),
    });
    const data = await response.json();
    if (data.songs) setLibraryHits(data.songs);
  }

  if (loading && !detail) {
    return <p className="px-4 py-3 text-sm text-[var(--choir-muted)]">Loading…</p>;
  }

  if (error || !detail) {
    return <p className="px-4 py-3 text-sm text-red-700">{error ?? "Unavailable."}</p>;
  }

  const { suggestion, card, canManage, canEdit, canWithdraw, comments } = detail;
  const thumb = card.thumbnailUrl ?? CHOIR_HERO_IMAGE_PATH;

  return (
    <div className="choir-group-home choir-song-suggestions-page choir-calendar-page choir-page-shell space-y-4 pb-10">
      <ChoirSetlistHeader groupId={groupId} chatHref={`/groups/${groupId}?chat=1`} />
      <Link href={choirSongSuggestionsHref(groupId)} className="text-sm font-semibold text-[#AA751D]">
        ← Song suggestions
      </Link>

      <div className="choir-song-detail-hero">
        <Image src={thumb} alt="" width={400} height={200} className="choir-song-detail-img" />
        <div>
          <span className="choir-song-status-badge choir-song-status-review">
            {choirSongSuggestionStatusLabel(suggestion.status)}
          </span>
          <h1 className="mt-2 font-display text-2xl font-bold text-[var(--choir-heading)]">{suggestion.title}</h1>
          <p className="text-sm text-[var(--choir-muted)]">{suggestion.artist}</p>
        </div>
      </div>

      {suggestion.mediaUrl ? (
        <a href={suggestion.mediaUrl} target="_blank" rel="noreferrer" className="choir-btn-primary inline-flex w-full justify-center">
          Open song link
        </a>
      ) : null}

      <section className="choir-card space-y-2 p-4">
        <p className="text-xs font-bold uppercase tracking-wide text-[var(--choir-muted)]">Why this song</p>
        <p className="text-sm text-[var(--choir-body)] whitespace-pre-wrap">{suggestion.reason}</p>
        {suggestion.suggestedOccasion ? (
          <p className="text-sm text-[var(--choir-muted)]">
            <span className="font-semibold">Occasion:</span> {suggestion.suggestedOccasion}
          </p>
        ) : null}
        {suggestion.songType ? (
          <p className="text-sm text-[var(--choir-muted)]">
            <span className="font-semibold">Type:</span> {suggestion.songType}
          </p>
        ) : null}
        {suggestion.additionalNotes ? (
          <p className="text-sm text-[var(--choir-body)] whitespace-pre-wrap">{suggestion.additionalNotes}</p>
        ) : null}
        <p className="text-xs text-[var(--choir-muted)]">
          Submitted by {suggestion.submittedByName} · {new Date(suggestion.createdAt).toLocaleString()}
        </p>
      </section>

      {suggestion.leadershipNote ? (
        <section className="choir-card border-l-4 border-[#D6A64C] p-4">
          <p className="text-xs font-bold uppercase text-[var(--choir-muted)]">Leadership response</p>
          <p className="mt-1 text-sm text-[var(--choir-body)]">{suggestion.leadershipNote}</p>
        </section>
      ) : null}

      {detail.officialSongHref && detail.officialSongTitle ? (
        <Link href={detail.officialSongHref} className="choir-setlist-manage-link block text-center">
          View in song library: {detail.officialSongTitle} →
        </Link>
      ) : null}

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          className={`choir-song-support-chip ${card.viewerSupported ? "choir-song-support-chip-on" : ""}`}
          disabled={busy}
          onClick={() => postAction({ action: "toggle_support", suggestionId })}
        >
          ♥ {card.supportCount} Support
        </button>
        <span className="choir-song-comment-chip self-center">💬 {card.commentCount} comments</span>
      </div>

      <section className="space-y-3">
        <h2 className="font-display text-lg font-bold text-[var(--choir-heading)]">Discussion</h2>
        {comments.length === 0 ? (
          <p className="text-sm text-[var(--choir-muted)]">No comments yet.</p>
        ) : (
          comments.map((comment) => (
            <div key={comment.id} className="choir-card p-3">
              <p className="text-xs font-semibold text-[var(--choir-heading)]">{comment.userName}</p>
              <p className="mt-1 text-sm text-[var(--choir-body)]">{comment.body}</p>
              <p className="mt-1 text-[10px] text-[var(--choir-muted)]">
                {new Date(comment.createdAt).toLocaleString()}
              </p>
            </div>
          ))
        )}
        <form
          className="flex gap-2"
          onSubmit={(event) => {
            event.preventDefault();
            if (!commentBody.trim()) return;
            postAction({ action: "add_comment", suggestionId, body: commentBody }).then(() => setCommentBody(""));
          }}
        >
          <input
            className="choir-setlist-search min-h-[44px] flex-1"
            placeholder="Share a thoughtful comment…"
            value={commentBody}
            onChange={(e) => setCommentBody(e.target.value)}
          />
          <button type="submit" className="choir-btn-primary shrink-0 px-4" disabled={busy}>
            Post
          </button>
        </form>
      </section>

      {canWithdraw ? (
        <button
          type="button"
          className="text-sm font-semibold text-red-700"
          disabled={busy}
          onClick={() => postAction({ action: "withdraw", suggestionId })}
        >
          Withdraw suggestion
        </button>
      ) : null}

      {canEdit ? (
        <p className="text-xs text-[var(--choir-muted)]">
          You can edit this suggestion while it is still in Submitted status from My Suggestions (re-open form from home).
        </p>
      ) : null}

      {canManage ? (
        <section className="choir-card space-y-3 border border-[#EAE2D7] p-4">
          <h2 className="font-display text-lg font-bold text-[var(--choir-heading)]">Leadership review</h2>
          <textarea
            className="choir-announcement-textarea w-full min-h-[72px]"
            placeholder="Message to member (optional)"
            value={leaderNote}
            onChange={(e) => setLeaderNote(e.target.value)}
          />
          <textarea
            className="choir-announcement-textarea w-full min-h-[72px]"
            placeholder="Internal review note (not shown to members)"
            value={internalNote}
            onChange={(e) => setInternalNote(e.target.value)}
          />
          <div className="flex flex-wrap gap-2">
            {(["under_review", "approved", "declined", "needs_more_info"] as const).map((status) => (
              <button
                key={status}
                type="button"
                className="choir-song-review-btn"
                disabled={busy}
                onClick={() =>
                  postAction({
                    action: "review_status",
                    suggestionId,
                    status,
                    leadershipNote: leaderNote,
                    internalReviewNote: internalNote,
                  })
                }
              >
                {choirSongSuggestionStatusLabel(status)}
              </button>
            ))}
          </div>
          <div className="space-y-2 border-t border-[#EAE2D7] pt-3">
            <p className="text-sm font-semibold text-[var(--choir-heading)]">Add to song library</p>
            <div className="flex gap-2">
              <input
                className="choir-setlist-search min-h-[44px] flex-1"
                placeholder="Search library"
                value={libraryQuery}
                onChange={(e) => setLibraryQuery(e.target.value)}
              />
              <button type="button" className="choir-btn-primary px-3" onClick={() => searchLibrary()}>
                Search
              </button>
            </div>
            {libraryHits.map((song) => (
              <button
                key={song.id}
                type="button"
                className="choir-song-library-hit"
                disabled={busy}
                onClick={() =>
                  postAction({
                    action: "add_to_library",
                    suggestionId,
                    officialSongId: song.id,
                  })
                }
              >
                Link: {song.title} {song.artist ? `· ${song.artist}` : ""}
              </button>
            ))}
            <button
              type="button"
              className="choir-btn-primary w-full"
              disabled={busy}
              onClick={() => postAction({ action: "add_to_library", suggestionId })}
            >
              Create new library entry from suggestion
            </button>
          </div>
        </section>
      ) : null}
    </div>
  );
}
