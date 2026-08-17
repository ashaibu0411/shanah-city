"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/components/auth/AuthProvider";
import { Button, Card } from "@/components/ui";
import { WorshipSongLibraryPanel } from "@/components/worship/WorshipSongLibraryPanel";
import {
  buildTeamReadiness,
  emptyWorshipSong,
  nextServiceSundayIso,
  rehearsalDateTimeLabel,
  serviceDateTimeLabel,
  songFromLibrary,
  suggestedRehearsalDate,
  worshipRoleLabel,
  worshipSegmentLabel,
  WORSHIP_ROLES,
  WORSHIP_SERVICE_TIMES,
  WORSHIP_SONG_SEGMENTS,
  type WorshipLibrarySong,
  type WorshipRole,
  type WorshipServicePlan,
  type WorshipSong,
  type WorshipTeamMember,
} from "@/lib/worship-types";
import type { ChurchEvent } from "@/lib/types";

type RosterMember = {
  id: string;
  name: string;
};

function initials(name: string) {
  return name
    .split(" ")
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

function ProgressDots({ prepared, total }: { prepared: number; total: number }) {
  const max = Math.max(total, 5);
  return (
    <div className="flex gap-1">
      {Array.from({ length: max }).map((_, index) => (
        <span
          key={index}
          className={`h-2 w-2 rounded-full ${
            index < prepared ? "bg-emerald-500" : "bg-night-900/10"
          }`}
        />
      ))}
    </div>
  );
}

export function WorshipPlannerPanel({
  initialDate,
  initialTime,
}: {
  initialDate?: string;
  initialTime?: string;
} = {}) {
  const { user, permissions } = useAuth();
  const canManage = permissions.canManageWorshipPlan;
  const [tab, setTab] = useState<"plan" | "library">("plan");
  const [serviceDate, setServiceDate] = useState(initialDate || nextServiceSundayIso());
  const [serviceTime, setServiceTime] = useState<string>(initialTime || "10:00");
  const [plan, setPlan] = useState<WorshipServicePlan | null>(null);
  const [songs, setSongs] = useState<WorshipSong[]>([]);
  const [team, setTeam] = useState<WorshipTeamMember[]>([]);
  const [title, setTitle] = useState("");
  const [rehearsalNotes, setRehearsalNotes] = useState("");
  const [rehearsalDate, setRehearsalDate] = useState("");
  const [rehearsalTime, setRehearsalTime] = useState("19:00");
  const [calendarEventId, setCalendarEventId] = useState("");
  const [calendarEvents, setCalendarEvents] = useState<ChurchEvent[]>([]);
  const [status, setStatus] = useState<WorshipServicePlan["status"]>("draft");
  const [roster, setRoster] = useState<RosterMember[]>([]);
  const [upcomingPlans, setUpcomingPlans] = useState<WorshipServicePlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [copying, setCopying] = useState(false);
  const [copyTargetTime, setCopyTargetTime] = useState("11:30");
  const [message, setMessage] = useState<string | null>(null);
  const [hidden, setHidden] = useState(false);

  const readiness = useMemo(() => buildTeamReadiness({ team, songs }), [team, songs]);
  const myMember = team.find((member) => member.userId === user?.id);

  async function loadPlan() {
    setLoading(true);
    const response = await fetch(
      `/api/worship?serviceDate=${encodeURIComponent(serviceDate)}&serviceTime=${encodeURIComponent(serviceTime)}`,
    );
    const data = await response.json();
    setLoading(false);

    if (!response.ok) {
      setMessage(data.error ?? "Could not load worship plan.");
      return;
    }

    setHidden(Boolean(data.hidden));
    if (data.plan) {
      setPlan(data.plan);
      setSongs(data.plan.songs);
      setTeam(data.plan.team);
      setTitle(data.plan.title ?? "");
      setRehearsalNotes(data.plan.rehearsalNotes ?? "");
      setRehearsalDate(data.plan.rehearsalDate ?? "");
      setRehearsalTime(data.plan.rehearsalTime ?? "19:00");
      setCalendarEventId(data.plan.calendarEventId ?? "");
      setStatus(data.plan.status);
    } else {
      setPlan(null);
      setSongs([]);
      setTeam([]);
      setTitle("");
      setRehearsalNotes("");
      setRehearsalDate(suggestedRehearsalDate(serviceDate));
      setRehearsalTime("19:00");
      setCalendarEventId("");
      setStatus("draft");
    }
    setMessage(null);
  }

  async function loadUpcoming() {
    const since = new Date().toISOString().slice(0, 10);
    const response = await fetch(`/api/worship?since=${since}`);
    const data = await response.json();
    if (response.ok) {
      setUpcomingPlans(data.plans ?? []);
    }
  }

  async function loadRoster() {
    if (!canManage) return;
    const response = await fetch("/api/worship?roster=1");
    const data = await response.json();
    if (response.ok) {
      setRoster(data.members ?? []);
    }
  }

  async function loadCalendarEvents() {
    if (!canManage) return;
    const response = await fetch("/api/worship?calendarEvents=1");
    const data = await response.json();
    if (response.ok) {
      setCalendarEvents(data.events ?? []);
    }
  }

  useEffect(() => {
    loadPlan();
    loadUpcoming();
    loadRoster();
    loadCalendarEvents();
  }, []);

  useEffect(() => {
    loadPlan();
  }, [serviceDate, serviceTime]);

  useEffect(() => {
    const otherSlot = WORSHIP_SERVICE_TIMES.find((slot) => slot.value !== serviceTime);
    if (otherSlot) {
      setCopyTargetTime(otherSlot.value);
    }
  }, [serviceTime]);

  async function savePlan(action: "save" | "publish" | "unpublish" | "delete") {
    setMessage(null);
    const response = await fetch("/api/worship", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action,
        serviceDate,
        serviceTime,
        title,
        songs,
        team,
        rehearsalNotes,
        rehearsalDate,
        rehearsalTime,
        calendarEventId: calendarEventId || undefined,
        status,
      }),
    });
    const data = await response.json();

    if (response.ok) {
      if (action === "delete") {
        setMessage("Service plan deleted.");
      } else if (action === "publish") {
        setMessage("Plan published for the worship team.");
      } else if (action === "unpublish") {
        setMessage("Plan moved back to draft.");
      } else {
        setMessage("Plan saved.");
      }
      loadPlan();
      loadUpcoming();
      return;
    }

    setMessage(data.error ?? "Could not save worship plan.");
  }

  async function copyFromLastSunday() {
    if (songs.length > 0 || team.length > 0) {
      const confirmed = window.confirm(
        "Replace the current draft with songs and team from the previous service?",
      );
      if (!confirmed) return;
    }

    setCopying(true);
    setMessage(null);
    const response = await fetch("/api/worship", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "copy_from_previous",
        serviceDate,
        serviceTime,
      }),
    });
    const data = await response.json();
    setCopying(false);

    if (response.ok) {
      setMessage(
        data.copiedFrom
          ? `Copied setlist and team from ${data.copiedFrom}. Review and save when ready.`
          : "Copied from previous service.",
      );
      loadPlan();
      loadUpcoming();
      return;
    }

    setMessage(data.error ?? "Could not copy from previous service.");
  }

  async function copyToServiceTime(overwrite = false) {
    if (songs.length === 0 && team.length === 0) {
      setMessage("Add songs or team members before copying to another service.");
      return;
    }

    setCopying(true);
    setMessage(null);
    const response = await fetch("/api/worship", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "copy_to_time",
        serviceDate,
        serviceTime,
        targetServiceTime: copyTargetTime,
        overwrite,
        title,
        songs,
        team,
        rehearsalNotes,
        rehearsalTime,
      }),
    });
    const data = await response.json();

    if (response.status === 409 && data.needsOverwrite) {
      setCopying(false);
      const confirmed = window.confirm(
        `${data.error} Replace it with this setlist and team?`,
      );
      if (confirmed) {
        await copyToServiceTime(true);
      }
      return;
    }

    setCopying(false);

    if (response.ok) {
      setMessage(
        data.copiedTo
          ? `Copied to ${data.copiedTo}. Open that service time to review.`
          : "Copied to another service time.",
      );
      loadUpcoming();
      return;
    }

    setMessage(data.error ?? "Could not copy to another service time.");
  }

  async function updateReady(ready: boolean) {
    const response = await fetch("/api/worship", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "mark_ready",
        serviceDate,
        serviceTime,
        ready,
      }),
    });
    const data = await response.json();
    if (response.ok) {
      setPlan(data.plan);
      setTeam(data.plan.team);
      setSongs(data.plan.songs);
    }
  }

  async function toggleSongPrepared(songId: string, prepared: boolean) {
    const response = await fetch("/api/worship", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "toggle_song",
        serviceDate,
        serviceTime,
        songId,
        prepared,
      }),
    });
    const data = await response.json();
    if (response.ok) {
      setPlan(data.plan);
      setTeam(data.plan.team);
      setSongs(data.plan.songs);
    }
  }

  function addSong() {
    setSongs((current) => [...current, emptyWorshipSong()]);
  }

  function updateSong(index: number, patch: Partial<WorshipSong>) {
    setSongs((current) =>
      current.map((song, songIndex) => (songIndex === index ? { ...song, ...patch } : song)),
    );
  }

  function removeSong(index: number) {
    setSongs((current) => current.filter((_, songIndex) => songIndex !== index));
  }

  function moveSong(index: number, direction: -1 | 1) {
    setSongs((current) => {
      const target = index + direction;
      if (target < 0 || target >= current.length) return current;
      const next = [...current];
      [next[index], next[target]] = [next[target], next[index]];
      return next.map((song, songIndex) => ({ ...song, order: songIndex + 1 }));
    });
  }

  function addTeamMember(memberId: string, role: WorshipRole) {
    const member = roster.find((entry) => entry.id === memberId);
    if (!member) return;
    if (team.some((entry) => entry.userId === memberId)) return;
    setTeam((current) => [
      ...current,
      { userId: member.id, name: member.name, role, ready: false },
    ]);
  }

  function addSongFromLibrary(entry: WorshipLibrarySong) {
    setSongs((current) => [...current, songFromLibrary(entry)]);
    setTab("plan");
    setMessage(`${entry.title} added to this service plan.`);
  }

  function removeTeamMember(userId: string) {
    setTeam((current) => current.filter((member) => member.userId !== userId));
  }

  if (tab === "library" && canManage) {
    return <WorshipSongLibraryPanel onAddToPlan={addSongFromLibrary} />;
  }

  if (loading) {
    return <p className="text-sm text-night-500">Loading worship planner…</p>;
  }

  if (hidden) {
    return (
      <Card>
        <h2 className="font-display text-xl font-semibold text-night-900">Plan not published yet</h2>
        <p className="mt-2 text-sm text-night-600">
          Your worship leader has not published this service plan yet. Check back closer to
          rehearsal or Sunday.
        </p>
      </Card>
    );
  }

  const showEditor = canManage || !plan;

  return (
    <>
      {canManage && (
        <div className="mb-6 flex flex-wrap gap-2">
          {(
            [
              { id: "plan", label: "Service plan" },
              { id: "library", label: "Song library" },
            ] as const
          ).map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setTab(item.id)}
              className={`rounded-full px-4 py-1.5 text-sm font-semibold transition ${
                tab === item.id
                  ? "bg-night-900 text-sand-50"
                  : "bg-white text-night-600 ring-1 ring-night-900/10 hover:bg-sand-100"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      )}

      <Card className="mb-6 overflow-hidden p-0 ring-1 ring-night-900/10">
        <div className="bg-gradient-to-br from-violet-700 to-indigo-900 px-6 py-5 text-white">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-violet-200">
            Shanah City Worship
          </p>
          <h2 className="mt-1 font-display text-2xl font-semibold">Worship planner</h2>
          <p className="mt-2 text-sm text-violet-100/90">
            Setlists, team readiness, and rehearsal notes for each service.
          </p>
        </div>

        <div className="space-y-4 p-6">
          <div className="flex flex-wrap items-end gap-3">
            <label className="text-sm text-night-700">
              <span className="font-semibold">Service date</span>
              <input
                type="date"
                value={serviceDate}
                onChange={(event) => setServiceDate(event.target.value)}
                className="mt-1 block rounded-xl border border-night-900/10 bg-sand-50 px-3 py-2.5 text-sm outline-none ring-night-900/5 focus:ring-2"
              />
            </label>
            <div>
              <p className="text-sm font-semibold text-night-700">Service time</p>
              <div className="mt-1 flex flex-wrap gap-2">
                {WORSHIP_SERVICE_TIMES.map((slot) => (
                  <button
                    key={slot.value}
                    type="button"
                    onClick={() => setServiceTime(slot.value)}
                    className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                      serviceTime === slot.value
                        ? "bg-night-900 text-sand-50"
                        : "bg-sand-100 text-night-700 hover:bg-sand-200"
                    }`}
                  >
                    {slot.label}
                  </button>
                ))}
              </div>
            </div>
            <p className="text-sm text-night-600">{serviceDateTimeLabel(serviceDate, serviceTime)}</p>
            {canManage && (
              <Button variant="secondary" onClick={copyFromLastSunday} disabled={copying}>
                {copying ? "Copying…" : "Copy from last Sunday"}
              </Button>
            )}
            {canManage && WORSHIP_SERVICE_TIMES.some((slot) => slot.value !== serviceTime) && (
              <div className="flex flex-wrap items-center gap-2">
                <select
                  value={copyTargetTime}
                  onChange={(event) => setCopyTargetTime(event.target.value)}
                  className="rounded-xl border border-night-900/10 bg-sand-50 px-3 py-2 text-sm"
                  aria-label="Target service time"
                >
                  {WORSHIP_SERVICE_TIMES.filter((slot) => slot.value !== serviceTime).map((slot) => (
                    <option key={slot.value} value={slot.value}>
                      {slot.label}
                    </option>
                  ))}
                </select>
                <Button variant="secondary" onClick={() => copyToServiceTime()} disabled={copying}>
                  Copy to time
                </Button>
              </div>
            )}
            {plan && (
              <Link
                href={`/worship/run-sheet?date=${encodeURIComponent(serviceDate)}&time=${encodeURIComponent(serviceTime)}`}
                target="_blank"
                rel="noreferrer"
                className="rounded-full bg-violet-100 px-4 py-2 text-sm font-semibold text-violet-900 hover:bg-violet-200"
              >
                Run sheet
              </Link>
            )}
            {status === "published" ? (
              <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-800">
                Published
              </span>
            ) : (
              <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-800">
                Draft
              </span>
            )}
          </div>

          {(plan?.rehearsalDate || rehearsalDate) && (
            <p className="text-sm text-night-600">
              Rehearsal:{" "}
              {rehearsalDateTimeLabel(plan?.rehearsalDate ?? rehearsalDate, plan?.rehearsalTime ?? rehearsalTime)}
            </p>
          )}

          {plan && (
            <div className="rounded-2xl bg-sand-50 p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-night-500">
                    Team readiness
                  </p>
                  <p className="font-display text-2xl font-semibold text-night-900">
                    {readiness.readyCount} of {readiness.totalCount || "0"} ready
                  </p>
                </div>
                {myMember && (
                  <Button
                    variant={myMember.ready ? "secondary" : "primary"}
                    onClick={() => updateReady(!myMember.ready)}
                  >
                    {myMember.ready ? "Mark not ready" : "Mark myself ready"}
                  </Button>
                )}
              </div>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-night-900/10">
                <div
                  className="h-full rounded-full bg-emerald-500 transition-all"
                  style={{
                    width:
                      readiness.totalCount > 0
                        ? `${(readiness.readyCount / readiness.totalCount) * 100}%`
                        : "0%",
                  }}
                />
              </div>
            </div>
          )}
        </div>
      </Card>

      {plan && readiness.members.length > 0 && (
        <Card className="mb-6">
          <h3 className="font-display text-lg font-semibold text-night-900">Member progress</h3>
          <div className="mt-4 space-y-3">
            {readiness.members.map((member) => (
              <div
                key={member.userId}
                className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-night-900/5 px-4 py-3"
              >
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-violet-100 font-semibold text-violet-800">
                    {initials(member.name)}
                  </span>
                  <div>
                    <p className="font-semibold text-night-900">{member.name}</p>
                    <p className="text-xs text-night-500">{worshipRoleLabel(member.role)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <ProgressDots prepared={member.songsPrepared} total={member.songsTotal} />
                  <span className="text-sm font-semibold text-night-700">
                    {member.songsPrepared}/{member.songsTotal || songs.length}
                  </span>
                  {member.ready ? (
                    <span className="rounded-full bg-emerald-100 px-2 py-1 text-xs font-semibold text-emerald-800">
                      Ready
                    </span>
                  ) : (
                    <span className="rounded-full bg-sand-100 px-2 py-1 text-xs font-semibold text-night-600">
                      Preparing
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      <Card className="mb-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 className="font-display text-lg font-semibold text-night-900">Song breakdown</h3>
          {showEditor && (
            <Button variant="secondary" onClick={() => setTab("library")}>
              Add from library
            </Button>
          )}
          {showEditor && (
            <Button variant="secondary" onClick={addSong}>
              Add song
            </Button>
          )}
        </div>

        {songs.length === 0 ? (
          <p className="mt-4 text-sm text-night-500">
            {showEditor
              ? "Add songs for this service setlist."
              : "No songs listed for this service yet."}
          </p>
        ) : (
          <div className="mt-4 space-y-3">
            {songs.map((song, index) => {
              const prepared = user ? song.preparedBy.includes(user.id) : false;
              const teamPreparedCount = song.preparedBy.length;
              return (
                <div
                  key={song.id}
                  className="rounded-xl border border-night-900/5 p-4"
                >
                  <div className="grid gap-3 md:grid-cols-[1fr_100px_100px_auto] md:items-end">
                    {showEditor ? (
                      <>
                        <input
                          value={song.title}
                          onChange={(event) => updateSong(index, { title: event.target.value })}
                          placeholder="Song title"
                          className="rounded-xl border border-night-900/10 bg-white px-3 py-2.5 text-sm outline-none ring-night-900/5 focus:ring-2"
                        />
                        <input
                          value={song.key}
                          onChange={(event) => updateSong(index, { key: event.target.value })}
                          placeholder="Key"
                          aria-label="Song key"
                          className="rounded-xl border border-night-900/10 bg-white px-3 py-2.5 text-sm outline-none ring-night-900/5 focus:ring-2"
                        />
                        <input
                          value={song.bpm ?? ""}
                          onChange={(event) =>
                            updateSong(index, {
                              bpm: event.target.value ? Number(event.target.value) : undefined,
                            })
                          }
                          placeholder="BPM"
                          aria-label="Song BPM"
                          className="rounded-xl border border-night-900/10 bg-white px-3 py-2.5 text-sm outline-none ring-night-900/5 focus:ring-2"
                        />
                        <div className="flex flex-wrap gap-2">
                          <Button
                            variant="secondary"
                            onClick={() => moveSong(index, -1)}
                            disabled={index === 0}
                          >
                            Up
                          </Button>
                          <Button
                            variant="secondary"
                            onClick={() => moveSong(index, 1)}
                            disabled={index === songs.length - 1}
                          >
                            Down
                          </Button>
                          <Button variant="secondary" onClick={() => removeSong(index)}>
                            Remove
                          </Button>
                        </div>
                        <select
                          value={song.segment ?? "worship"}
                          onChange={(event) =>
                            updateSong(index, {
                              segment: event.target.value as WorshipSong["segment"],
                            })
                          }
                          className="rounded-xl border border-night-900/10 bg-white px-3 py-2.5 text-sm md:col-span-2"
                        >
                          {WORSHIP_SONG_SEGMENTS.map((segment) => (
                            <option key={segment.value} value={segment.value}>
                              {segment.label}
                            </option>
                          ))}
                        </select>
                        <select
                          value={song.leaderUserId ?? ""}
                          onChange={(event) => {
                            const leader = team.find((member) => member.userId === event.target.value);
                            updateSong(index, {
                              leaderUserId: event.target.value || undefined,
                              leaderName: leader?.name,
                            });
                          }}
                          className="rounded-xl border border-night-900/10 bg-white px-3 py-2.5 text-sm md:col-span-2"
                        >
                          <option value="">Song leader (optional)</option>
                          {team.map((member) => (
                            <option key={member.userId} value={member.userId}>
                              {member.name}
                            </option>
                          ))}
                        </select>
                        {song.chartUrl && (
                          <a
                            href={song.chartUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="text-xs font-semibold text-violet-700 underline md:col-span-4"
                          >
                            Chart: {song.chartFileName ?? "Open file"}
                          </a>
                        )}
                      </>
                    ) : (
                      <>
                        <div>
                          <p className="font-semibold text-night-900">
                            {index + 1}. {song.title}
                          </p>
                          <p className="mt-1 text-xs text-night-500">
                            {worshipSegmentLabel(song.segment ?? "worship")}
                            {song.leaderName ? ` · Led by ${song.leaderName}` : ""}
                          </p>
                          {song.notes && (
                            <p className="mt-1 text-xs text-night-500">{song.notes}</p>
                          )}
                          {song.chartUrl && (
                            <a
                              href={song.chartUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="mt-2 inline-block text-xs font-semibold text-violet-700 underline"
                            >
                              Open chord chart
                            </a>
                          )}
                        </div>
                        <p className="text-sm font-semibold text-night-700">Key {song.key}</p>
                        <p className="text-sm text-night-500">{song.bpm ? `${song.bpm} BPM` : "—"}</p>
                        <div />
                      </>
                    )}
                  </div>

                  <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                    <ProgressDots prepared={teamPreparedCount} total={team.length || songs.length} />
                    {myMember && plan && (
                      <Button
                        variant={prepared ? "secondary" : "primary"}
                        onClick={() => toggleSongPrepared(song.id, !prepared)}
                      >
                        {prepared ? "Unmark prepared" : "Mark prepared"}
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {showEditor && (
        <>
          <Card className="mb-6">
            <h3 className="font-display text-lg font-semibold text-night-900">
              Rehearsal &amp; calendar
            </h3>
            <p className="mt-1 text-sm text-night-600">
              Team members get a push reminder about 24 hours before rehearsal (if push is enabled).
            </p>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <label className="text-sm text-night-700">
                <span className="font-semibold">Rehearsal date</span>
                <input
                  type="date"
                  value={rehearsalDate}
                  onChange={(event) => setRehearsalDate(event.target.value)}
                  className="mt-1 block w-full rounded-xl border border-night-900/10 bg-white px-3 py-2.5 text-sm"
                />
              </label>
              <label className="text-sm text-night-700">
                <span className="font-semibold">Rehearsal time</span>
                <input
                  type="time"
                  value={rehearsalTime}
                  onChange={(event) => setRehearsalTime(event.target.value)}
                  className="mt-1 block w-full rounded-xl border border-night-900/10 bg-white px-3 py-2.5 text-sm"
                />
              </label>
              <label className="text-sm text-night-700 md:col-span-2">
                <span className="font-semibold">Link choir calendar event</span>
                <select
                  value={calendarEventId}
                  onChange={(event) => setCalendarEventId(event.target.value)}
                  className="mt-1 block w-full rounded-xl border border-night-900/10 bg-white px-3 py-2.5 text-sm"
                >
                  <option value="">No linked event</option>
                  {calendarEvents.map((event) => (
                    <option key={event.id} value={event.id}>
                      {event.title} · {event.date} {event.time}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </Card>

          <Card className="mb-6">
            <h3 className="font-display text-lg font-semibold text-night-900">Team roster</h3>
            <p className="mt-1 text-sm text-night-600">
              Pull members from Shanah Worship (Choir) and assign roles for this service.
            </p>

            <div className="mt-4 flex flex-wrap gap-2">
              <select
                id="roster-add"
                defaultValue=""
                className="rounded-xl border border-night-900/10 bg-white px-3 py-2.5 text-sm outline-none ring-night-900/5 focus:ring-2"
                onChange={(event) => {
                  const memberId = event.target.value;
                  if (!memberId) return;
                  addTeamMember(memberId, "singer");
                  event.currentTarget.value = "";
                }}
              >
                <option value="">Add team member…</option>
                {roster
                  .filter((member) => !team.some((entry) => entry.userId === member.id))
                  .map((member) => (
                    <option key={member.id} value={member.id}>
                      {member.name}
                    </option>
                  ))}
              </select>
            </div>

            <div className="mt-4 space-y-2">
              {team.length === 0 ? (
                <p className="text-sm text-night-500">No one assigned yet.</p>
              ) : (
                team.map((member) => (
                  <div
                    key={member.userId}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-sand-50 px-4 py-3"
                  >
                    <div>
                      <p className="font-semibold text-night-900">{member.name}</p>
                      <select
                        value={member.role}
                        onChange={(event) =>
                          setTeam((current) =>
                            current.map((entry) =>
                              entry.userId === member.userId
                                ? { ...entry, role: event.target.value as WorshipRole }
                                : entry,
                            ),
                          )
                        }
                        className="mt-1 rounded-lg border border-night-900/10 bg-white px-2 py-1 text-xs"
                      >
                        {WORSHIP_ROLES.map((role) => (
                          <option key={role.value} value={role.value}>
                            {role.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <Button variant="secondary" onClick={() => removeTeamMember(member.userId)}>
                      Remove
                    </Button>
                  </div>
                ))
              )}
            </div>
          </Card>

          <Card className="mb-6">
            <label className="block text-sm font-semibold text-night-700">
              Rehearsal notes
              <textarea
                value={rehearsalNotes}
                onChange={(event) => setRehearsalNotes(event.target.value)}
                rows={3}
                placeholder="Run order, transitions, who leads which song…"
                className="mt-2 w-full rounded-xl border border-night-900/10 bg-sand-50 p-3 text-sm outline-none ring-night-900/5 focus:ring-2"
              />
            </label>

            <div className="mt-4 flex flex-wrap gap-2">
              <Button onClick={() => savePlan("save")}>Save draft</Button>
              <Button variant="secondary" onClick={() => savePlan("publish")}>
                Publish for team
              </Button>
              {plan && status === "published" && (
                <Button variant="secondary" onClick={() => savePlan("unpublish")}>
                  Unpublish
                </Button>
              )}
              {plan && (
                <Button variant="secondary" onClick={() => savePlan("delete")}>
                  Delete plan
                </Button>
              )}
            </div>
          </Card>
        </>
      )}

      {!showEditor && plan?.rehearsalNotes && (
        <Card className="mb-6">
          <h3 className="font-display text-lg font-semibold text-night-900">Rehearsal notes</h3>
          <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-night-700">
            {plan.rehearsalNotes}
          </p>
        </Card>
      )}

      {upcomingPlans.length > 0 && (
        <Card className="mb-6">
          <h3 className="font-display text-lg font-semibold text-night-900">Upcoming services</h3>
          <ul className="mt-4 space-y-2 text-sm">
            {upcomingPlans.slice(0, 8).map((entry) => (
              <li key={entry.id}>
                <button
                  type="button"
                  onClick={() => {
                    setServiceDate(entry.serviceDate);
                    setServiceTime(entry.serviceTime);
                  }}
                  className="font-medium text-night-900 hover:underline"
                >
                  {serviceDateTimeLabel(entry.serviceDate, entry.serviceTime)}
                </button>
                <span className="ml-2 capitalize text-night-500">{entry.status}</span>
              </li>
            ))}
          </ul>
        </Card>
      )}

      <p className="text-sm text-night-500">
        Need access? Join{" "}
        <Link href="/groups" className="font-semibold text-night-800 underline">
          Shanah Worship (Choir)
        </Link>{" "}
        under Groups. Worship leaders are set by group admins at{" "}
        <Link href="/calendar" className="font-semibold text-night-800 underline">
          Calendar → Choir
        </Link>
        .
      </p>

      {message && (
        <p className="mt-4 rounded-xl bg-sand-100 px-4 py-3 text-sm text-night-700">{message}</p>
      )}
    </>
  );
}
