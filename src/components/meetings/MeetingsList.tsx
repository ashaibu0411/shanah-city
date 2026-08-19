"use client";

import { useEffect, useMemo, useState } from "react";
import { useApp } from "@/components/app/AppProvider";
import { CalendarMonthView } from "@/components/calendar/CalendarMonthView";
import { MeetingCard } from "@/components/meetings/MeetingCard";
import { MeetingClickReport } from "@/components/meetings/MeetingClickReport";
import {
  MANUAL_PUSH_MEETING_IDS,
  SHIFT_YOUR_EVENING_ID,
  SHIFT_YOUR_MORNING_ID,
  isAutomatedReminderMeeting,
  isProtectedMeetingId,
} from "@/lib/meeting-catalog";
import { getZonedDateParts } from "@/lib/denver-time";
import type { Meeting } from "@/lib/types";
import { Button, Card, SectionTitle } from "@/components/ui";

export function MeetingsList() {
  const { campusId } = useApp();
  const [showAll, setShowAll] = useState(false);
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [canManage, setCanManage] = useState(false);
  const [loading, setLoading] = useState(true);
  const [sendingId, setSendingId] = useState<string | null>(null);
  const [pushStatus, setPushStatus] = useState<Record<string, string>>({});

  async function loadMeetings() {
    setLoading(true);
    const response = await fetch("/api/meetings");
    const data = await response.json();
    setMeetings(data.meetings ?? []);
    setCanManage(Boolean(data.canManage));
    setLoading(false);
  }

  useEffect(() => {
    loadMeetings();
  }, []);

  const filtered = useMemo(
    () =>
      showAll
        ? meetings
        : meetings.filter(
            (meeting) => meeting.campusId === campusId || meeting.campusId === "online",
          ),
    [campusId, meetings, showAll],
  );

  const featured = filtered.filter((meeting) => isAutomatedReminderMeeting(meeting.id));
  const monthly = filtered.filter((meeting) => MANUAL_PUSH_MEETING_IDS.has(meeting.id));
  const others = filtered.filter(
    (meeting) =>
      !isAutomatedReminderMeeting(meeting.id) && !MANUAL_PUSH_MEETING_IDS.has(meeting.id),
  );

  async function removeMeeting(id: string) {
    const response = await fetch("/api/meetings", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    if (response.ok) {
      setMeetings((current) => current.filter((meeting) => meeting.id !== id));
    }
  }

  async function toggleReminder(id: string, notifyEnabled: boolean) {
    const response = await fetch("/api/meetings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, notifyEnabled }),
    });
    if (response.ok) {
      const data = await response.json();
      setMeetings((current) =>
        current.map((meeting) => (meeting.id === id ? data.meeting : meeting)),
      );
    }
  }

  async function sendPush(id: string) {
    setSendingId(id);
    setPushStatus((current) => ({ ...current, [id]: "" }));
    const response = await fetch("/api/meetings/notify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    const data = await response.json();
    setSendingId(null);
    if (response.ok) {
      setPushStatus((current) => ({
        ...current,
        [id]: data.configured
          ? `Sent to ${data.sent} device${data.sent === 1 ? "" : "s"}.`
          : "Push is not configured on the server yet.",
      }));
    } else {
      setPushStatus((current) => ({
        ...current,
        [id]: data.error ?? "Could not send notification.",
      }));
    }
  }

  return (
    <div>
      {featured.length > 0 && (
        <div className="mb-8 grid gap-4 md:grid-cols-2">
          {featured.map((meeting) => (
            <MeetingCard
              key={meeting.id}
              meeting={meeting}
              featured
              canManage={canManage}
              onToggleReminder={(enabled) => toggleReminder(meeting.id, enabled)}
            />
          ))}
        </div>
      )}

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-night-600">
          {showAll ? "All campuses" : "Your campus + online meetings"}
        </p>
        <Button variant="ghost" onClick={() => setShowAll((value) => !value)}>
          {showAll ? "Show my campus" : "Show all campuses"}
        </Button>
      </div>

      <CalendarMonthView
        items={filtered}
        emptyDayLabel="No meetings on this day."
        renderItem={(meeting) => (
          <MeetingCard
            meeting={meeting}
            compact
            canManage={canManage}
            onRemove={
              isProtectedMeetingId(meeting.id) ? undefined : () => removeMeeting(meeting.id)
            }
          />
        )}
      />

      {monthly.length > 0 && (
        <>
          <SectionTitle title="Monthly gatherings" />
          <div className="mb-8 grid gap-4 md:grid-cols-2">
            {monthly.map((meeting) => (
              <MeetingCard
                key={meeting.id}
                meeting={meeting}
                canManage={canManage}
                sendingPush={sendingId === meeting.id}
                pushStatus={pushStatus[meeting.id]}
                onSendPush={() => sendPush(meeting.id)}
              />
            ))}
          </div>
        </>
      )}

      {others.length > 0 && (
        <>
          <SectionTitle title="More gatherings" />
          <div className="grid gap-4 md:grid-cols-2">
            {others.map((meeting) => (
              <MeetingCard
                key={meeting.id}
                meeting={meeting}
                canManage={canManage}
                onRemove={() => removeMeeting(meeting.id)}
              />
            ))}
          </div>
        </>
      )}
      <MeetingClickReport meetings={meetings} />
    </div>
  );
}

export function MeetingPreview() {
  const { campusId } = useApp();
  const [meetings, setMeetings] = useState<Meeting[]>([]);

  useEffect(() => {
    fetch("/api/meetings")
      .then((response) => response.json())
      .then((data) => setMeetings(data.meetings ?? []));
  }, []);

  const denver = getZonedDateParts();
  const morning = meetings.find((meeting) => meeting.id === SHIFT_YOUR_MORNING_ID);
  const evening = meetings.find((meeting) => meeting.id === SHIFT_YOUR_EVENING_ID);
  const next =
    denver.weekday >= 1 && denver.weekday <= 5 && denver.hour < 12 && morning
      ? morning
      : [2, 3, 4].includes(denver.weekday) && denver.hour >= 12 && evening
        ? evening
        : morning ??
          evening ??
          meetings.find(
            (meeting) => meeting.campusId === campusId || meeting.campusId === "online",
          );

  if (!next) return null;

  const platformLabel =
    next.platform === "in-person"
      ? "In person"
      : next.joinUrl?.includes("youtube")
        ? "YouTube"
        : next.platform === "zoom"
          ? "Zoom"
          : "Teams";

  const isPrayer = isAutomatedReminderMeeting(next.id);

  return (
    <Card href="/meetings" className="mb-8">
      <p className="text-xs font-semibold uppercase tracking-wider text-sand-600">
        {next.id === SHIFT_YOUR_EVENING_ID
          ? "This evening"
          : next.id === SHIFT_YOUR_MORNING_ID
            ? "This morning"
            : "Up next"}
      </p>
      <h3 className="mt-2 font-display text-xl font-semibold text-night-900">
        {next.title}
      </h3>
      <p className="mt-1 text-sm text-night-600">
        {next.schedule} · {platformLabel}
      </p>
      <p className="mt-3 text-sm font-semibold text-night-800">
        {isPrayer ? "Tap to join prayer →" : "Tap to see all meeting links →"}
      </p>
    </Card>
  );
}
