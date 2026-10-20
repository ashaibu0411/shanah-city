"use client";

import type { AssignmentListPageInfo } from "@/lib/marriage-counselor-assignment-list-pagination";
import { marriagePremium } from "@/components/marriage/marriage-counseling-premium";

type Props = {
  pageInfo: AssignmentListPageInfo | null;
  loadedCount: number;
  onLoadMore?: () => void;
  loadingMore?: boolean;
  label?: string;
};

export function MarriageAssignmentListPageFooter({
  pageInfo,
  loadedCount,
  onLoadMore,
  loadingMore,
  label = "records",
}: Props) {
  if (!pageInfo) return null;

  const total = pageInfo.totalCount;
  const summary =
    total === 0
      ? `No matching ${label}.`
      : pageInfo.allRecordsLoaded
        ? `Showing all ${total} matching ${label}.`
        : `Showing ${loadedCount} of ${total} matching ${label}. More are available.`;

  return (
    <div className="mt-4 space-y-2" role="status" aria-live="polite">
      <p className={`${marriagePremium.cardMuted} text-sm`}>{summary}</p>
      {pageInfo.hasMore && onLoadMore && (
        <button
          type="button"
          className={marriagePremium.secondaryCta}
          disabled={loadingMore}
          onClick={() => onLoadMore()}
        >
          {loadingMore ? "Loading…" : "Load more"}
        </button>
      )}
    </div>
  );
}
