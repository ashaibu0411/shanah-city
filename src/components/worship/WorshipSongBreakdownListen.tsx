"use client";

import { WorshipYouTubeReference } from "@/components/worship/WorshipYouTubeReference";
import {
  visiblePracticeStemsForUser,
  worshipPracticeStemLabel,
  type WorshipSong,
} from "@/lib/worship-types";

type WorshipSongBreakdownListenProps = {
  song: WorshipSong;
  userId?: string;
  isManager?: boolean;
};

export function WorshipSongBreakdownListen({
  song,
  userId,
  isManager = false,
}: WorshipSongBreakdownListenProps) {
  const stems = visiblePracticeStemsForUser(song.practiceStems, userId, isManager).filter(
    (stem) => stem.status === "approved",
  );
  const hasYouTube = Boolean(song.youtubeVideoId);

  if (!hasYouTube && stems.length === 0) {
    return (
      <p className="mt-3 text-xs text-night-500">
        No reference video or practice track yet — check back after the plan is updated.
      </p>
    );
  }

  return (
    <div className="mt-3 space-y-3 border-t border-night-900/5 pt-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-night-500">Listen &amp; practice</p>
      {hasYouTube && song.youtubeVideoId && (
        <WorshipYouTubeReference videoId={song.youtubeVideoId} title={song.title} />
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
              <audio controls preload="metadata" className="mt-1.5 w-full" src={stem.audioUrl}>
                Your browser does not support audio playback.
              </audio>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
