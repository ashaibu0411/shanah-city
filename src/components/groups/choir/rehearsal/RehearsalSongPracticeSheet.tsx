"use client";

import { useEffect } from "react";
import Link from "next/link";
import {
  listPracticeTracksForPart,
  worshipPartLabel,
  worshipPracticeStemLabel,
  type WorshipServicePlan,
  type WorshipSong,
} from "@/lib/worship-types";
import { worshipPlannerPath } from "@/lib/worship-plan-links";
import { WorshipAudioPlayer } from "@/components/worship/WorshipAudioPlayer";
import { WorshipSongBreakdownListen } from "@/components/worship/WorshipSongBreakdownListen";
import { WorshipSongBreakdownLyrics } from "@/components/worship/WorshipSongBreakdownLyrics";
import { SetlistSongThumbnail } from "@/components/groups/choir/setlist/SetlistSongThumbnail";
import { WorshipMemberPartRecording } from "@/components/worship/WorshipMemberPartRecording";
import { instrumentalStemsForSong, songPrepLabel, songPrepStatus, vocalStemsForSong } from "./rehearsal-utils";

type RehearsalSongPracticeSheetProps = {
  open: boolean;
  song: WorshipSong | null;
  position: number;
  plan: WorshipServicePlan;
  serviceTitle: string;
  memberPartRole: string | null;
  userId?: string;
  canManage: boolean;
  serviceDate: string;
  serviceTime: string;
  focusListen?: boolean;
  focusRecord?: boolean;
  onClose: () => void;
  onTogglePrepared: (prepared: boolean) => void;
  onSongUpdated?: (song: WorshipSong) => void;
};

