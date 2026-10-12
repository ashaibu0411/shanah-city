export type ChoirSongSuggestionStatus =
  | "submitted"
  | "under_review"
  | "approved"
  | "added_to_library"
  | "declined"
  | "needs_more_info"
  | "withdrawn";

export type ChoirSongSuggestionType =
  | "praise"
  | "worship"
  | "hymn"
  | "spontaneous"
  | "other";

export type ChoirSongSuggestion = {
  id: string;
  groupId: string;
  title: string;
  normalizedTitle: string;
  artist: string;
  normalizedArtist: string;
  mediaUrl?: string | null;
  youtubeVideoId?: string | null;
  reason: string;
  suggestedOccasion?: string | null;
  songType?: ChoirSongSuggestionType | null;
  additionalNotes?: string | null;
  submittedBy: string;
  submittedByName: string;
  submittedByAvatarUrl?: string | null;
  createdAt: string;
  updatedAt: string;
  status: ChoirSongSuggestionStatus;
  officialSongId?: string | null;
  leadershipNote?: string | null;
  internalReviewNote?: string | null;
  reviewedBy?: string | null;
  reviewedByName?: string | null;
  reviewedAt?: string | null;
};

export type ChoirSongSuggestionSupport = {
  suggestionId: string;
  userId: string;
  createdAt: string;
};

export type ChoirSongSuggestionComment = {
  id: string;
  suggestionId: string;
  groupId: string;
  userId: string;
  userName: string;
  userAvatarUrl?: string | null;
  body: string;
  createdAt: string;
  updatedAt: string;
};

export type ChoirSongSuggestionStatusChange = {
  id: string;
  suggestionId: string;
  groupId: string;
  previousStatus: ChoirSongSuggestionStatus;
  newStatus: ChoirSongSuggestionStatus;
  reviewerId: string;
  reviewerName: string;
  reason?: string | null;
  createdAt: string;
};

export type ChoirSongSuggestionStore = {
  suggestions: ChoirSongSuggestion[];
  supports: ChoirSongSuggestionSupport[];
  comments: ChoirSongSuggestionComment[];
  statusHistory: ChoirSongSuggestionStatusChange[];
  guidelinesMarkdown: string | null;
};

export type ChoirSongSuggestionTabId =
  | "home"
  | "mine"
  | "under_review"
  | "approved"
  | "guidelines";

export type ChoirSongSuggestionCardView = {
  id: string;
  title: string;
  artist: string;
  reasonExcerpt: string;
  status: ChoirSongSuggestionStatus;
  statusLabel: string;
  submittedByName: string;
  submittedByAvatarUrl?: string | null;
  createdAt: string;
  relativeDate: string;
  supportCount: number;
  commentCount: number;
  viewerSupported: boolean;
  thumbnailUrl: string | null;
  mediaUrl: string | null;
  detailHref: string;
  durationLabel?: string | null;
};

export type ChoirSongSuggestionHomePayload = {
  groupId: string;
  groupChatHref: string;
  canManage: boolean;
  reviewQueueHref: string | null;
  recent: ChoirSongSuggestionCardView[];
  trending: ChoirSongSuggestionCardView[];
  guidelinesPreview: string;
};

export type ChoirSongSuggestionDetailPayload = {
  suggestion: ChoirSongSuggestion;
  card: ChoirSongSuggestionCardView;
  canManage: boolean;
  canEdit: boolean;
  canWithdraw: boolean;
  officialSongTitle?: string | null;
  officialSongHref?: string | null;
  comments: ChoirSongSuggestionComment[];
  statusHistory: ChoirSongSuggestionStatusChange[];
};

export const DEFAULT_SONG_SUGGESTION_GUIDELINES = `## Song Suggestion Guidelines

### Why We Suggest Songs
We want to encourage participation and discover songs that support the vision and spiritual direction of Shanah Worship.

### What to Consider
- Biblical message and theological soundness
- Suitability for congregational worship
- Alignment with the church's ministry direction
- Musical practicality, vocal range, and congregational participation
- Relevance to the intended service or occasion

### How Suggestions Are Reviewed
1. A member submits a song.
2. Leadership reviews the recommendation.
3. Leadership may discuss its suitability.
4. The song may be approved or declined.
5. Approved songs may be added to the library.
6. Worship leadership decides when or whether to schedule the song.

### Important Note
Song suggestions are recommendations, not requests that leadership is obligated to use.`;
