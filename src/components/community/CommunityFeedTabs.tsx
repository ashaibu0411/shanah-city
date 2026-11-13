"use client";

import {
  COMMUNITY_FEED_FILTERS,
  type CommunityFeedFilter,
} from "@/lib/community-ui-utils";

const V6_LABELS: Partial<Record<CommunityFeedFilter, string>> = {
  announcement: "Testimonies",
};

function FilterIcon({ filter }: { filter: CommunityFeedFilter }) {
  const common = "stroke-current fill-none";
  switch (filter) {
    case "all":
      return (
        <svg viewBox="0 0 24 24" className={common} aria-hidden>
          <circle cx="12" cy="12" r="9" strokeWidth="1.75" />
        </svg>
      );
    case "prayer":
      return (
        <svg viewBox="0 0 24 24" className={common} aria-hidden>
          <path
            d="M8 20V11M12 20V7M16 20v-6"
            strokeWidth="1.75"
            strokeLinecap="round"
          />
        </svg>
      );
    case "praise":
      return (
        <svg viewBox="0 0 24 24" className={common} aria-hidden>
          <path
            d="M9 18V7l4-2v11M9 18H6a1 1 0 0 1-1-1v-5a1 1 0 0 1 1-1h3M9 7l3-2 3 2"
            strokeWidth="1.75"
            strokeLinejoin="round"
          />
        </svg>
      );
    case "general":
      return (
        <svg viewBox="0 0 24 24" className={common} aria-hidden>
          <path
            d="M4 6h16M4 12h10M4 18h14"
            strokeWidth="1.75"
            strokeLinecap="round"
          />
        </svg>
      );
    case "announcement":
      return (
        <svg viewBox="0 0 24 24" className={common} aria-hidden>
          <path
            d="M5 7h14v10H5V7Zm3 13h8"
            strokeWidth="1.75"
            strokeLinejoin="round"
          />
        </svg>
      );
    default:
      return null;
  }
}

export function CommunityFeedTabs({
  activeFilter,
  onChange,
  sticky = true,
  ariaLabel = "Feed filters",
  variant = "default",
}: {
  activeFilter: CommunityFeedFilter;
  onChange: (filter: CommunityFeedFilter) => void;
  sticky?: boolean;
  ariaLabel?: string;
  variant?: "default" | "v6";
}) {
  const isV6 = variant === "v6";
  return (
    <div
      className={sticky ? "community-feed-tabs-sticky" : undefined}
      data-sticky={sticky ? "true" : undefined}
    >
      <div
        className={`community-feed-tabs${isV6 ? " community-feed-tabs--v6" : ""}`}
        role="tablist"
        aria-label={ariaLabel}
      >
        {COMMUNITY_FEED_FILTERS.map((entry) => {
          const active = activeFilter === entry.id;
          const label = isV6 ? (V6_LABELS[entry.id] ?? entry.label) : entry.label;
          return (
            <button
              key={entry.id}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => onChange(entry.id)}
              className={`community-feed-tab ${active ? "community-feed-tab-active" : ""}${
                isV6 ? " community-feed-tab--v6" : ""
              }`}
            >
              {isV6 ? <FilterIcon filter={entry.id} /> : null}
              {label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