export function RehearsalSongPracticeSheet({
  open,
  song,
  position,
  plan,
  serviceTitle,
  memberPartRole,
  userId,
  canManage,
  serviceDate,
  serviceTime,
  focusListen = false,
  focusRecord = false,
  onClose,
  onTogglePrepared,
  onSongUpdated,
}: RehearsalSongPracticeSheetProps) {
  useEffect(() => {
    if (!open || !song || !focusListen) return;
    const frame = requestAnimationFrame(() => {
      document.getElementById("worship-song-listen")?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    });
    return () => cancelAnimationFrame(frame);
  }, [open, focusListen, song?.id]);

  useEffect(() => {
    if (!open || !song || !focusRecord) return;
    const frame = requestAnimationFrame(() => {
      document.getElementById("rehearsal-part-recording")?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    });
    return () => cancelAnimationFrame(frame);
  }, [open, focusRecord, song?.id]);

  if (!open || !song) return null;

  const partRole = memberPartRole?.trim() || "full";
  const status = songPrepStatus(song, userId);
  const vocalStems = vocalStemsForSong(song, { userId, isManager: canManage });
  const instrumentStems = instrumentalStemsForSong(song, { userId, isManager: canManage });
  const partTracks = listPracticeTracksForPart(song, partRole, { userId, isManager: canManage });

  const metaParts: string[] = [];
  if (song.key?.trim()) metaParts.push(`Key: ${song.key.trim()}`);
  if (song.bpm) metaParts.push(`BPM: ${song.bpm}`);

  return (
    <div className="choir-setlist-sheet-backdrop" role="presentation" onClick={onClose}>
      <div
        className="choir-setlist-sheet choir-rehearsal-practice-sheet"
        role="dialog"
        aria-labelledby="choir-rehearsal-song-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 gap-3">
            <SetlistSongThumbnail youtubeVideoId={song.youtubeVideoId} title={song.title} />
            <div className="min-w-0">
              <p className="text-xs font-bold uppercase tracking-wide text-[var(--choir-gold)]">Song {position}</p>
              <h2 id="choir-rehearsal-song-title" className="font-display text-xl font-bold text-[var(--choir-heading)]">
                {song.title}
              </h2>
              <p className="mt-1 text-sm text-[var(--choir-muted)]">{serviceTitle}</p>
              {metaParts.length > 0 ? (
                <p className="mt-1 text-xs font-medium text-[var(--choir-body)]">{metaParts.join(" · ")}</p>
              ) : null}
            </div>
          </div>
          <button type="button" className="choir-header-icon-btn !h-10 !w-10" onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>

        <p className="mt-3 text-sm">
          <span className="font-semibold text-[var(--choir-heading)]">Status: </span>
          <span className={status === "ready" ? "text-[var(--choir-success)]" : "text-[var(--choir-muted)]"}>
            {songPrepLabel(status)}
          </span>
        </p>

        {song.notes?.trim() ? (
          <div className="mt-3 rounded-xl bg-[var(--choir-surface-soft)] px-3 py-2 text-sm text-[var(--choir-body)]">
            {song.notes.trim()}
          </div>
        ) : null}

        <div className="mt-4">
          <h3 className="text-sm font-bold text-[var(--choir-heading)]">Practice audio</h3>
          <WorshipSongBreakdownListen song={song} userId={userId} isManager={canManage} planStatus={plan.status} />
        </div>

        <section className="mt-5" aria-labelledby="choir-vocal-parts-heading">
          <h3 id="choir-vocal-parts-heading" className="text-sm font-bold text-[var(--choir-heading)]">
            Practice your part
          </h3>
          {vocalStems.length === 0 && partTracks.length === 0 ? (
            <p className="mt-2 text-sm text-[var(--choir-muted)]">
              No vocal-part recordings uploaded yet. Your worship leader may add soprano, alto, tenor, or bass guides.
            </p>
          ) : (
            <ul className="mt-2 space-y-3">
              {(partTracks.length > 0 ? partTracks : vocalStems).map((stem) => {
                const isPreferred = stem.role === partRole;
                return (
                  <li
                    key={stem.role}
                    className={`rounded-xl border px-3 py-3 ${isPreferred ? "border-[var(--choir-gold)] bg-[var(--choir-gold-soft)]" : "border-[var(--choir-border)] bg-[var(--choir-surface-soft)]"}`}
                  >
                    <p className="text-sm font-bold text-[var(--choir-heading)]">
                      {worshipPracticeStemLabel(stem.role)}
                      {isPreferred ? " · your section" : ""}
                    </p>
                    {song.key?.trim() ? (
                      <p className="mt-0.5 text-xs text-[var(--choir-muted)]">Service key: {song.key.trim()}</p>
                    ) : null}
                    <WorshipAudioPlayer className="mt-2 w-full" src={stem.audioUrl} fileName={stem.fileName} />
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        {plan.status === "published" && memberPartRole?.trim() && userId ? (
          <section className="mt-5" aria-labelledby="choir-record-part-heading">
            <h3 id="choir-record-part-heading" className="text-sm font-bold text-[var(--choir-heading)]">
              Submit your recording
            </h3>
            <p className="mt-1 text-xs text-[var(--choir-muted)]">
              Leaders can review your {worshipPartLabel(memberPartRole).toLowerCase()} take for this service.
            </p>
            <WorshipMemberPartRecording
              appearance="choir"
              serviceDate={serviceDate}
              serviceTime={serviceTime}
              song={song}
              partRole={memberPartRole.trim()}
              userId={userId}
              onUpdated={onSongUpdated}
            />
          </section>
        ) : plan.status === "published" && userId && !memberPartRole?.trim() ? (
          <p className="mt-5 rounded-xl bg-[var(--choir-surface-soft)] px-3 py-2 text-xs text-[var(--choir-muted)]">
            Ask your worship leader to assign your vocal part (soprano, alto, tenor, bass) on the team roster to
            record here.
          </p>
        ) : null}

        <section className="mt-5" aria-labelledby="choir-instrumental-heading">
          <h3 id="choir-instrumental-heading" className="text-sm font-bold text-[var(--choir-heading)]">
            Instrumental preparation
          </h3>
          {instrumentStems.length === 0 ? (
            <p className="mt-2 text-sm text-[var(--choir-muted)]">
              No instrumental resources uploaded yet. Your worship leader may add practice tracks or charts for this
              song.
            </p>
          ) : (
            <ul className="mt-2 space-y-3">
              {instrumentStems.map((stem) => (
                <li key={stem.role} className="rounded-xl border border-[var(--choir-border)] bg-[var(--choir-surface-soft)] px-3 py-3">
                  <p className="text-sm font-bold text-[var(--choir-heading)]">{worshipPracticeStemLabel(stem.role)}</p>
                  <WorshipAudioPlayer className="mt-2 w-full" src={stem.audioUrl} fileName={stem.fileName} />
                </li>
              ))}
            </ul>
          )}
          {memberPartRole && worshipPartLabel(memberPartRole) ? (
            <p className="mt-2 text-xs text-[var(--choir-muted)]">
              Showing resources for {worshipPartLabel(memberPartRole)} first when available.
            </p>
          ) : null}
        </section>

        {song.chartUrl ? (
          <a
            href={song.chartUrl}
            target="_blank"
            rel="noreferrer"
            className="mt-4 inline-flex text-sm font-semibold text-[var(--choir-gold-dark)] underline"
          >
            Open chord chart
          </a>
        ) : null}

        <WorshipSongBreakdownLyrics title={song.title} lyrics={song.lyrics} />

        <div className="mt-5 flex flex-col gap-2">
          {status === "ready" ? (
            <button type="button" className="choir-btn-secondary" onClick={() => onTogglePrepared(false)}>
              Continue practicing
            </button>
          ) : (
            <button type="button" className="choir-btn-primary" onClick={() => onTogglePrepared(true)}>
              Mark as ready
            </button>
          )}
        </div>

        {canManage ? (
          <Link
            href={worshipPlannerPath(plan, song.id)}
            className="choir-setlist-manage-link mt-4 inline-flex"
          >
            Manage practice resources
          </Link>
        ) : null}
      </div>
    </div>
  );
}
