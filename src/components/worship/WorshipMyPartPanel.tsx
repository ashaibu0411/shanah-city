"use client";

import { Card } from "@/components/ui";
import { WorshipPracticePlayer } from "@/components/worship/WorshipPracticePlayer";
import {
  getSongPartNotes,
  worshipPartLabel,
  worshipSegmentLabel,
  type WorshipSong,
  type WorshipTeamMember,
} from "@/lib/worship-types";

type WorshipMyPartPanelProps = {
  songs: WorshipSong[];
  member: WorshipTeamMember | undefined;
};

export function WorshipMyPartPanel({ songs, member }: WorshipMyPartPanelProps) {
  if (!member) {
    return (
      <Card>
        <h3 className="font-display text-lg font-semibold text-night-900">My part</h3>
        <p className="mt-2 text-sm text-night-600">
          You are not on the team roster for this service yet. Ask your worship leader to add you.
        </p>
      </Card>
    );
  }

  if (!member.partRole) {
    return (
      <Card>
        <h3 className="font-display text-lg font-semibold text-night-900">My part</h3>
        <p className="mt-2 text-sm text-night-600">
          Hi {member.name.split(" ")[0]} — your worship leader has not assigned a part yet (soprano,
          alto, drums, keys, etc.). Check the service plan or ask in rehearsal.
        </p>
      </Card>
    );
  }

  const partLabel = worshipPartLabel(member.partRole);

  return (
    <div className="space-y-4">
      <Card>
        <p className="text-xs font-semibold uppercase tracking-wide text-violet-700">My part</p>
        <h3 className="mt-1 font-display text-xl font-semibold text-night-900">{partLabel}</h3>
        <p className="mt-2 text-sm text-night-600">
          Focus notes and practice audio for your role on each song. When your leader uploads isolated
          part tracks, you can listen to your line only.
        </p>
      </Card>

      {songs.length === 0 ? (
        <Card>
          <p className="text-sm text-night-500">No songs on this service plan yet.</p>
        </Card>
      ) : (
        songs.map((song, index) => {
          const partNotes = getSongPartNotes(song, member.partRole!);
          const transposition =
            song.originalKey && song.key && song.originalKey !== song.key
              ? `${song.originalKey} → ${song.key}`
              : song.key;

          return (
            <Card key={song.id}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-night-500">
                    {worshipSegmentLabel(song.segment ?? "worship")}
                  </p>
                  <h4 className="font-display text-lg font-semibold text-night-900">
                    {index + 1}. {song.title}
                  </h4>
                  <p className="mt-1 text-sm text-night-600">Key {transposition}</p>
                </div>
                {song.chartUrl && (
                  <a
                    href={song.chartUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-full bg-violet-100 px-3 py-1.5 text-xs font-semibold text-violet-900 hover:bg-violet-200"
                  >
                    Chart
                  </a>
                )}
              </div>

              {partNotes ? (
                <div className="mt-4 rounded-xl bg-violet-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-violet-800">
                    Your {partLabel.toLowerCase()} part
                  </p>
                  <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-night-800">
                    {partNotes}
                  </p>
                </div>
              ) : (
                <p className="mt-4 text-sm text-night-500">
                  No specific notes for {partLabel.toLowerCase()} on this song yet.
                </p>
              )}

              {song.lyrics?.trim() && (
                <details className="mt-4">
                  <summary className="cursor-pointer text-sm font-semibold text-night-700">
                    Full lyrics
                  </summary>
                  <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-night-700">
                    {song.lyrics}
                  </p>
                </details>
              )}

              {song.notes?.trim() && (
                <p className="mt-3 text-xs text-night-500">Leader note: {song.notes}</p>
              )}

              <WorshipPracticePlayer song={song} partRole={member.partRole!} />
            </Card>
          );
        })
      )}
    </div>
  );
}
