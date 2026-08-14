"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { CalendarMonthView } from "@/components/calendar/CalendarMonthView";
import { MeetingCard } from "@/components/meetings/MeetingCard";
import { MeetingClickReport } from "@/components/meetings/MeetingClickReport";
import { WEEKDAY_OPTIONS } from "@/lib/calendar-utils";
import { campuses } from "@/lib/site";
import type { Meeting, MeetingPlatform } from "@/lib/types";
import { Button, Card } from "@/components/ui";

export function MeetingsCalendarPanel() {
  const { user } = useAuth();
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState(true);
  const [canManage, setCanManage] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [campusId, setCampusId] = useState("colorado");
  const [host, setHost] = useState("");
  const [schedule, setSchedule] = useState("");
  const [platform, setPlatform] = useState<MeetingPlatform>("zoom");
  const [joinUrl, setJoinUrl] = useState("");
  const [location, setLocation] = useState("");
  const [meetingId, setMeetingId] = useState("");
  const [passcode, setPasscode] = useState("");
  const [startsOn, setStartsOn] = useState("");
  const [endsOn, setEndsOn] = useState("");
  const [recurringWeekday, setRecurringWeekday] = useState("");

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

  function resetForm() {
    setTitle("");
    setHost("");
    setSchedule("");
    setJoinUrl("");
    setLocation("");
    setMeetingId("");
    setPasscode("");
    setStartsOn("");
    setEndsOn("");
    setRecurringWeekday("");
  }

  async function addMeeting() {
    const response = await fetch("/api/meetings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title,
        campusId,
        host,
        schedule,
        platform,
        joinUrl: platform === "in-person" ? undefined : joinUrl,
        location: platform === "in-person" ? location : undefined,
        meetingId,
        passcode,
        startsOn: startsOn || undefined,
        endsOn: endsOn || undefined,
        recurringWeekday: recurringWeekday === "" ? undefined : Number(recurringWeekday),
      }),
    });
    const data = await response.json();
    if (response.ok) {
      setMessage("Meeting added.");
      resetForm();
      loadMeetings();
    } else {
      setMessage(data.error ?? "Could not add meeting.");
    }
  }

  async function removeMeeting(id: string) {
    const response = await fetch("/api/meetings", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    const data = await response.json();
    if (response.ok) {
      loadMeetings();
    } else {
      setMessage(data.error ?? "Could not delete meeting.");
    }
  }

  return (
    <>
      <CalendarMonthView
        items={meetings}
        emptyDayLabel="No meetings scheduled on this day."
        renderItem={(meeting) => (
          <div key={meeting.id} className="rounded-xl bg-sand-50 p-4 ring-1 ring-night-900/5">
            <MeetingCard meeting={meeting} compact />
            {canManage && (
              <Button
                variant="secondary"
                className="mt-3"
                onClick={() => removeMeeting(meeting.id)}
              >
                Remove meeting
              </Button>
            )}
          </div>
        )}
      />

      {canManage ? (
        <Card className="mb-6">
          <h3 className="font-display text-lg font-semibold text-night-900">
            Manage meetings
          </h3>
          <p className="mt-1 text-sm text-night-600">
            Admin Group members can add in-person, Zoom, or Teams meetings with join links.
          </p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Title"
              className="rounded-xl border border-night-900/10 bg-sand-50 px-3 py-2.5 text-sm outline-none ring-night-900/5 focus:ring-2"
            />
            <select
              value={campusId}
              onChange={(event) => setCampusId(event.target.value)}
              className="rounded-xl border border-night-900/10 bg-sand-50 px-3 py-2.5 text-sm outline-none ring-night-900/5 focus:ring-2"
            >
              {campuses.map((campus) => (
                <option key={campus.id} value={campus.id}>
                  {campus.name}
                </option>
              ))}
              <option value="online">Online</option>
            </select>
            <input
              value={host}
              onChange={(event) => setHost(event.target.value)}
              placeholder="Host"
              className="rounded-xl border border-night-900/10 bg-sand-50 px-3 py-2.5 text-sm outline-none ring-night-900/5 focus:ring-2"
            />
            <input
              value={schedule}
              onChange={(event) => setSchedule(event.target.value)}
              placeholder="Schedule (e.g. Friday 7:00 PM MT)"
              className="rounded-xl border border-night-900/10 bg-sand-50 px-3 py-2.5 text-sm outline-none ring-night-900/5 focus:ring-2"
            />
            <select
              value={platform}
              onChange={(event) => setPlatform(event.target.value as MeetingPlatform)}
              className="rounded-xl border border-night-900/10 bg-sand-50 px-3 py-2.5 text-sm outline-none ring-night-900/5 focus:ring-2"
            >
              <option value="in-person">In person</option>
              <option value="zoom">Zoom</option>
              <option value="teams">Microsoft Teams</option>
            </select>
            {platform === "in-person" ? (
              <input
                value={location}
                onChange={(event) => setLocation(event.target.value)}
                placeholder="Location / address"
                className="rounded-xl border border-night-900/10 bg-sand-50 px-3 py-2.5 text-sm outline-none ring-night-900/5 focus:ring-2"
              />
            ) : (
              <input
                value={joinUrl}
                onChange={(event) => setJoinUrl(event.target.value)}
                placeholder="Join link (Zoom or Teams URL)"
                className="rounded-xl border border-night-900/10 bg-sand-50 px-3 py-2.5 text-sm outline-none ring-night-900/5 focus:ring-2 sm:col-span-2"
              />
            )}
            {platform !== "in-person" && (
              <>
                <input
                  value={meetingId}
                  onChange={(event) => setMeetingId(event.target.value)}
                  placeholder="Meeting ID (optional)"
                  className="rounded-xl border border-night-900/10 bg-sand-50 px-3 py-2.5 text-sm outline-none ring-night-900/5 focus:ring-2"
                />
                <input
                  value={passcode}
                  onChange={(event) => setPasscode(event.target.value)}
                  placeholder="Passcode (optional)"
                  className="rounded-xl border border-night-900/10 bg-sand-50 px-3 py-2.5 text-sm outline-none ring-night-900/5 focus:ring-2"
                />
              </>
            )}
            <input
              type="date"
              value={startsOn}
              onChange={(event) => setStartsOn(event.target.value)}
              className="rounded-xl border border-night-900/10 bg-sand-50 px-3 py-2.5 text-sm outline-none ring-night-900/5 focus:ring-2"
            />
            <input
              type="date"
              value={endsOn}
              onChange={(event) => setEndsOn(event.target.value)}
              placeholder="End date (optional)"
              className="rounded-xl border border-night-900/10 bg-sand-50 px-3 py-2.5 text-sm outline-none ring-night-900/5 focus:ring-2"
            />
            <select
              value={recurringWeekday}
              onChange={(event) => setRecurringWeekday(event.target.value)}
              className="rounded-xl border border-night-900/10 bg-sand-50 px-3 py-2.5 text-sm outline-none ring-night-900/5 focus:ring-2 sm:col-span-2"
            >
              <option value="">Repeat weekly (optional)</option>
              {WEEKDAY_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  Every {option.label}
                </option>
              ))}
            </select>
          </div>
          {message && <p className="mt-3 text-sm text-night-600">{message}</p>}
          <Button className="mt-4" onClick={addMeeting}>
            Add meeting
          </Button>
        </Card>
      ) : user ? (
        <Card className="mb-6 border-sand-200 bg-sand-50/60">
          <p className="text-sm text-night-600">
            Meetings are managed by the Admin Group. Join links below are available to all
            members.
          </p>
        </Card>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2">
        {loading ? (
          <Card>
            <p className="text-sm text-night-500">Loading meetings…</p>
          </Card>
        ) : (
          meetings.map((meeting) => (
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
    </>
  );
}
