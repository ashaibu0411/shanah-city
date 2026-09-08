"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { MeetingCard } from "@/components/meetings/MeetingCard";
import { MeetingsAdminPanel } from "@/components/meetings/MeetingsAdminPanel";
import {
  MANUAL_PUSH_MEETING_IDS,
  isAutomatedReminderMeeting,
  isProtectedMeetingId,
} from "@/lib/meeting-catalog";
import {
  filterMinistryOnlineMeetings,
  sortMinistryMeetings,
} from "@/lib/meeting-display-utils";
import type { Meeting } from "@/lib/types";
import { Card, SectionTitle } from "@/components/ui";

export function MeetingsList() {
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [canManage, setCanManage] = useState(false);
  const [loading, setLoading] = useState(true);
  const [sendingId, setSendingId] = useState<string | null>(null);
  const [pushStatus, setPushStatus] = useState<Record<string, string>>({});

  async function loadMeetings() {
    setLoading(true);
    const response = await fetch("/api/meetings");
    const data = await response.json();
    setMeetings(sortMinistryMeetings(filterMinistryOnlineMeetings(data.meetings ?? [])));
    setCanManage(Boolean(data.canManage));
    setLoading(false);
  }

  useEffect(() => {
    void loadMeetings();
  }, []);

  const dailyPrayer = useMemo(
    () => meetings.filter((meeting) => isAutomatedReminderMeeting(meeting.id)),
    [meetings],
  );

  const monthlyMinistries = useMemo(
    () => meetings.filter((meeting) => MANUAL_PUSH_MEETING_IDS.has(meeting.id)),
    [meetings],
  );

  const otherOnline = useMemo(
    () =>
      meetings.filter(
        (meeting) =>
          !isAutomatedReminderMeeting(meeting.id) && !MANUAL_PUSH_MEETING_IDS.has(meeting.id),
      ),
    [meetings],
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

  if (loading) {
    return (
      <Card>
        <p className="text-sm text-night-500">Loading ministry meetings…</p>
      </Card>
    );
  }

  return (
    <div className="space-y-8">
      <Card className="border-teal-100/80 bg-gradient-to-r from-teal-50/70 to-sand-50/80 p-4 sm:p-5">
        <p className="text-sm text-night-700">
          Join links for daily prayer and ministry Zoom gatherings. Sunday worship, outreach, and
          special events are on the{" "}
          <Link href="/calendar" className="font-semibold text-teal-800 hover:underline">
            church calendar
          </Link>
          .
        </p>
      </Card>

      {dailyPrayer.length > 0 ? (
        <section>
          <SectionTitle title="Daily prayer on Zoom" />
          <div className="grid gap-4 md:grid-cols-2">
            {dailyPrayer.map((meeting) => (
              <MeetingCard
                key={meeting.id}
                meeting={meeting}
                featured
                canManage={canManage}
                onToggleReminder={(enabled) => toggleReminder(meeting.id, enabled)}
              />
            ))}
          </div>
        </section>
      ) : null}

      {monthlyMinistries.length > 0 ? (
        <section>
          <SectionTitle title="Monthly ministry Zooms" />
          <div className="grid gap-4 md:grid-cols-2">
            {monthlyMinistries.map((meeting) => (
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
        </section>
      ) : null}

      {otherOnline.length > 0 ? (
        <section>
          <SectionTitle title="More online gatherings" />
          <div className="grid gap-4 md:grid-cols-2">
            {otherOnline.map((meeting) => (
              <MeetingCard
                key={meeting.id}
                meeting={meeting}
                canManage={canManage}
                onRemove={
                  isProtectedMeetingId(meeting.id) ? undefined : () => removeMeeting(meeting.id)
                }
              />
            ))}
          </div>
        </section>
      ) : null}

      {meetings.length === 0 ? (
        <Card>
          <p className="text-sm text-night-600">No ministry Zoom links are published yet.</p>
        </Card>
      ) : null}

      {canManage ? <MeetingsAdminPanel onSaved={loadMeetings} /> : null}
    </div>
  );
}
