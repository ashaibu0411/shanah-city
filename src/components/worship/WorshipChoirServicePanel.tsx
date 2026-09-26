"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/components/auth/AuthProvider";
import { premiumTabPill } from "@/components/app/mobile-premium";
import { Card } from "@/components/ui";
import { WorshipChoirServiceView } from "@/components/worship/WorshipChoirServiceView";
import {
  serviceDateTimeLabel,
  suggestedRehearsalDate,
  WORSHIP_SERVICE_TIMES,
  type WorshipServicePlan,
  type WorshipSong,
  type WorshipTeamMember,
} from "@/lib/worship-types";

type WorshipChoirServicePanelProps = {
  initialDate: string;
  initialTime: string;
  initialSongId?: string;
  serverPlan: WorshipServicePlan | null;
  canManage: boolean;
};

export function WorshipChoirServicePanel({
  initialDate,
  initialTime,
  initialSongId,
  serverPlan,
  canManage,
}: WorshipChoirServicePanelProps) {
  const { user } = useAuth();
  const [serviceDate, setServiceDate] = useState(initialDate);
  const [serviceTime, setServiceTime] = useState(initialTime);
  const [plan, setPlan] = useState<WorshipServicePlan | null>(serverPlan);
  const [songs, setSongs] = useState<WorshipSong[]>(serverPlan?.songs ?? []);
  const [team, setTeam] = useState<WorshipTeamMember[]>(serverPlan?.team ?? []);
  const [title, setTitle] = useState(serverPlan?.title ?? "");
  const [rehearsalNotes, setRehearsalNotes] = useState(serverPlan?.rehearsalNotes ?? "");
  const [rehearsalDate, setRehearsalDate] = useState(
    serverPlan?.rehearsalDate ?? suggestedRehearsalDate(initialDate),
  );
  const [rehearsalTime, setRehearsalTime] = useState(serverPlan?.rehearsalTime ?? "19:00");
  const [status, setStatus] = useState<WorshipServicePlan["status"]>(
    serverPlan?.status ?? "draft",
  );
  const [loading, setLoading] = useState(false);
  const [hidden, setHidden] = useState(false);

  const myMember = team.find((member) => member.userId === user?.id);

  async function loadPlan() {
    setLoading(true);
    const response = await fetch(
      `/api/worship?serviceDate=${encodeURIComponent(serviceDate)}&serviceTime=${encodeURIComponent(serviceTime)}`,
    );
    const data = await response.json();
    setLoading(false);

    if (!response.ok) return;

    setHidden(Boolean(data.hidden));
    const next = data.plan as WorshipServicePlan | null;
    setPlan(next);
    setSongs(next?.songs ?? []);
    setTeam(next?.team ?? []);
    setTitle(next?.title ?? "");
    setRehearsalNotes(next?.rehearsalNotes ?? "");
    setRehearsalDate(next?.rehearsalDate ?? suggestedRehearsalDate(serviceDate));
    setRehearsalTime(next?.rehearsalTime ?? "19:00");
    setStatus(next?.status ?? "draft");
  }

  useEffect(() => {
    if (serviceDate === initialDate && serviceTime === initialTime && serverPlan) {
      return;
    }
    void loadPlan();
  }, [serviceDate, serviceTime]);

  async function toggleReady(ready: boolean) {
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
    if (response.ok && data.plan) {
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
    if (response.ok && data.plan) {
      setPlan(data.plan);
      setSongs(data.plan.songs);
    }
  }

  if (hidden && status !== "published") {
    return (
      <Card className="p-5">
        <h2 className="font-display text-xl font-semibold text-night-900">Not published yet</h2>
        <p className="mt-2 text-sm text-night-600">
          Your leader has not published this service plan. Try another date or check the worship hub.
        </p>
        <Link
          href="/worship"
          className="mt-4 inline-flex text-sm font-semibold text-violet-800 underline"
        >
          Worship hub
        </Link>
      </Card>
    );
  }

  return (
    <div>
      <Card className="mb-4 p-4">
        <div className="flex flex-wrap items-end gap-3">
          <label className="text-sm text-night-700 dark:text-sand-300">
            <span className="font-semibold">Service date</span>
            <input
              type="date"
              value={serviceDate}
              onChange={(event) => setServiceDate(event.target.value)}
              className="mt-1 block rounded-xl border border-night-900/10 bg-sand-50 px-3 py-2.5 text-sm dark:border-white/10 dark:bg-[var(--color-bg-soft)]"
            />
          </label>
          <div>
            <p className="text-sm font-semibold text-night-700 dark:text-sand-300">Time</p>
            <div className="mt-1 flex flex-wrap gap-2">
              {WORSHIP_SERVICE_TIMES.map((slot) => (
                <button
                  key={slot.value}
                  type="button"
                  onClick={() => setServiceTime(slot.value)}
                  className={premiumTabPill(serviceTime === slot.value, "px-3 py-1.5 text-xs")}
                >
                  {slot.label}
                </button>
              ))}
            </div>
          </div>
          <p className="text-sm text-night-500">{serviceDateTimeLabel(serviceDate, serviceTime)}</p>
        </div>
      </Card>

      {loading ? (
        <p className="text-sm text-night-500">Loading setlist…</p>
      ) : (
        <WorshipChoirServiceView
          plan={plan}
          songs={songs}
          team={team}
          serviceDate={serviceDate}
          serviceTime={serviceTime}
          title={title}
          rehearsalDate={rehearsalDate}
          rehearsalTime={rehearsalTime}
          rehearsalNotes={rehearsalNotes}
          status={status}
          initialSongId={initialSongId}
          userId={user?.id}
          canManage={canManage}
          myMember={myMember}
          onToggleSongPrepared={toggleSongPrepared}
          onToggleReady={toggleReady}
        />
      )}
    </div>
  );
}
