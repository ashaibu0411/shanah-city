import { getYouTubeWatchUrlWithSegment, formatSegmentRangeLabel } from "@/lib/worship-youtube-timestamp-utils";
import { getAppBaseUrl } from "@/lib/share-urls";
import {
  normalizePracticeStems,
  normalizeSongs,
  serviceDateTimeLabel,
  type WorshipServicePlan,
  type WorshipSong,
} from "@/lib/worship-types";

export function worshipPlannerPath(
  plan: Pick<WorshipServicePlan, "serviceDate" | "serviceTime">,
  songId?: string,
) {
  const params = new URLSearchParams({
    date: plan.serviceDate,
    time: String(plan.serviceTime),
  });
  if (songId) {
    params.set("song", songId);
  }
  return `/worship?${params.toString()}`;
}

export function worshipPlannerUrl(
  plan: Pick<WorshipServicePlan, "serviceDate" | "serviceTime">,
  songId?: string,
) {
  return `${getAppBaseUrl()}${worshipPlannerPath(plan, songId)}`;
}

export function worshipSongListenUrl(song: WorshipSong, plan: WorshipServicePlan) {
  if (song.youtubeVideoId) {
    return getYouTubeWatchUrlWithSegment(
      song.youtubeVideoId,
      song.youtubeStartSeconds,
      song.youtubeEndSeconds,
    );
  }

  const referenceStem = normalizePracticeStems(song.practiceStems).find(
    (stem) =>
      stem.status === "approved" &&
      (stem.role === "full" || stem.role === "instrumental" || stem.role === "vocals"),
  );
  if (referenceStem) {
    const url = referenceStem.audioUrl;
    if (url.startsWith("http://") || url.startsWith("https://")) {
      return url;
    }
    return `${getAppBaseUrl()}${url.startsWith("/") ? url : `/${url}`}`;
  }

  return worshipPlannerUrl(plan, song.id);
}

export function formatWorshipPlanSetlistForPush(plan: WorshipServicePlan) {
  const songs = normalizeSongs(plan.songs);
  const headline = plan.title?.trim() || serviceDateTimeLabel(plan.serviceDate, plan.serviceTime);

  if (songs.length === 0) {
    return headline;
  }

  const listed = songs.slice(0, 4).map((song, index) => `${index + 1}. ${song.title.trim() || "Untitled"}`);
  const suffix = songs.length > 4 ? ` · +${songs.length - 4} more` : "";
  return `${headline} — ${listed.join(" · ")}${suffix}`;
}

export function formatWorshipPlanSetlistForChat(plan: WorshipServicePlan) {
  const songs = normalizeSongs(plan.songs);
  const headline = plan.title?.trim() || serviceDateTimeLabel(plan.serviceDate, plan.serviceTime);
  const plannerUrl = worshipPlannerUrl(plan);

  if (songs.length === 0) {
    return `🎵 Worship plan published: ${headline}\nOpen the planner: ${plannerUrl}`;
  }

  const lines = songs.map((song, index) => {
    const title = song.title.trim() || "Untitled";
    const key = song.key?.trim() ? ` · Key ${song.key.trim()}` : "";
    const segment = formatSegmentRangeLabel(song.youtubeStartSeconds, song.youtubeEndSeconds);
    const segmentNote = segment ? ` · Video ${segment}` : "";
    const listen = worshipSongListenUrl(song, plan);
    const inPlanner = worshipPlannerUrl(plan, song.id);
    return `${index + 1}. ${title}${key}${segmentNote}\n   Listen: ${listen}\n   In planner: ${inPlanner}`;
  });

  return `🎵 Worship plan published: ${headline}\n\nSetlist:\n${lines.join("\n\n")}\n\nFull planner: ${plannerUrl}`;
}
