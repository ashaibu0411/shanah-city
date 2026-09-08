"use client";

import { useState } from "react";
import { WEEKDAY_OPTIONS } from "@/lib/calendar-utils";
import { campuses } from "@/lib/site";
import type { MeetingPlatform } from "@/lib/types";
import { Button, Card } from "@/components/ui";

type MeetingsAdminPanelProps = {
  onSaved: () => void;
};

export function MeetingsAdminPanel({ onSaved }: MeetingsAdminPanelProps) {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [campusId, setCampusId] = useState("online");
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
      onSaved();
    } else {
      setMessage(data.error ?? "Could not add meeting.");
    }
  }

  return (
    <Card className="mt-8 border-dashed border-night-900/15 bg-sand-50/40">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="flex w-full items-center justify-between gap-3 text-left"
      >
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-night-500">
            Admin Group
          </p>
          <h3 className="mt-1 font-display text-lg font-semibold text-night-900">
            Manage ministry meetings
          </h3>
        </div>
        <span className="text-sm font-semibold text-teal-800">{open ? "Hide" : "Show"}</span>
      </button>

      {open ? (
        <div className="mt-4 border-t border-night-900/8 pt-4">
          <p className="text-sm text-night-600">
            Add or update online ministry Zoom/Teams links shown on this page. Church-wide
            worship and events belong on the Calendar.
          </p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Title"
              className="rounded-xl border border-night-900/10 bg-white px-3 py-2.5 text-sm outline-none ring-night-900/5 focus:ring-2"
            />
            <select
              value={campusId}
              onChange={(event) => setCampusId(event.target.value)}
              className="rounded-xl border border-night-900/10 bg-white px-3 py-2.5 text-sm outline-none ring-night-900/5 focus:ring-2"
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
              placeholder="Host / ministry"
              className="rounded-xl border border-night-900/10 bg-white px-3 py-2.5 text-sm outline-none ring-night-900/5 focus:ring-2"
            />
            <input
              value={schedule}
              onChange={(event) => setSchedule(event.target.value)}
              placeholder="Schedule (e.g. First Tuesday, 8:00 PM MST)"
              className="rounded-xl border border-night-900/10 bg-white px-3 py-2.5 text-sm outline-none ring-night-900/5 focus:ring-2"
            />
            <select
              value={platform}
              onChange={(event) => setPlatform(event.target.value as MeetingPlatform)}
              className="rounded-xl border border-night-900/10 bg-white px-3 py-2.5 text-sm outline-none ring-night-900/5 focus:ring-2"
            >
              <option value="zoom">Zoom</option>
              <option value="teams">Microsoft Teams</option>
              <option value="in-person">In person</option>
            </select>
            {platform === "in-person" ? (
              <input
                value={location}
                onChange={(event) => setLocation(event.target.value)}
                placeholder="Location / address"
                className="rounded-xl border border-night-900/10 bg-white px-3 py-2.5 text-sm outline-none ring-night-900/5 focus:ring-2"
              />
            ) : (
              <input
                value={joinUrl}
                onChange={(event) => setJoinUrl(event.target.value)}
                placeholder="Join link (Zoom or Teams URL)"
                className="rounded-xl border border-night-900/10 bg-white px-3 py-2.5 text-sm outline-none ring-night-900/5 focus:ring-2 sm:col-span-2"
              />
            )}
            {platform !== "in-person" ? (
              <>
                <input
                  value={meetingId}
                  onChange={(event) => setMeetingId(event.target.value)}
                  placeholder="Meeting ID (optional)"
                  className="rounded-xl border border-night-900/10 bg-white px-3 py-2.5 text-sm outline-none ring-night-900/5 focus:ring-2"
                />
                <input
                  value={passcode}
                  onChange={(event) => setPasscode(event.target.value)}
                  placeholder="Passcode (optional)"
                  className="rounded-xl border border-night-900/10 bg-white px-3 py-2.5 text-sm outline-none ring-night-900/5 focus:ring-2"
                />
              </>
            ) : null}
            <input
              type="date"
              value={startsOn}
              onChange={(event) => setStartsOn(event.target.value)}
              className="rounded-xl border border-night-900/10 bg-white px-3 py-2.5 text-sm outline-none ring-night-900/5 focus:ring-2"
            />
            <input
              type="date"
              value={endsOn}
              onChange={(event) => setEndsOn(event.target.value)}
              className="rounded-xl border border-night-900/10 bg-white px-3 py-2.5 text-sm outline-none ring-night-900/5 focus:ring-2"
            />
            <select
              value={recurringWeekday}
              onChange={(event) => setRecurringWeekday(event.target.value)}
              className="rounded-xl border border-night-900/10 bg-white px-3 py-2.5 text-sm outline-none ring-night-900/5 focus:ring-2 sm:col-span-2"
            >
              <option value="">Repeat weekly (optional)</option>
              {WEEKDAY_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  Every {option.label}
                </option>
              ))}
            </select>
          </div>
          {message ? <p className="mt-3 text-sm text-night-600">{message}</p> : null}
          <Button className="mt-4" onClick={addMeeting}>
            Add meeting
          </Button>
        </div>
      ) : null}
    </Card>
  );
}
