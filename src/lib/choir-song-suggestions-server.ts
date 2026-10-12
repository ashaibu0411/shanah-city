import type { PublicMember } from "@/lib/auth-types";
import { canManageAsAdmin } from "@/lib/admin-access-server";
import { CHOIR_HERO_IMAGE_PATH, SHANAH_WORSHIP_GROUP_ID } from "@/lib/choir-group-constants";
import {
  choirSongSuggestionDetailHref,
  choirSongSuggestionReviewHref,
} from "@/lib/choir-song-suggestion-links";
import {
  choirSongSuggestionStatusLabel,
  normalizeSongField,
  suggestionThumbnailUrl,
  validateSuggestionMediaUrl,
} from "@/lib/choir-song-suggestion-media";
import type {
  ChoirSongSuggestion,
  ChoirSongSuggestionCardView,
  ChoirSongSuggestionDetailPayload,
  ChoirSongSuggestionHomePayload,
  ChoirSongSuggestionStatus,
  ChoirSongSuggestionTabId,
} from "@/lib/choir-song-suggestion-types";
import { DEFAULT_SONG_SUGGESTION_GUIDELINES as DEFAULT_GUIDELINES } from "@/lib/choir-song-suggestion-types";
import { isGroupLeaderOrAssistant } from "@/lib/group-admin-utils";
import { getGroupDetail, getGroups } from "@/lib/group-server";
import { canManageGroupEvents } from "@/lib/group-permissions-server";
import { isMemberTrainingRequired } from "@/lib/ministry-readiness-server";
import { sendPushToUsers } from "@/lib/push-server";
import {
  addChoirSongSuggestionCommentJson,
  appendChoirSongSuggestionStatusJson,
  deleteChoirSongSuggestionCommentJson,
  getChoirSongSuggestionGuidelinesJson,
  getChoirSongSuggestionJson,
  listChoirSongSuggestionCommentsJson,
  listChoirSongSuggestionStatusHistoryJson,
  listChoirSongSuggestionSupportsJson,
  listChoirSongSuggestionsJson,
  saveChoirSongSuggestionGuidelinesJson,
  toggleChoirSongSuggestionSupportJson,
  updateChoirSongSuggestionCommentJson,
  upsertChoirSongSuggestionJson,
} from "@/lib/stores/choir-song-suggestions-json";
import {
  getWorshipLibrarySong,
  listWorshipLibrarySongs,
  saveWorshipLibrarySong,
} from "@/lib/worship-song-library-server";
import { randomUUID } from "crypto";

function groupChatHref(groupId: string) {
  return `/groups/${encodeURIComponent(groupId)}?chat=1`;
}

function excerpt(text: string, max = 120) {
  const trimmed = text.trim();
  if (trimmed.length <= max) return trimmed;
  return `${trimmed.slice(0, max - 1)}…`;
}

function relativeDateLabel(iso: string) {
  const then = new Date(iso).getTime();
  const now = Date.now();
  const days = Math.floor((now - then) / 86_400_000);
  if (days <= 0) return "Today";
  if (days === 1) return "1 day ago";
  if (days < 7) return `${days} days ago`;
  const weeks = Math.floor(days / 7);
  if (weeks === 1) return "1 week ago";
  if (weeks < 5) return `${weeks} weeks ago`;
  return new Date(iso).toLocaleDateString();
}

export async function assertChoirSongSuggestionsAccess(user: PublicMember, groupId: string) {
  if (groupId !== SHANAH_WORSHIP_GROUP_ID) return null;
  const group = await getGroupDetail(groupId, user.id);
  if (!group?.isMember && !(await canManageAsAdmin(user))) return null;
  if (group?.isMember && (await isMemberTrainingRequired(user.id, group))) return null;
  return group;
}

export async function canManageChoirSongSuggestions(user: PublicMember, groupId: string) {
  if (groupId !== SHANAH_WORSHIP_GROUP_ID) return false;
  if (await canManageAsAdmin(user)) return true;
  return canManageGroupEvents(user, groupId);
}

