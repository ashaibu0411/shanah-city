"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { ChoirSetlistHeader } from "@/components/groups/choir/setlist/ChoirSetlistHeader";
import { choirSongSuggestionsHref } from "@/lib/choir-song-suggestion-links";
import "../choir-premium.css";

type ReviewRow = {
  id: string;
  title: string;
  artist: string;
  status: string;
  statusLabel: string;
  submittedByName: string;
  relativeDate: string;
  suggestedOccasion?: string | null;
  supportCount: number;
  detailHref: string;
  mediaUrl?: string | null;
};

type ChoirSongSuggestionReviewPageProps = {
  groupId: string;
};

export function ChoirSongSuggestionReviewPage({ groupId }: ChoirSongSuggestionReviewPageProps) {
  const [queue, setQueue] = useState<ReviewRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    setLoading(true);
    fetch(`/api/groups/choir-song-suggestions?groupId=${encodeURIComponent(groupId)}&view=review_queue`)
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) {
          setError(data.error ?? "Access denied.");
          setQueue(null);
        } else {
          setQueue(data.queue ?? []);
          setError(null);
        }
        setLoading(false);
      })
      .catch(() => {
        setError("Could not load review queue.");
        setLoading(false);
      });
  }, [groupId]);

  useEffect(() => {
    load();
    window.scrollTo(0, 0);
  }, [load]);

  if (loading) {
    return <p className="px-4 py-3 text-sm text-[var(--choir-muted)]">Loading review queue…</p>;
  }

  if (error) {
    return <p className="px-4 py-3 text-sm text-red-700">{error}</p>;
  }

  return (
    <div className="choir-group-home choir-song-suggestions-page choir-page-shell space-y-4 pb-10">
      <ChoirSetlistHeader groupId={groupId} chatHref={`/groups/${groupId}?chat=1`} />
      <Link href={choirSongSuggestionsHref(groupId)} className="text-sm font-semibold text-[#AA751D]">
        ← Song suggestions
      </Link>
      <h1 className="font-display text-2xl font-bold text-[var(--choir-heading)]">Review queue</h1>
      <p className="text-sm text-[var(--choir-muted)]">Pending and in-review submissions for worship leadership.</p>

      {!queue || queue.length === 0 ? (
        <p className="text-sm text-[var(--choir-muted)]">No items waiting for review.</p>
      ) : (
        <ul className="space-y-3">
          {queue.map((row) => (
            <li key={row.id} className="choir-card p-4">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-display text-lg font-bold text-[var(--choir-heading)]">{row.title}</p>
                  <p className="text-sm text-[var(--choir-muted)]">{row.artist}</p>
                  <p className="mt-1 text-xs text-[var(--choir-muted)]">
                    {row.submittedByName} · {row.relativeDate} · ♥ {row.supportCount}
                  </p>
                  {row.suggestedOccasion ? (
                    <p className="text-xs text-[var(--choir-body)]">Occasion: {row.suggestedOccasion}</p>
                  ) : null}
                </div>
                <span className="choir-song-status-badge choir-song-status-review">{row.statusLabel}</span>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <Link href={row.detailHref} className="choir-btn-primary px-4 py-2 text-sm">
                  Review
                </Link>
                {row.mediaUrl ? (
                  <a href={row.mediaUrl} target="_blank" rel="noreferrer" className="choir-song-review-btn">
                    Open link
                  </a>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
