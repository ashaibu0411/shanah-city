import { getYouTubeWatchUrlWithSegment } from "@/lib/worship-youtube-timestamp-utils";
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

/** Choir-friendly setlist page (listen, lyrics, essentials — not the full planner). */
export function worshipMemberServicePath(
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
  return `/worship/service?${params.toString()}`;
}

export function worshipMemberServiceUrl(
  plan: Pick<WorshipServicePlan, "serviceDate" | "serviceTime">,
  songId?: string,
) {
  return `${getAppBaseUrl()}${worshipMemberServicePath(plan, songId)}`;
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
  const setlistUrl = worshipMemberServiceUrl(plan);

  if (songs.length === 0) {
    return `🎵 Worship plan published: ${headline}\n\nOpen setlist & practice:\n${setlistUrl}`;
  }

  const lines = songs.slice(0, 8).map((song, index) => {
    const title = song.title.trim() || "Untitled";
    const key = song.key?.trim() ? ` · ${song.key.trim()}` : "";
    return `${index + 1}. ${title}${key}`;
  });
  const more = songs.length > 8 ? `\n… +${songs.length - 8} more on the setlist page` : "";

  return `🎵 Worship plan: ${headline}\n\nOpen setlist & practice (tap link):\n${setlistUrl}\n\n${lines.join("\n")}${more}`;
}
