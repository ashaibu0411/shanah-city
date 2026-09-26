"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Button, Card } from "@/components/ui";
import { WorshipSongBreakdownListen } from "@/components/worship/WorshipSongBreakdownListen";
import { WorshipSongBreakdownLyrics } from "@/components/worship/WorshipSongBreakdownLyrics";
import { worshipMemberServicePath } from "@/lib/worship-plan-links";
import { formatSegmentRangeLabel } from "@/lib/worship-youtube-timestamp-utils";
import {
  buildTeamReadiness,
  rehearsalDateTimeLabel,
  serviceDateTimeLabel,
  worshipSegmentLabel,
  type WorshipServicePlan,
  type WorshipSong,
  type WorshipTeamMember,
} from "@/lib/worship-types";

type WorshipChoirServiceViewProps = {
  plan: WorshipServicePlan | null;
  songs: WorshipSong[];
  team: WorshipTeamMember[];
  serviceDate: string;
  serviceTime: string;
  title: string;
  rehearsalDate: string;
  rehearsalTime: string;
  rehearsalNotes: string;
  status: WorshipServicePlan["status"];
  initialSongId?: string;
  userId?: string;
  canManage: boolean;
  myMember?: WorshipTeamMember;
  onToggleSongPrepared: (songId: string, prepared: boolean) => void;
  onToggleReady: (ready: boolean) => void;
};

