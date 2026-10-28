import { prisma } from "@/lib/db";
import { communityStatusExpiry } from "@/lib/community-media-server";
import { canDeleteGroupCommunityStatus } from "@/lib/group-community-story-server";
import { isAllowedCommunityMediaUrl } from "@/lib/community-media-shared";
import type {
  CommunityStatusMediaType,
  CommunityStatusMemberStoryAudio,
  CommunityStatusMusic,
  CommunityStatusStoryKind,
} from "@/lib/member-types";

export type CommunityStatusRecord = {
  id: string;
  authorId: string;
  authorName: string;
  mediaUrl: string;
  mediaType: CommunityStatusMediaType;
  caption?: string;
  storyKind: CommunityStatusStoryKind;
  groupId?: string;
  postedByUserId?: string;
  music?: CommunityStatusMusic;
  memberStoryAudio?: CommunityStatusMemberStoryAudio;
  createdAt: string;
  expiresAt: string;
};

function parseStoryKind(value: string | null | undefined): CommunityStatusStoryKind {
  return value === "service_invite" ? "service_invite" : "default";
}

function parseMediaType(value: string): CommunityStatusMediaType {
  if (value === "video") return "video";
  if (value === "text") return "text";
  if (value === "link") return "link";
  if (value === "audio") return "audio";
  if (value === "live") return "live";
  return "image";
}

function mapMusic(record: {
  musicTrackId?: string | null;
  musicTitle?: string | null;
  musicArtist?: string | null;
  musicYoutubeVideoId?: string | null;
}): CommunityStatusMusic | undefined {
  const trackId = record.musicTrackId?.trim();
  if (!trackId) return undefined;
  const youtubeVideoId = record.musicYoutubeVideoId?.trim() ?? "";
  const title = record.musicTitle?.trim();
  // Legacy stories require YouTube id; hybrid authorized audio uses trackId + title only.
  if (!youtubeVideoId && !title) return undefined;
  return {
    trackId,
    title: title || "Song",
    artist: record.musicArtist?.trim() || "Artist",
    youtubeVideoId,
  };
}

function mapStatus(record: {
  id: string;
  authorId: string;
  authorName: string;
  mediaUrl: string;
  mediaType: string;
  caption: string | null;
  storyKind?: string | null;
  groupId?: string | null;
  postedByUserId?: string | null;
  musicTrackId?: string | null;
  musicTitle?: string | null;
  musicArtist?: string | null;
  musicYoutubeVideoId?: string | null;
  memberStoryAudioUrl?: string | null;
  createdAt: Date;
  expiresAt: Date;
}): CommunityStatusRecord {
  const music = mapMusic(record);
  const memberUrl = record.memberStoryAudioUrl?.trim();
  const memberStoryAudio =
    memberUrl && isAllowedCommunityMediaUrl(memberUrl) ? { url: memberUrl } : undefined;
  return {
    id: record.id,
    authorId: record.authorId,
    authorName: record.authorName,
    mediaUrl: record.mediaUrl,
    mediaType: parseMediaType(record.mediaType),
    caption: record.caption ?? undefined,
    storyKind: parseStoryKind(record.storyKind),
    groupId: record.groupId ?? undefined,
    postedByUserId: record.postedByUserId ?? undefined,
    music,
    memberStoryAudio,
    createdAt: record.createdAt.toISOString(),
    expiresAt: record.expiresAt.toISOString(),
  };
}

export async function getActiveCommunityStatuses() {
  const now = new Date();
  const statuses = await prisma.communityStatus.findMany({
    where: { expiresAt: { gt: now } },
    orderBy: { createdAt: "desc" },
  });
  return statuses.map(mapStatus);
}

export async function addCommunityStatus(input: {
  id: string;
  authorId: string;
  authorName: string;
  mediaUrl: string;
  mediaType: CommunityStatusMediaType;
  caption?: string;
  storyKind?: CommunityStatusStoryKind;
  groupId?: string;
  postedByUserId?: string;
  music?: CommunityStatusMusic;
  memberStoryAudioUrl?: string | null;
  expiresAt?: Date;
}) {
  const created = await prisma.communityStatus.create({
    data: {
      id: input.id,
      authorId: input.authorId,
      authorName: input.authorName,
      mediaUrl: input.mediaUrl,
      mediaType: input.mediaType,
      caption: input.caption ?? null,
      storyKind: input.storyKind ?? "default",
      groupId: input.groupId ?? null,
      postedByUserId: input.postedByUserId ?? null,
      musicTrackId: input.music?.trackId ?? null,
      musicTitle: input.music?.title ?? null,
      musicArtist: input.music?.artist ?? null,
      musicYoutubeVideoId: input.music?.youtubeVideoId ?? null,
      memberStoryAudioUrl: input.memberStoryAudioUrl?.trim() || null,
      expiresAt: input.expiresAt ?? communityStatusExpiry(),
    },
  });
  return mapStatus(created);
}

export async function deleteActiveLiveStatusesForAuthor(authorId: string) {
  await prisma.communityStatus.deleteMany({
    where: {
      authorId,
      mediaType: "live",
      expiresAt: { gt: new Date() },
    },
  });
}

export async function deleteExpiredCommunityStatuses() {
  await prisma.communityStatus.deleteMany({
    where: { expiresAt: { lte: new Date() } },
  });
}

export async function deleteCommunityStatus(input: { id: string; userId: string }) {
  const existing = await prisma.communityStatus.findUnique({
    where: { id: input.id },
  });

  if (!existing) return null;

  const isPersonalAuthor = existing.authorId === input.userId;
  const isGroupPoster = existing.postedByUserId === input.userId;
  const isGroupLeader =
    existing.groupId != null &&
    (await canDeleteGroupCommunityStatus(input.userId, existing.groupId));

  if (!isPersonalAuthor && !isGroupPoster && !isGroupLeader) {
    return "forbidden";
  }

  await prisma.communityStatus.delete({
    where: { id: input.id },
  });

  return mapStatus(existing);
}
