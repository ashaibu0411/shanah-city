"use client";

import { WorshipYouTubeReference } from "@/components/worship/WorshipYouTubeReference";
import { WorshipAudioPlayer } from "@/components/worship/WorshipAudioPlayer";
import {
  visiblePracticeStemsForUser,
  worshipPracticeStemLabel,
  type WorshipServicePlan,
  type WorshipSong,
} from "@/lib/worship-types";

type WorshipSongBreakdownListenProps = {
  song: WorshipSong;
  userId?: string;
  isManager?: boolean;
  planStatus?: WorshipServicePlan["status"];
};

export function WorshipSongBreakdownListen({
  song,
  userId,
  isManager = false,
  planStatus = "draft",
}: WorshipSongBreakdownListenProps) {
  const stems = visiblePracticeStemsForUser(song.practiceStems, userId, isManager).filter(
    (stem) => stem.status === "approved",
  );
  const hasYouTube = Boolean(song.youtubeVideoId?.trim());

  if (!hasYouTube && stems.length === 0) {
    if (isManager) {
      return (
        <p className="mt-3 text-xs leading-relaxed text-night-500">
          {song.librarySongId
            ? "No reference video on this row yet. Open Song library → Edit this song → add a YouTube link, then save this plan."
            : "No reference video yet. Add the song from Song library (with YouTube) or paste a link in the song workspace, then save the plan."}
        </p>
      );
    }

    return (
      <p className="mt-3 text-xs text-night-500">
        {planStatus === "published"
          ? "No reference video or practice track yet — your worship leader can add one in the song library."
          : "No reference video or practice track yet — check back after the plan is published."}
      </p>
    );
  }

  return (
    <div className="mt-3 space-y-3 border-t border-night-900/5 pt-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-night-500">Listen &amp; practice</p>
      {hasYouTube && song.youtubeVideoId && (
        <WorshipYouTubeReference
          videoId={song.youtubeVideoId}
          title={song.title}
          startSeconds={song.youtubeStartSeconds}
          endSeconds={song.youtubeEndSeconds}
        />
      )}
      {stems.length > 0 && (
        <div className="space-y-2">
          {stems.map((stem) => (
            <div
              key={stem.role}
              className="rounded-xl border border-night-900/5 bg-sand-50/80 px-3 py-2"
            >
              <p className="text-xs font-semibold text-night-800">
                {worshipPracticeStemLabel(stem.role)}
              </p>
              <WorshipAudioPlayer
                className="mt-1.5 w-full"
                src={stem.audioUrl}
                fileName={stem.fileName}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
