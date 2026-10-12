"use client";

import Link from "next/link";
import { choirSongSuggestionsHref } from "@/lib/choir-song-suggestion-links";
import type { ChoirSongSuggestionTabId } from "@/lib/choir-song-suggestion-types";

type SongSuggestionTabsProps = {
  groupId: string;
  active: ChoirSongSuggestionTabId;
};

const TABS: { id: ChoirSongSuggestionTabId; label: string }[] = [
  { id: "home", label: "Song Suggestions" },
  { id: "mine", label: "My Suggestions" },
  { id: "under_review", label: "Under Review" },
  { id: "approved", label: "Approved Songs" },
  { id: "guidelines", label: "Guidelines" },
];

export function SongSuggestionTabs({ groupId, active }: SongSuggestionTabsProps) {
  return (
    <div className="choir-song-suggestion-tabs" role="tablist" aria-label="Song suggestions">
      {TABS.map((tab) => {
        const isActive = tab.id === active;
        return (
          <Link
            key={tab.id}
            href={choirSongSuggestionsHref(groupId, tab.id)}
            role="tab"
            aria-selected={isActive}
            className={`choir-song-suggestion-tab ${isActive ? "choir-song-suggestion-tab-active" : ""}`}
          >
            {tab.label}
          </Link>
        );
      })}
    </div>
  );
}
