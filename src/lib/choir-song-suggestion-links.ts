import type { ChoirSongSuggestionTabId } from "@/lib/choir-song-suggestion-types";

export function choirSongSuggestionsHref(groupId: string, tab?: ChoirSongSuggestionTabId) {
  const base = `/groups/${encodeURIComponent(groupId)}/song-suggestions`;
  if (!tab || tab === "home") return base;
  const params = new URLSearchParams({ tab });
  return `${base}?${params.toString()}`;
}

export function choirSongSuggestionDetailHref(groupId: string, suggestionId: string) {
  return `/groups/${encodeURIComponent(groupId)}/song-suggestions/${encodeURIComponent(suggestionId)}`;
}

export function choirSongSuggestionReviewHref(groupId: string) {
  return `/groups/${encodeURIComponent(groupId)}/song-suggestions/review`;
}

export function choirSongSuggestionsListHref(groupId: string, tab: ChoirSongSuggestionTabId) {
  return choirSongSuggestionsHref(groupId, tab);
}