export function WorshipChoirServiceView({
  plan,
  songs,
  team,
  serviceDate,
  serviceTime,
  title,
  rehearsalDate,
  rehearsalTime,
  rehearsalNotes,
  status,
  initialSongId,
  userId,
  canManage,
  myMember,
  onToggleSongPrepared,
  onToggleReady,
}: WorshipChoirServiceViewProps) {
  const [expandedSongId, setExpandedSongId] = useState<string | null>(initialSongId ?? null);
  const [detailsOpen, setDetailsOpen] = useState(false);

  useEffect(() => {
    if (initialSongId) {
      setExpandedSongId(initialSongId);
      const el = document.getElementById(`service-song-${initialSongId}`);
      el?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [initialSongId]);

  const readiness = useMemo(() => buildTeamReadiness({ team, songs }), [team, songs]);
  const headline =
    title.trim() || plan?.title?.trim() || serviceDateTimeLabel(serviceDate, serviceTime);
  const hubPath = `/worship?date=${encodeURIComponent(serviceDate)}&time=${encodeURIComponent(serviceTime)}`;

  if (!plan || status !== "published") {
    return (
      <Card className="overflow-hidden p-0">
        <div className="bg-gradient-to-br from-violet-800 to-indigo-950 px-5 py-6 text-white">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-violet-200">
            Service setlist
          </p>
          <h2 className="mt-1 font-display text-2xl font-semibold">{headline}</h2>
        </div>
        <div className="p-5">
          <p className="text-sm text-night-600">
            This service plan is not published yet. Check back after your worship leader publishes,
            or open another date from the worship hub.
          </p>
          <Link
            href={hubPath}
            className="mt-4 inline-flex rounded-full bg-violet-600 px-4 py-2 text-sm font-semibold text-white hover:bg-violet-700"
          >
            Worship hub
          </Link>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="overflow-hidden rounded-2xl bg-gradient-to-br from-violet-700 via-indigo-800 to-indigo-950 text-white shadow-lg ring-1 ring-black/10">
        <div className="px-5 py-6">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-violet-200/90">
            Service setlist
          </p>
          <h1 className="mt-1 font-display text-2xl font-semibold leading-tight">{headline}</h1>
          <p className="mt-2 text-sm text-violet-100/90">
            {serviceDateTimeLabel(serviceDate, serviceTime)}
          </p>
          {(plan.rehearsalDate || rehearsalDate) && (
            <p className="mt-1 text-sm text-violet-200/80">
              Rehearsal{" "}
              {rehearsalDateTimeLabel(
                plan.rehearsalDate ?? rehearsalDate,
                plan.rehearsalTime ?? rehearsalTime,
              )}
            </p>
          )}
        </div>
        <div className="flex flex-wrap gap-2 border-t border-white/10 bg-black/10 px-4 py-3">
          <Link
            href={`${hubPath}&tab=my-part`}
            className="rounded-full bg-white/15 px-3 py-1.5 text-xs font-semibold text-white hover:bg-white/25"
          >
            My part
          </Link>
          <Link
            href={`${hubPath}&tab=rehearsals`}
            className="rounded-full bg-white/15 px-3 py-1.5 text-xs font-semibold text-white hover:bg-white/25"
          >
            Rehearsals
          </Link>
          <Link
            href={`${hubPath}&tab=schedule`}
            className="rounded-full bg-white/15 px-3 py-1.5 text-xs font-semibold text-white hover:bg-white/25"
          >
            Team schedule
          </Link>
          {canManage && (
            <Link
              href={hubPath}
              className="rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-indigo-900 hover:bg-violet-100"
            >
              Full planner
            </Link>
          )}
        </div>
      </div>

      {myMember && (
        <Card className="flex flex-wrap items-center justify-between gap-3 p-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-night-500">You</p>
            <p className="text-sm font-semibold text-night-900">
              {myMember.ready ? "Marked ready for service" : "Still preparing"}
            </p>
          </div>
          <Button
            variant={myMember.ready ? "secondary" : "primary"}
            onClick={() => onToggleReady(!myMember.ready)}
          >
            {myMember.ready ? "Not ready yet" : "I'm ready"}
          </Button>
        </Card>
      )}

      {songs.length === 0 ? (
        <Card className="p-5">
          <p className="text-sm text-night-600">No songs on this setlist yet.</p>
        </Card>
      ) : (
        <ul className="space-y-2">
          {songs.map((song, index) => {
            const open = expandedSongId === song.id;
            const prepared = userId ? song.preparedBy.includes(userId) : false;
            const segmentLabel = worshipSegmentLabel(song.segment ?? "worship");
            const videoSegment = formatSegmentRangeLabel(
              song.youtubeStartSeconds,
              song.youtubeEndSeconds,
            );

            return (
              <li
                key={song.id}
                id={`service-song-${song.id}`}
                className="scroll-mt-24 overflow-hidden rounded-2xl border border-night-900/8 bg-white shadow-sm dark:border-white/10 dark:bg-[var(--color-surface)]"
              >
                <button
                  type="button"
                  onClick={() => setExpandedSongId(open ? null : song.id)}
                  className="flex w-full items-start gap-3 px-4 py-3.5 text-left"
                  aria-expanded={open}
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-violet-100 text-sm font-bold text-violet-800 dark:bg-violet-500/20 dark:text-violet-100">
                    {index + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-night-900 dark:text-sand-100">{song.title}</p>
                    <p className="mt-0.5 text-xs text-night-500 dark:text-sand-400">
                      {segmentLabel}
                      {song.key?.trim() ? ` · Key ${song.key.trim()}` : ""}
                      {song.leaderName ? ` · ${song.leaderName}` : ""}
                    </p>
                  </div>
                  <span
                    className={`mt-1 shrink-0 text-night-400 transition ${open ? "rotate-180" : ""}`}
                    aria-hidden
                  >
                    ▾
                  </span>
                </button>

                {open && (
                  <div className="border-t border-night-900/6 px-4 pb-4 pt-2 dark:border-white/10">
                    {song.notes && (
                      <p className="mb-3 rounded-xl bg-sand-50 px-3 py-2 text-sm text-night-700 dark:bg-[var(--color-bg-soft)] dark:text-sand-200">
                        {song.notes}
                      </p>
                    )}
                    {videoSegment && (
                      <p className="mb-2 text-xs font-semibold text-violet-800 dark:text-violet-300">
                        Video clip: {videoSegment}
                      </p>
                    )}
                    {song.chartUrl && (
                      <a
                        href={song.chartUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="mb-3 inline-block text-sm font-semibold text-violet-700 underline dark:text-violet-300"
                      >
                        Open chord chart
                      </a>
                    )}
                    <WorshipSongBreakdownListen
                      song={song}
                      userId={userId}
                      isManager={canManage}
                    />
                    <WorshipSongBreakdownLyrics title={song.title} lyrics={song.lyrics} />
                    {myMember && (
                      <div className="mt-4 flex justify-end">
                        <Button
                          variant={prepared ? "secondary" : "primary"}
                          onClick={() => onToggleSongPrepared(song.id, !prepared)}
                        >
                          {prepared ? "Unmark prepared" : "Mark prepared"}
                        </Button>
                      </div>
                    )}
                    <p className="mt-3 text-center">
                      <Link
                        href={`${worshipMemberServicePath({ serviceDate, serviceTime }, song.id)}`}
                        className="text-xs font-semibold text-night-500 underline dark:text-sand-400"
                      >
                        Link to this song
                      </Link>
                    </p>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}

      <Card className="overflow-hidden p-0">
        <button
          type="button"
          onClick={() => setDetailsOpen((current) => !current)}
          className="flex w-full items-center justify-between px-4 py-3.5 text-left"
          aria-expanded={detailsOpen}
        >
          <span className="text-sm font-semibold text-night-900 dark:text-sand-100">
            Team &amp; rehearsal notes
          </span>
          <span className={`text-night-400 transition ${detailsOpen ? "rotate-180" : ""}`}>▾</span>
        </button>
        {detailsOpen && (
          <div className="space-y-4 border-t border-night-900/8 px-4 pb-4 pt-3 dark:border-white/10">
            {rehearsalNotes.trim() && (
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-night-500">
                  Rehearsal notes
                </p>
                <p className="mt-1 whitespace-pre-wrap text-sm text-night-700 dark:text-sand-200">
                  {rehearsalNotes}
                </p>
              </div>
            )}
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-night-500">
                Team readiness
              </p>
              <p className="mt-1 text-sm font-semibold text-night-900 dark:text-sand-100">
                {readiness.readyCount} of {readiness.totalCount || team.length} ready
              </p>
              <ul className="mt-3 space-y-2">
                {readiness.members.map((member) => (
                  <li
                    key={member.userId}
                    className="flex items-center justify-between rounded-xl bg-sand-50 px-3 py-2 text-sm dark:bg-[var(--color-bg-soft)]"
                  >
                    <span className="font-medium text-night-900 dark:text-sand-100">
                      {member.name}
                    </span>
                    <span className="text-xs text-night-500">
                      {member.songsPrepared}/{member.songsTotal || songs.length} songs
                      {member.ready ? " · Ready" : ""}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