async function worshipLeaderUserIds(groupId: string, excludeUserId?: string) {
  const groups = await getGroups();
  const group = groups.find((entry) => entry.id === groupId);
  if (!group) return [];
  return group.memberIds.filter((memberId) => {
    if (excludeUserId && memberId === excludeUserId) return false;
    return isGroupLeaderOrAssistant(group, memberId);
  });
}

function isVisibleToGroup(suggestion: ChoirSongSuggestion, viewerId: string, canManage: boolean) {
  if (canManage) return true;
  if (suggestion.submittedBy === viewerId) return true;
  if (suggestion.status === "declined" || suggestion.status === "withdrawn") return false;
  return true;
}

function canMemberEdit(suggestion: ChoirSongSuggestion, userId: string) {
  return suggestion.submittedBy === userId && suggestion.status === "submitted";
}

function canMemberWithdraw(suggestion: ChoirSongSuggestion, userId: string) {
  return suggestion.submittedBy === userId && (suggestion.status === "submitted" || suggestion.status === "needs_more_info");
}

async function supportCountsForSuggestions(suggestionIds: string[]) {
  const supports = await listChoirSongSuggestionSupportsJson();
  const map = new Map<string, number>();
  for (const row of supports) {
    if (!suggestionIds.includes(row.suggestionId)) continue;
    map.set(row.suggestionId, (map.get(row.suggestionId) ?? 0) + 1);
  }
  return map;
}

async function commentCountsForSuggestions(suggestionIds: string[]) {
  const map = new Map<string, number>();
  for (const id of suggestionIds) {
    const comments = await listChoirSongSuggestionCommentsJson(id);
    map.set(id, comments.length);
  }
  return map;
}

function viewerSupportedSet(supports: Awaited<ReturnType<typeof listChoirSongSuggestionSupportsJson>>, userId: string) {
  const set = new Set<string>();
  for (const row of supports) {
    if (row.userId === userId) set.add(row.suggestionId);
  }
  return set;
}

function trendingScore(suggestion: ChoirSongSuggestion, supportCount: number, commentCount: number) {
  const ageDays = (Date.now() - new Date(suggestion.createdAt).getTime()) / 86_400_000;
  const engagement = supportCount * 2 + commentCount * 3;
  const decay = Math.exp(-ageDays / 14);
  return engagement * decay;
}

async function toCardView(
  groupId: string,
  suggestion: ChoirSongSuggestion,
  supportCount: number,
  commentCount: number,
  viewerSupported: boolean,
): Promise<ChoirSongSuggestionCardView> {
  return {
    id: suggestion.id,
    title: suggestion.title,
    artist: suggestion.artist,
    reasonExcerpt: excerpt(suggestion.reason),
    status: suggestion.status,
    statusLabel: choirSongSuggestionStatusLabel(suggestion.status),
    submittedByName: suggestion.submittedByName,
    submittedByAvatarUrl: suggestion.submittedByAvatarUrl,
    createdAt: suggestion.createdAt,
    relativeDate: relativeDateLabel(suggestion.createdAt),
    supportCount,
    commentCount,
    viewerSupported,
    thumbnailUrl: suggestionThumbnailUrl(suggestion),
    mediaUrl: suggestion.mediaUrl ?? null,
    detailHref: choirSongSuggestionDetailHref(groupId, suggestion.id),
  };
}

export type DuplicateCheckResult = {
  similarSuggestions: Array<{ id: string; title: string; artist: string; status: string }>;
  libraryMatches: Array<{ id: string; title: string; artist?: string | null }>;
};

export async function checkSongSuggestionDuplicates(
  groupId: string,
  title: string,
  artist: string,
): Promise<DuplicateCheckResult> {
  const normTitle = normalizeSongField(title);
  const normArtist = normalizeSongField(artist);
  const suggestions = await listChoirSongSuggestionsJson(groupId);
  const similarSuggestions = suggestions
    .filter((row) => {
      if (row.status === "withdrawn" || row.status === "declined") return false;
      return row.normalizedTitle === normTitle && row.normalizedArtist === normArtist;
    })
    .slice(0, 5)
    .map((row) => ({ id: row.id, title: row.title, artist: row.artist, status: row.status }));

  const library = await listWorshipLibrarySongs();
  const libraryMatches = library
    .filter((song) => {
      const t = normalizeSongField(song.title);
      const a = normalizeSongField(song.artist ?? "");
      return t === normTitle && (normArtist === "" || a === normArtist || a.includes(normArtist) || normArtist.includes(a));
    })
    .slice(0, 5)
    .map((song) => ({ id: song.id, title: song.title, artist: song.artist }));

  return { similarSuggestions, libraryMatches };
}

