"use client";

import { useEffect, useMemo, useState } from "react";
import { WorshipMemberPartRecording } from "@/components/worship/WorshipMemberPartRecording";
import { WORSHIP_PART_ROLES, worshipPartLabel, type WorshipSong } from "@/lib/worship-types";

const VOCAL_PARTS = WORSHIP_PART_ROLES.filter((entry) => entry.kind === "vocal");

type RehearsalPartRecordingPanelProps = {
  serviceDate: string;
  serviceTime: string;
  song: WorshipSong;
  userId?: string;
  rosterPartRole: string | null;
  onSongUpdated?: (song: WorshipSong) => void;
};

export function RehearsalPartRecordingPanel({
  serviceDate,
  serviceTime,
  song,
  userId,
  rosterPartRole,
  onSongUpdated,
}: RehearsalPartRecordingPanelProps) {
  const roster = rosterPartRole?.trim() || "";
  const [partRole, setPartRole] = useState(roster || VOCAL_PARTS[0]?.value || "soprano");

  useEffect(() => {
    if (roster) setPartRole(roster);
  }, [roster, song.id]);

  const showPartPicker = !roster;

  const partLabel = useMemo(() => worshipPartLabel(partRole), [partRole]);

  if (!userId) {
    return (
      <p className="text-sm text-[var(--choir-muted)]">Sign in to record and submit your part for this service.</p>
    );
  }

  return (
    <div>
      {showPartPicker ? (
        <label className="mt-2 block text-sm text-[var(--choir-body)]">
          <span className="font-semibold text-[var(--choir-heading)]">Which part are you recording?</span>
          <select
            value={partRole}
            onChange={(event) => setPartRole(event.target.value)}
            className="mt-1.5 w-full rounded-xl border border-[var(--choir-border)] bg-white px-3 py-2.5 text-sm text-[var(--choir-heading)]"
          >
            {VOCAL_PARTS.map((entry) => (
              <option key={entry.value} value={entry.value}>
                {entry.label}
              </option>
            ))}
          </select>
          <p className="mt-1.5 text-xs text-[var(--choir-muted)]">
            Your leader can link this to your roster part later. Recording as {partLabel.toLowerCase()} for this song.
          </p>
        </label>
      ) : (
        <p className="mt-1 text-xs text-[var(--choir-muted)]">
          Submitting as your roster part: <strong className="text-[var(--choir-heading)]">{partLabel}</strong>
        </p>
      )}

      <WorshipMemberPartRecording
        appearance="choir"
        serviceDate={serviceDate}
        serviceTime={serviceTime}
        song={song}
        partRole={partRole}
        userId={userId}
        onUpdated={onSongUpdated}
      />
    </div>
  );
}
