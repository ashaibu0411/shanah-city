"use client";

import { useMemo, useState } from "react";
import { useApp } from "@/components/app/AppProvider";
import { MeetingClickReport } from "@/components/meetings/MeetingClickReport";
import { meetings, getCampus } from "@/lib/site";
import { buildTrackedJoinUrl, isTrackableJoinUrl } from "@/lib/meeting-join-utils";
import type { Meeting } from "@/lib/types";
import { Badge, Button, Card } from "@/components/ui";

function MeetingCard({ meeting }: { meeting: Meeting }) {
  const campus = getCampus(meeting.campusId);
  const isZoom = meeting.platform === "zoom";
  const isExternal = meeting.joinUrl.includes("shanahcity.org");
  const isYouTube = meeting.joinUrl.includes("youtube");
  const trackable = isTrackableJoinUrl(meeting.joinUrl);
  const joinHref = trackable
    ? buildTrackedJoinUrl({ meetingId: meeting.id, source: "meetings_page" })
    : meeting.joinUrl;

  const platformLabel = isYouTube
    ? "YouTube"
    : isZoom
      ? "Zoom"
      : "Microsoft Teams";

  return (
    <Card>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Badge variant="outline">{platformLabel}</Badge>
          <h3 className="mt-2 font-display text-xl font-semibold text-night-900">
            {meeting.title}
          </h3>
          <p className="mt-1 text-sm text-night-600">
            {campus.name} · {meeting.schedule}
          </p>
          <p className="text-sm text-night-500">Host: {meeting.host}</p>
        </div>
      </div>

      {meeting.meetingId && (
        <div className="mt-4 rounded-xl bg-sand-50 p-3 text-sm text-night-600">
          <p>
            <span className="font-semibold">ID:</span> {meeting.meetingId}
          </p>
          {meeting.passcode && (
            <p>
              <span className="font-semibold">Passcode:</span> {meeting.passcode}
            </p>
          )}
        </div>
      )}

      <div className="mt-4 flex flex-wrap gap-2">
        <a
          href={joinHref}
          target={trackable ? "_self" : "_blank"}
          rel={trackable ? undefined : "noopener noreferrer"}
        >
          <Button>
            {isExternal
              ? "Contact for details"
              : isYouTube
                ? "Watch on YouTube"
                : `Join on ${platformLabel}`}
          </Button>
        </a>
        {!isExternal && (
          <Button
            variant="secondary"
            onClick={() =>
              navigator.clipboard.writeText(trackable ? joinHref : meeting.joinUrl)
            }
          >
            Copy link
          </Button>
        )}
      </div>
      {trackable && (
        <p className="mt-2 text-xs text-night-500">
          Join is tracked for signed-in members before opening {platformLabel}.
        </p>
      )}
    </Card>
  );
}

export function MeetingsList() {
  const { campusId } = useApp();
  const [showAll, setShowAll] = useState(false);

  const filtered = useMemo(
    () =>
      showAll
        ? meetings
        : meetings.filter(
            (meeting) =>
              meeting.campusId === campusId || meeting.campusId === "online",
          ),
    [campusId, showAll],
  );

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
      <div className="grid gap-4 md:grid-cols-2">
        {filtered.map((meeting) => (
          <MeetingCard key={meeting.id} meeting={meeting} />
        ))}
      </div>
      <MeetingClickReport />
    </div>
  );
}

export function MeetingPreview() {
  const { campusId } = useApp();
  const next = meetings.find(
    (m) => m.campusId === campusId || m.campusId === "online",
  );

  if (!next) return null;

  return (
    <Card href="/meetings" className="mb-8">
      <p className="text-xs font-semibold uppercase tracking-wider text-sand-600">
        Up next
      </p>
      <h3 className="mt-2 font-display text-xl font-semibold text-night-900">
        {next.title}
      </h3>
      <p className="mt-1 text-sm text-night-600">
        {next.schedule} · {next.platform === "zoom" ? "Zoom" : "Teams"}
      </p>
      <p className="mt-3 text-sm font-semibold text-night-800">
        Tap to see all meeting links →
      </p>
    </Card>
  );
}
