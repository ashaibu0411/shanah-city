"use client";

import { useEffect, useMemo, useState } from "react";
import {
  getSongPracticeStem,
  listPracticeTracksForPart,
  worshipPracticeStemLabel,
  type WorshipSong,
} from "@/lib/worship-types";

type WorshipPracticePlayerProps = {
  song: WorshipSong;
  partRole: string;
  highlightMyPart?: boolean;
};

export function WorshipPracticePlayer({
  song,
  partRole,
  highlightMyPart = true,
}: WorshipPracticePlayerProps) {
  const tracks = useMemo(
    () => listPracticeTracksForPart(song, partRole),
    [song, partRole],
  );
  const myStem = getSongPracticeStem(song, partRole);
  const defaultRole = myStem?.role ?? tracks[0]?.role ?? "";
  const [activeRole, setActiveRole] = useState(defaultRole);

  useEffect(() => {
    setActiveRole(myStem?.role ?? tracks[0]?.role ?? "");
  }, [song.id, partRole, myStem?.role, tracks]);

  if (tracks.length === 0) {
    return (
      <p className="mt-4 text-sm text-night-500">
        No practice audio yet. Your leader can upload isolated part tracks in the song workspace.
      </p>
    );
  }

  const activeTrack = tracks.find((track) => track.role === activeRole) ?? tracks[0];

  return (
    <div className="mt-4 rounded-xl border border-night-900/5 bg-sand-50 p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-night-500">Practice audio</p>

      {highlightMyPart && myStem && (
        <p className="mt-1 text-sm font-semibold text-violet-800">
          Your {worshipPracticeStemLabel(partRole).toLowerCase()} track is ready
        </p>
      )}

      {!myStem && highlightMyPart && (
        <p className="mt-1 text-sm text-night-600">
          No isolated track for {worshipPracticeStemLabel(partRole).toLowerCase()} yet — use a
          reference track below or ask your leader to upload your part.
        </p>
      )}

      <div className="mt-3 flex flex-wrap gap-2">
        {tracks.map((track) => {
          const isMine = track.role === partRole;
          const selected = track.role === activeRole;
          return (
            <button
              key={track.role}
              type="button"
              onClick={() => setActiveRole(track.role)}
              className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                selected
                  ? "bg-night-900 text-sand-50"
                  : isMine
                    ? "bg-violet-100 text-violet-900 ring-1 ring-violet-200 hover:bg-violet-200"
                    : "bg-white text-night-700 ring-1 ring-night-900/10 hover:bg-sand-100"
              }`}
            >
              {worshipPracticeStemLabel(track.role)}
              {isMine ? " · you" : ""}
            </button>
          );
        })}
      </div>

      <audio
        key={activeTrack.audioUrl}
        controls
        preload="metadata"
        className="mt-3 w-full"
        src={activeTrack.audioUrl}
      >
        Your browser does not support audio playback.
      </audio>
      <p className="mt-1 text-xs text-night-500">{activeTrack.fileName}</p>
    </div>
  );
}
