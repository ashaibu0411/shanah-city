"use client";

import { brandLogos } from "@/lib/site";
import { messagingUi, type InboxFilter } from "@/lib/messaging-ui";

type ChatInboxChromeProps = {
  totalUnread: number;
  search: string;
  onSearchChange: (value: string) => void;
  filter: InboxFilter;
  onFilterChange: (filter: InboxFilter) => void;
  unreadCount: number;
  onNewMessage: () => void;
  onToggleSearchFocus?: () => void;
};

const FILTERS: Array<{ id: InboxFilter; label: string; badge?: number }> = [
  { id: "all", label: "All" },
  { id: "unread", label: "Unread" },
  { id: "groups", label: "Groups" },
  { id: "people", label: "People" },
];

export function ChatInboxChrome({
  totalUnread,
  search,
  onSearchChange,
  filter,
  onFilterChange,
  unreadCount,
  onNewMessage,
}: ChatInboxChromeProps) {
  return (
    <div className={messagingUi.inboxHeader}>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={brandLogos.light} alt="" className={messagingUi.inboxBrand} />
          <h1 className={messagingUi.inboxTitle}>
            Messages
            {totalUnread > 0 ? (
              <span className={messagingUi.rowBadge} aria-label={`${totalUnread} unread`}>
                {totalUnread > 99 ? "99+" : totalUnread}
              </span>
            ) : null}
          </h1>
        </div>
        <button type="button" className={messagingUi.inboxIconBtn} onClick={onNewMessage} aria-label="New message">
          <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" aria-hidden>
            <path
              d="M21 15a4 4 0 0 1-4 4H7l-4 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4v8Z"
              stroke="currentColor"
              strokeWidth="1.75"
              strokeLinejoin="round"
            />
            <path d="M12 8v8M8 12h8" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
          </svg>
        </button>
      </div>

      <div className={messagingUi.searchWrap}>
        <svg className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9a9188]" viewBox="0 0 20 20" fill="currentColor" aria-hidden>
          <path
            fillRule="evenodd"
            d="M9 3.5a5.5 5.5 0 1 0 0 11 5.5 5.5 0 0 0 0-11ZM2 9a7 7 0 1 1 12.452 4.391l3.328 3.329a.75.75 0 1 1-1.06 1.06l-3.329-3.328A7 7 0 0 1 2 9Z"
            clipRule="evenodd"
          />
        </svg>
        <input
          type="search"
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder="Search messages or people…"
          aria-label="Search messages or people"
          className={messagingUi.searchInput}
        />
        {search.trim() ? (
          <button
            type="button"
            className={messagingUi.searchClear}
            aria-label="Clear search"
            onClick={() => onSearchChange("")}
          >
            ×
          </button>
        ) : null}
      </div>

      <div className={messagingUi.filterTrack} role="tablist" aria-label="Inbox filters">
        {FILTERS.map((item) => {
          const badge = item.id === "unread" && unreadCount > 0 ? unreadCount : undefined;
          const active = filter === item.id;
          return (
            <button
              key={item.id}
              type="button"
              role="tab"
              aria-selected={active}
              className={active ? messagingUi.filterPillActive : messagingUi.filterPill}
              onClick={() => onFilterChange(item.id)}
            >
              {item.label}
              {badge ? <span className={messagingUi.rowBadge}>{badge > 99 ? "99+" : badge}</span> : null}
            </button>
          );
        })}
      </div>
    </div>
  );
}