export async function buildChoirSongSuggestionHomePayload(
  user: PublicMember,
  groupId: string,
): Promise<ChoirSongSuggestionHomePayload | null> {
  const group = await assertChoirSongSuggestionsAccess(user, groupId);
  if (!group) return null;

  const canManage = await canManageChoirSongSuggestions(user, groupId);
  const all = await listChoirSongSuggestionsJson(groupId);
  const visible = all.filter((row) => isVisibleToGroup(row, user.id, canManage));
  const ids = visible.map((row) => row.id);
  const supports = await listChoirSongSuggestionSupportsJson();
  const supportMap = await supportCountsForSuggestions(ids);
  const commentMap = await commentCountsForSuggestions(ids);
  const supported = viewerSupportedSet(supports, user.id);

  const recent = await Promise.all(
    visible.slice(0, 8).map((row) =>
      toCardView(
        groupId,
        row,
        supportMap.get(row.id) ?? 0,
        commentMap.get(row.id) ?? 0,
        supported.has(row.id),
      ),
    ),
  );

  const trendingSorted = [...visible]
    .map((row) => ({
      row,
      score: trendingScore(row, supportMap.get(row.id) ?? 0, commentMap.get(row.id) ?? 0),
    }))
    .sort((a, b) => b.score - a.score || b.row.createdAt.localeCompare(a.row.createdAt))
    .slice(0, 6);

  const trending =
    trendingSorted.some((entry) => entry.score > 0)
      ? await Promise.all(
          trendingSorted.map(({ row }) =>
            toCardView(
              groupId,
              row,
              supportMap.get(row.id) ?? 0,
              commentMap.get(row.id) ?? 0,
              supported.has(row.id),
            ),
          ),
        )
      : recent.slice(0, 4);

  const guidelinesStored = await getChoirSongSuggestionGuidelinesJson();
  const guidelinesPreview = excerpt(
    (guidelinesStored ?? DEFAULT_GUIDELINES).replace(/^#+\s*/gm, "").trim(),
    200,
  );

  return {
    groupId,
    groupChatHref: groupChatHref(groupId),
    canManage,
    reviewQueueHref: canManage ? choirSongSuggestionReviewHref(groupId) : null,
    recent,
    trending,
    guidelinesPreview,
  };
}

export async function listChoirSongSuggestionCards(
  user: PublicMember,
  groupId: string,
  tab: ChoirSongSuggestionTabId,
) {
  const group = await assertChoirSongSuggestionsAccess(user, groupId);
  if (!group) return null;

  const canManage = await canManageChoirSongSuggestions(user, groupId);
  const all = await listChoirSongSuggestionsJson(groupId);
  let filtered = all;

  if (tab === "mine") {
    filtered = all.filter((row) => row.submittedBy === user.id);
  } else if (tab === "under_review") {
    filtered = all.filter((row) => row.status === "under_review" || row.status === "submitted");
    if (!canManage) {
      filtered = filtered.filter((row) => isVisibleToGroup(row, user.id, false));
    }
  } else if (tab === "approved") {
    filtered = all.filter((row) => row.status === "approved" || row.status === "added_to_library");
  } else {
    filtered = all.filter((row) => isVisibleToGroup(row, user.id, canManage));
  }

  const ids = filtered.map((row) => row.id);
  const supports = await listChoirSongSuggestionSupportsJson();
  const supportMap = await supportCountsForSuggestions(ids);
  const commentMap = await commentCountsForSuggestions(ids);
  const supported = viewerSupportedSet(supports, user.id);

  return Promise.all(
    filtered.map((row) =>
      toCardView(
        groupId,
        row,
        supportMap.get(row.id) ?? 0,
        commentMap.get(row.id) ?? 0,
        supported.has(row.id),
      ),
    ),
  );
}

export async function getChoirSongSuggestionDetail(
  user: PublicMember,
  groupId: string,
  suggestionId: string,
): Promise<ChoirSongSuggestionDetailPayload | null> {
  const group = await assertChoirSongSuggestionsAccess(user, groupId);
  if (!group) return null;

  const suggestion = await getChoirSongSuggestionJson(groupId, suggestionId);
  if (!suggestion) return null;

  const canManage = await canManageChoirSongSuggestions(user, groupId);
  if (!isVisibleToGroup(suggestion, user.id, canManage)) return null;

  const supports = await listChoirSongSuggestionSupportsJson(suggestionId);
  const comments = await listChoirSongSuggestionCommentsJson(suggestionId);
  const history = canManage
    ? await listChoirSongSuggestionStatusHistoryJson(suggestionId)
    : [];

  const card = await toCardView(
    groupId,
    suggestion,
    supports.length,
    comments.length,
    supports.some((row) => row.userId === user.id),
  );

  let officialSongTitle: string | null = null;
  let officialSongHref: string | null = null;
  if (suggestion.officialSongId) {
    const song = await getWorshipLibrarySong(suggestion.officialSongId);
    if (song) {
      officialSongTitle = song.title;
      officialSongHref = `/groups/${encodeURIComponent(groupId)}/setlists?view=library`;
    }
  }

  return {
    suggestion,
    card,
    canManage,
    canEdit: canMemberEdit(suggestion, user.id),
    canWithdraw: canMemberWithdraw(suggestion, user.id),
    officialSongTitle,
    officialSongHref,
    comments,
    statusHistory: history,
  };
}

export async function getChoirSongSuggestionGuidelines(user: PublicMember, groupId: string) {
  const group = await assertChoirSongSuggestionsAccess(user, groupId);
  if (!group) return null;
  const stored = await getChoirSongSuggestionGuidelinesJson();
  const canManage = await canManageChoirSongSuggestions(user, groupId);
  return {
    markdown: stored ?? DEFAULT_GUIDELINES,
    canManage,
    heroImagePath: CHOIR_HERO_IMAGE_PATH,
  };
}

async function notifyLeadersNewSuggestion(groupId: string, user: PublicMember, title: string, suggestionId: string) {
  const leaderIds = await worshipLeaderUserIds(groupId, user.id);
  if (leaderIds.length === 0) return;
  const url = choirSongSuggestionDetailHref(groupId, suggestionId);
  void sendPushToUsers(
    leaderIds,
    {
      title: "New song suggestion",
      body: `${user.name} suggested “${title}”.`,
      url,
    },
    "worship",
  );
}

async function notifySubmitter(
  userId: string,
  title: string,
  body: string,
  url: string,
) {
  void sendPushToUsers([userId], { title, body, url }, "worship");
}

export async function handleChoirSongSuggestionAction(user: PublicMember, body: Record<string, unknown>) {
  const action = String(body.action ?? "");
  const groupId = String(body.groupId ?? SHANAH_WORSHIP_GROUP_ID);

  if (action === "check_duplicates") {
    if (!(await assertChoirSongSuggestionsAccess(user, groupId))) {
      throw new Error("Access denied.");
    }
    const title = String(body.title ?? "");
    const artist = String(body.artist ?? "");
    return { duplicates: await checkSongSuggestionDuplicates(groupId, title, artist) };
  }

  if (action === "submit") {
    const group = await assertChoirSongSuggestionsAccess(user, groupId);
    if (!group) throw new Error("Access denied.");

    const title = String(body.title ?? "").trim();
    const artist = String(body.artist ?? "").trim();
    const reason = String(body.reason ?? "").trim();
    if (!title || !artist || !reason) {
      throw new Error("Song title, artist, and reason are required.");
    }

    const media = validateSuggestionMediaUrl(String(body.mediaUrl ?? ""));
    if (!media.ok) throw new Error(media.error ?? "Invalid media link.");

    const now = new Date().toISOString();
    const suggestion: ChoirSongSuggestion = {
      id: randomUUID(),
      groupId,
      title,
      normalizedTitle: normalizeSongField(title),
      artist,
      normalizedArtist: normalizeSongField(artist),
      mediaUrl: media.normalized || null,
      youtubeVideoId: media.youtubeVideoId ?? null,
      reason,
      suggestedOccasion: String(body.suggestedOccasion ?? "").trim() || null,
      songType: (body.songType as ChoirSongSuggestion["songType"]) || null,
      additionalNotes: String(body.additionalNotes ?? "").trim() || null,
      submittedBy: user.id,
      submittedByName: user.name,
      submittedByAvatarUrl: user.avatarUrl ?? null,
      createdAt: now,
      updatedAt: now,
      status: "submitted",
    };

    await upsertChoirSongSuggestionJson(suggestion);
    await appendChoirSongSuggestionStatusJson({
      suggestionId: suggestion.id,
      groupId,
      previousStatus: "submitted",
      newStatus: "submitted",
      reviewerId: user.id,
      reviewerName: user.name,
      reason: "Submitted",
      createdAt: now,
    });

    void notifyLeadersNewSuggestion(groupId, user, title, suggestion.id);
    return { suggestion, message: "Thank you! Your song suggestion has been submitted." };
  }

  if (action === "update") {
    const suggestionId = String(body.suggestionId ?? "");
    const existing = await getChoirSongSuggestionJson(groupId, suggestionId);
    if (!existing) throw new Error("Suggestion not found.");
    if (!canMemberEdit(existing, user.id)) {
      throw new Error("This suggestion can no longer be edited.");
    }

    const title = String(body.title ?? existing.title).trim();
    const artist = String(body.artist ?? existing.artist).trim();
    const reason = String(body.reason ?? existing.reason).trim();
    const media = validateSuggestionMediaUrl(
      body.mediaUrl !== undefined ? String(body.mediaUrl) : existing.mediaUrl ?? "",
    );
    if (!media.ok) throw new Error(media.error ?? "Invalid media link.");

    const updated: ChoirSongSuggestion = {
      ...existing,
      title,
      artist,
      normalizedTitle: normalizeSongField(title),
      normalizedArtist: normalizeSongField(artist),
      reason,
      mediaUrl: media.normalized || null,
      youtubeVideoId: media.youtubeVideoId ?? null,
      suggestedOccasion:
        body.suggestedOccasion !== undefined
          ? String(body.suggestedOccasion).trim() || null
          : existing.suggestedOccasion,
      songType: (body.songType as ChoirSongSuggestion["songType"]) ?? existing.songType,
      additionalNotes:
        body.additionalNotes !== undefined
          ? String(body.additionalNotes).trim() || null
          : existing.additionalNotes,
      updatedAt: new Date().toISOString(),
    };
    await upsertChoirSongSuggestionJson(updated);
    return { suggestion: updated };
  }

  if (action === "withdraw") {
    const suggestionId = String(body.suggestionId ?? "");
    const existing = await getChoirSongSuggestionJson(groupId, suggestionId);
    if (!existing) throw new Error("Suggestion not found.");
    if (!canMemberWithdraw(existing, user.id)) throw new Error("Cannot withdraw this suggestion.");
    const now = new Date().toISOString();
    const updated = { ...existing, status: "withdrawn" as const, updatedAt: now };
    await upsertChoirSongSuggestionJson(updated);
    await appendChoirSongSuggestionStatusJson({
      suggestionId,
      groupId,
      previousStatus: existing.status,
      newStatus: "withdrawn",
      reviewerId: user.id,
      reviewerName: user.name,
      createdAt: now,
    });
    return { suggestion: updated };
  }

  if (action === "toggle_support") {
    await assertChoirSongSuggestionsAccess(user, groupId);
    const suggestionId = String(body.suggestionId ?? "");
    const existing = await getChoirSongSuggestionJson(groupId, suggestionId);
    if (!existing || !isVisibleToGroup(existing, user.id, false)) {
      throw new Error("Suggestion not available.");
    }
    const result = await toggleChoirSongSuggestionSupportJson(suggestionId, user.id);
    return result;
  }

  if (action === "add_comment") {
    await assertChoirSongSuggestionsAccess(user, groupId);
    const suggestionId = String(body.suggestionId ?? "");
    const existing = await getChoirSongSuggestionJson(groupId, suggestionId);
    if (!existing || !isVisibleToGroup(existing, user.id, false)) {
      throw new Error("Suggestion not available.");
    }
    const text = String(body.body ?? "").trim();
    if (!text) throw new Error("Comment cannot be empty.");
    const comment = await addChoirSongSuggestionCommentJson({
      suggestionId,
      groupId,
      userId: user.id,
      userName: user.name,
      userAvatarUrl: user.avatarUrl ?? null,
      body: text,
    });
    return { comment };
  }

  if (action === "edit_comment") {
    await assertChoirSongSuggestionsAccess(user, groupId);
    const commentId = String(body.commentId ?? "");
    const text = String(body.body ?? "").trim();
    if (!text) throw new Error("Comment cannot be empty.");
    const comment = await updateChoirSongSuggestionCommentJson(commentId, user.id, text);
    if (!comment) throw new Error("Comment not found.");
    return { comment };
  }

  if (action === "delete_comment") {
    await assertChoirSongSuggestionsAccess(user, groupId);
    const commentId = String(body.commentId ?? "");
    const canManage = await canManageChoirSongSuggestions(user, groupId);
    const ok = await deleteChoirSongSuggestionCommentJson(commentId, user.id, canManage);
    if (!ok) throw new Error("Comment not found.");
    return { ok: true };
  }

  if (action === "review_status") {
    if (!(await canManageChoirSongSuggestions(user, groupId))) {
      throw new Error("Leadership permission required.");
    }
    const suggestionId = String(body.suggestionId ?? "");
    const newStatus = String(body.status ?? "") as ChoirSongSuggestionStatus;
    const allowed: ChoirSongSuggestionStatus[] = [
      "under_review",
      "approved",
      "declined",
      "needs_more_info",
      "added_to_library",
    ];
    if (!allowed.includes(newStatus)) throw new Error("Invalid status.");

    const existing = await getChoirSongSuggestionJson(groupId, suggestionId);
    if (!existing) throw new Error("Suggestion not found.");

    const now = new Date().toISOString();
    const leadershipNote = body.leadershipNote !== undefined ? String(body.leadershipNote).trim() || null : existing.leadershipNote;
    const internalReviewNote =
      body.internalReviewNote !== undefined
        ? String(body.internalReviewNote).trim() || null
        : existing.internalReviewNote;

    const updated: ChoirSongSuggestion = {
      ...existing,
      status: newStatus,
      leadershipNote,
      internalReviewNote,
      reviewedBy: user.id,
      reviewedByName: user.name,
      reviewedAt: now,
      updatedAt: now,
      officialSongId:
        body.officialSongId !== undefined
          ? String(body.officialSongId).trim() || null
          : existing.officialSongId,
    };
    await upsertChoirSongSuggestionJson(updated);
    await appendChoirSongSuggestionStatusJson({
      suggestionId,
      groupId,
      previousStatus: existing.status,
      newStatus,
      reviewerId: user.id,
      reviewerName: user.name,
      reason: leadershipNote ?? internalReviewNote ?? null,
      createdAt: now,
    });

    const detailUrl = choirSongSuggestionDetailHref(groupId, suggestionId);
    if (newStatus === "approved") {
      void notifySubmitter(existing.submittedBy, "Song suggestion approved", `“${existing.title}” was approved by worship leadership.`, detailUrl);
    } else if (newStatus === "declined") {
      void notifySubmitter(existing.submittedBy, "Song suggestion update", `Leadership reviewed “${existing.title}”.`, detailUrl);
    } else if (newStatus === "needs_more_info") {
      void notifySubmitter(existing.submittedBy, "More info requested", `Please review your suggestion for “${existing.title}”.`, detailUrl);
    } else if (newStatus === "added_to_library") {
      void notifySubmitter(existing.submittedBy, "Added to song library", `“${existing.title}” is now in the worship song library.`, detailUrl);
    }

    return { suggestion: updated };
  }

  if (action === "add_to_library") {
    if (!(await canManageChoirSongSuggestions(user, groupId))) {
      throw new Error("Leadership permission required.");
    }
    const suggestionId = String(body.suggestionId ?? "");
    const existing = await getChoirSongSuggestionJson(groupId, suggestionId);
    if (!existing) throw new Error("Suggestion not found.");

    const linkId = String(body.officialSongId ?? "").trim();
    let officialSongId = linkId;

    if (!officialSongId) {
      const saved = await saveWorshipLibrarySong({
        title: existing.title,
        artist: existing.artist,
        defaultKey: String(body.defaultKey ?? "C").trim() || "C",
        youtubeVideoId: existing.youtubeVideoId ?? undefined,
        youtubeUrl: existing.mediaUrl?.includes("youtube") ? existing.mediaUrl : undefined,
        notes: existing.reason,
        tags: existing.songType ? [existing.songType] : undefined,
        actor: { id: user.id, name: user.name },
      });
      officialSongId = saved.id;
    } else {
      const linked = await getWorshipLibrarySong(officialSongId);
      if (!linked) throw new Error("Library song not found.");
    }

    const now = new Date().toISOString();
    const updated: ChoirSongSuggestion = {
      ...existing,
      status: "added_to_library",
      officialSongId,
      reviewedBy: user.id,
      reviewedByName: user.name,
      reviewedAt: now,
      updatedAt: now,
    };
    await upsertChoirSongSuggestionJson(updated);
    await appendChoirSongSuggestionStatusJson({
      suggestionId,
      groupId,
      previousStatus: existing.status,
      newStatus: "added_to_library",
      reviewerId: user.id,
      reviewerName: user.name,
      reason: "Linked to song library",
      createdAt: now,
    });

    void notifySubmitter(
      existing.submittedBy,
      "Added to song library",
      `“${existing.title}” is now in the worship song library.`,
      choirSongSuggestionDetailHref(groupId, suggestionId),
    );

    return { suggestion: updated, officialSongId };
  }

  if (action === "save_guidelines") {
    if (!(await canManageChoirSongSuggestions(user, groupId))) {
      throw new Error("Leadership permission required.");
    }
    const markdown = String(body.markdown ?? "").trim();
    if (!markdown) throw new Error("Guidelines cannot be empty.");
    await saveChoirSongSuggestionGuidelinesJson(markdown);
    return { ok: true };
  }

  if (action === "search_library") {
    if (!(await canManageChoirSongSuggestions(user, groupId))) {
      throw new Error("Leadership permission required.");
    }
    const query = String(body.query ?? "").trim();
    const songs = await listWorshipLibrarySongs(query);
    return {
      songs: songs.slice(0, 20).map((song) => ({
        id: song.id,
        title: song.title,
        artist: song.artist,
      })),
    };
  }

  throw new Error("Unknown action.");
}

export async function buildChoirSongSuggestionReviewQueue(user: PublicMember, groupId: string) {
  if (!(await canManageChoirSongSuggestions(user, groupId))) {
    throw new Error("Leadership permission required.");
  }
  const all = await listChoirSongSuggestionsJson(groupId);
  const pending = all.filter((row) => row.status === "submitted" || row.status === "under_review" || row.status === "needs_more_info");
  const ids = pending.map((row) => row.id);
  const supportMap = await supportCountsForSuggestions(ids);

  return pending.map((row) => ({
    id: row.id,
    title: row.title,
    artist: row.artist,
    status: row.status,
    statusLabel: choirSongSuggestionStatusLabel(row.status),
    submittedByName: row.submittedByName,
    createdAt: row.createdAt,
    relativeDate: relativeDateLabel(row.createdAt),
    suggestedOccasion: row.suggestedOccasion,
    supportCount: supportMap.get(row.id) ?? 0,
    detailHref: choirSongSuggestionDetailHref(groupId, row.id),
    mediaUrl: row.mediaUrl,
  }));
}
