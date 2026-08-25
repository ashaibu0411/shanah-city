"use client";

import { getCampus, site } from "@/lib/site";
import {
  AUTOMATED_MEETING_REMINDERS,
  MANUAL_PUSH_MEETING_IDS,
  SHIFT_YOUR_EVENING_ID,
  SHIFT_YOUR_MORNING_ID,
  isAutomatedReminderMeeting,
  isTrackedJoinMeeting,
} from "@/lib/meeting-catalog";
import { buildTrackedJoinUrl, isTrackableJoinUrl } from "@/lib/meeting-join-utils";
import { meetingHasJoinLink } from "@/lib/meeting-utils";
import { getZonedDateParts } from "@/lib/denver-time";
import type { Meeting } from "@/lib/types";
import { Badge, Button, Card } from "@/components/ui";

function platformLabel(meeting: Meeting) {
  if (meeting.platform === "in-person") return "In person";
  if (meeting.joinUrl?.includes("youtube")) return "YouTube";
  if (meeting.platform === "zoom") return "Zoom";
  return "Microsoft Teams";
}

function formatMeetingId(value?: string | null) {
  if (!value) return "";
  const digits = value.replace(/\D/g, "");
  if (digits.length === 10 || digits.length === 11) {
    return `${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6)}`;
  }
  return value;
}

function isMeetingToday(meeting: Meeting) {
  const denver = getZonedDateParts();
  const rule = AUTOMATED_MEETING_REMINDERS[meeting.id];
  if (rule) return rule.weekdays.includes(denver.weekday);

  const schedule = meeting.schedule.toLowerCase();
  if (!schedule.includes("first") || denver.weekday < 1) return false;
  if (Number(denver.day) > 7) return false;
  if (schedule.includes("monday") && denver.weekday === 1) return true;
  if (schedule.includes("tuesday") && denver.weekday === 2) return true;
  if (schedule.includes("wednesday") && denver.weekday === 3) return true;
  if (schedule.includes("thursday") && denver.weekday === 4) return true;
  return false;
}

function todayBadgeLabel(meeting: Meeting) {
  if (meeting.id === SHIFT_YOUR_MORNING_ID) return "Today · 8:00 AM MST";
  if (meeting.id === SHIFT_YOUR_EVENING_ID) return "Today · 8:00 PM MST";
  return "Today";
}

