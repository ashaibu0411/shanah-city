"use client";

import { useEffect, useMemo, useState } from "react";
import { useApp } from "@/components/app/AppProvider";
import { CalendarMonthView } from "@/components/calendar/CalendarMonthView";
import { MeetingCard } from "@/components/meetings/MeetingCard";
import { MeetingClickReport } from "@/components/meetings/MeetingClickReport";
import type { Meeting } from "@/lib/types";
import { Button, Card } from "@/components/ui";

export function MeetingsList() {
  const { campusId } = useApp();
  const [showAll, setShowAll] = useState(false);
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [canManage, setCanManage] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadMeetings() {
      setLoading(true);
      const response = await fetch("/api/meetings");
      const data = await response.json();
      setMeetings(data.meetings ?? []);
      setCanManage(Boolean(data.canManage));
      setLoading(false);
    }

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

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-night-600">
          {showAll ? "All campuses" : "Your campus + global meetings"}
        </p>
        <Button variant="ghost" onClick={() => setShowAll((value) => !value)}>
          {showAll ? "Show my campus" : "Show all campuses"}
        </Button>
      </div>

      <CalendarMonthView
        items={filtered}
        emptyDayLabel="No meetings on this day."
        renderItem={(meeting) => <MeetingCard meeting={meeting} compact />}
      />

      <div className="grid gap-4 md:grid-cols-2">
        {loading ? (
          <p className="text-sm text-night-500">Loading meetings…</p>
        ) : (
          filtered.map((meeting) => (
            <MeetingCard
              key={meeting.id}
              meeting={meeting}
              canManage={canManage}
              onRemove={() => removeMeeting(meeting.id)}
            />
          ))
        )}
      </div>
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

  const next = meetings.find(
    (meeting) => meeting.campusId === campusId || meeting.campusId === "online",
  );

  if (!next) return null;

  const platformLabel =
    next.platform === "in-person"
      ? "In person"
      : next.platform === "zoom"
        ? "Zoom"
        : "Teams";

  return (
    <Card href="/meetings" className="mb-8">
      <p className="text-xs font-semibold uppercase tracking-wider text-sand-600">
        Up next
      </p>
      <h3 className="mt-2 font-display text-xl font-semibold text-night-900">
        {next.title}
      </h3>
      <p className="mt-1 text-sm text-night-600">
        {next.schedule} · {platformLabel}
      </p>
      <p className="mt-3 text-sm font-semibold text-night-800">
        Tap to see all meeting links →
      </p>
    </Card>
  );
}
