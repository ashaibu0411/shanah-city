"use client";

import { useEffect, useMemo, useState } from "react";
import { useApp } from "@/components/app/AppProvider";
import { CalendarMonthView } from "@/components/calendar/CalendarMonthView";
import { MeetingCard } from "@/components/meetings/MeetingCard";
import { MeetingClickReport } from "@/components/meetings/MeetingClickReport";
import {
  MANUAL_PUSH_MEETING_IDS,
  isAutomatedReminderMeeting,
  isProtectedMeetingId,
} from "@/lib/meeting-catalog";
import type { Meeting } from "@/lib/types";
import { Button, SectionTitle } from "@/components/ui";

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