export function MeetingCard({
  meeting,
  compact = false,
  featured = false,
  canManage = false,
  sendingPush = false,
  pushStatus,
  onRemove,
  onToggleReminder,
  onSendPush,
}: {
  meeting: Meeting;
  compact?: boolean;
  featured?: boolean;
  canManage?: boolean;
  sendingPush?: boolean;
  pushStatus?: string | null;
  onRemove?: () => void;
  onToggleReminder?: (enabled: boolean) => void;
  onSendPush?: () => void;
}) {
  const campus = getCampus(meeting.campusId);
  const isInPerson = meeting.platform === "in-person";
  const joinUrl = meeting.joinUrl ?? "";
  const hasJoinLink = meetingHasJoinLink(meeting);
  const isYouTube = joinUrl.includes("youtube");
  const trackable =
    hasJoinLink && isTrackableJoinUrl(joinUrl) && isTrackedJoinMeeting(meeting.id);
  const joinHref = trackable
    ? buildTrackedJoinUrl({ meetingId: meeting.id, source: "meetings_page" })
    : joinUrl;
  const label = platformLabel(meeting);
  const automated = isAutomatedReminderMeeting(meeting.id);
  const reminder = AUTOMATED_MEETING_REMINDERS[meeting.id];
  const meetsToday = isMeetingToday(meeting);
  const showReminderToggle = Boolean(canManage && onToggleReminder && automated && !compact);
  const showManualPush = Boolean(
    canManage && onSendPush && MANUAL_PUSH_MEETING_IDS.has(meeting.id) && !compact,
  );
  const isEvening = meeting.id === SHIFT_YOUR_EVENING_ID;

  const content = (
    <>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={featured ? "default" : "outline"}>{label}</Badge>
            {meetsToday && <Badge variant="live">{todayBadgeLabel(meeting)}</Badge>}
          </div>
          <h3
            className={`mt-2 font-display font-semibold text-night-900 ${
              featured ? "text-2xl" : compact ? "text-lg" : "text-xl"
            }`}
          >
            {meeting.title}
          </h3>
          <p className="mt-1 text-sm text-night-600">
            {campus.name} · {meeting.schedule}
          </p>
          {meeting.host && (
            <p className="text-sm text-night-500">Host: {meeting.host}</p>
          )}
          {isInPerson && meeting.location && (
            <p className="mt-1 text-sm text-night-600">
              <span className="font-semibold">Location:</span> {meeting.location}
            </p>
          )}
        </div>
      </div>

      {(meeting.meetingId || meeting.passcode) && (
        <div className="mt-4 rounded-xl bg-white/80 p-3 text-sm text-night-600 ring-1 ring-night-900/5">
          {meeting.meetingId && (
            <p>
              <span className="font-semibold">Meeting ID:</span>{" "}
              {formatMeetingId(meeting.meetingId)}
            </p>
          )}
          {meeting.passcode && (
            <p>
              <span className="font-semibold">Passcode:</span> {meeting.passcode}
            </p>
          )}
        </div>
      )}

      <div className="mt-4 flex flex-wrap gap-2">
        {isInPerson ? (
          <>
            {meeting.location && (
              <Button
                variant="secondary"
                onClick={() =>
                  window.open(
                    `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(meeting.location ?? site.address)}`,
                    "_blank",
                  )
                }
              >
                Open location
              </Button>
            )}
            <p className="self-center text-sm text-night-600">
              Meet in person at the listed address.
            </p>
          </>
        ) : hasJoinLink ? (
          <>
            {trackable ? (
              <Button onClick={() => window.location.assign(joinHref)}>
                {isYouTube ? "Watch on YouTube" : `Join on ${label}`}
              </Button>
            ) : (
              <Button href={joinHref}>
                {isYouTube ? "Watch on YouTube" : `Join on ${label}`}
              </Button>
            )}
            <Button
              variant="secondary"
              onClick={() => navigator.clipboard.writeText(joinUrl)}
            >
              Copy link
            </Button>
          </>
        ) : (
          <p className="text-sm text-night-600">Join link will be posted here when available.</p>
        )}
        {canManage && onRemove && (
          <Button variant="secondary" onClick={onRemove}>
            Remove
          </Button>
        )}
      </div>
      {trackable && (
        <p className="mt-2 text-xs text-night-500">
          Join is tracked for signed-in members so we can see who came to prayer.
        </p>
      )}

      {showReminderToggle && reminder && (
        <div className="mt-4 rounded-xl bg-white/90 p-3 ring-1 ring-night-900/10">
          <p className="text-sm font-semibold text-night-900">
            {reminder.whenLabel} push is {meeting.notifyEnabled ? "on" : "paused"}
          </p>
          <p className="mt-1 text-xs text-night-600">
            Automatically notifies everyone on the app {reminder.whenLabel}. Pause it whenever
            this gathering is cancelled.
          </p>
          <Button
            variant={meeting.notifyEnabled ? "secondary" : "primary"}
            className="mt-3"
            onClick={() => onToggleReminder?.(!meeting.notifyEnabled)}
          >
            {meeting.notifyEnabled ? "Pause reminders" : "Resume reminders"}
          </Button>
        </div>
      )}

      {showManualPush && (
        <div className="mt-4 rounded-xl bg-white/90 p-3 ring-1 ring-night-900/10">
          <p className="text-sm font-semibold text-night-900">Manual push notification</p>
          <p className="mt-1 text-xs text-night-600">
            Days can shift, so this does not send automatically. Send a notification to everyone
            on the app when the meeting is confirmed.
          </p>
          <Button className="mt-3" disabled={sendingPush} onClick={onSendPush}>
            {sendingPush ? "Sending..." : "Send push now"}
          </Button>
          {pushStatus && <p className="mt-2 text-xs text-night-600">{pushStatus}</p>}
        </div>
      )}
    </>
  );

  if (compact) {
    return content;
  }

  return (
    <Card
      className={
        featured
          ? isEvening
            ? "bg-gradient-to-br from-indigo-50 via-white to-sand-50 ring-indigo-200/80"
            : "bg-gradient-to-br from-amber-50 via-white to-sand-50 ring-amber-200/80"
          : ""
      }
    >
      {content}
    </Card>
  );
}
