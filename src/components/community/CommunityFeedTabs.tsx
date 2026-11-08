"use client";

import {
  COMMUNITY_FEED_FILTERS,
  type CommunityFeedFilter,
} from "@/lib/community-ui-utils";

export function CommunityFeedTabs({
  activeFilter,
  onChange,
  sticky = true,
  ariaLabel = "Feed filters",
}: {
  activeFilter: CommunityFeedFilter;
  onChange: (filter: CommunityFeedFilter) => void;
  sticky?: boolean;
  ariaLabel?: string;
}) {
  return (
    <div
      className={sticky ? "community-feed-tabs-sticky" : undefined}
      data-sticky={sticky ? "true" : undefined}
    >
      <div className="community-feed-tabs" role="tablist" aria-label={ariaLabel}>
        {COMMUNITY_FEED_FILTERS.map((entry) => {
          const active = activeFilter === entry.id;
          return (
            <button
              key={entry.id}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => onChange(entry.id)}
              className={`community-feed-tab ${active ? "community-feed-tab-active" : ""}`}
            >
              {entry.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
