"use client";

import { getCampus, site } from "@/lib/site";
import { buildTrackedJoinUrl, isTrackableJoinUrl } from "@/lib/meeting-join-utils";
import type { Meeting } from "@/lib/types";
import { Badge, Button, Card } from "@/components/ui";

function platformLabel(meeting: Meeting) {
  if (meeting.platform === "in-person") return "In person";
  if (meeting.joinUrl?.includes("youtube")) return "YouTube";
  if (meeting.platform === "zoom") return "Zoom";
  return "Microsoft Teams";
}

function platformBadgeVariant(meeting: Meeting) {
  if (meeting.platform === "in-person") return "outline" as const;
  return "outline" as const;
}

export function MeetingCard({
  meeting,
  compact = false,
  canManage = false,
  onRemove,
}: {
  meeting: Meeting;
  compact?: boolean;
  canManage?: boolean;
  onRemove?: () => void;
}) {
  const campus = getCampus(meeting.campusId);
  const isInPerson = meeting.platform === "in-person";
  const joinUrl = meeting.joinUrl ?? "";
  const isExternal = joinUrl.includes("shanahcity.org");
  const isYouTube = joinUrl.includes("youtube");
  const trackable = !isInPerson && isTrackableJoinUrl(joinUrl);
  const joinHref = trackable
    ? buildTrackedJoinUrl({ meetingId: meeting.id, source: "meetings_page" })
    : joinUrl;
  const label = platformLabel(meeting);

  const content = (
    <>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Badge variant={platformBadgeVariant(meeting)}>{label}</Badge>
          <h3
            className={`mt-2 font-display font-semibold text-night-900 ${
              compact ? "text-lg" : "text-xl"
            }`}
          >
            {meeting.title}
          </h3>
          <p className="mt-1 text-sm text-night-600">
            {campus.name} · {meeting.schedule}
          </p>
          <p className="text-sm text-night-500">Host: {meeting.host}</p>
          {isInPerson && meeting.location && (
            <p className="mt-1 text-sm text-night-600">
              <span className="font-semibold">Location:</span> {meeting.location}
            </p>
          )}
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
            <p className="self-center text-sm text-night-600">Meet in person at the listed address.</p>
          </>
        ) : (
          <>
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
                    : `Join on ${label}`}
              </Button>
            </a>
            {!isExternal && joinUrl && (
              <Button
                variant="secondary"
                onClick={() =>
                  navigator.clipboard.writeText(trackable ? joinHref : joinUrl)
                }
              >
                Copy link
              </Button>
            )}
          </>
        )}
        {canManage && onRemove && (
          <Button variant="secondary" onClick={onRemove}>
            Remove
          </Button>
        )}
      </div>
      {trackable && (
        <p className="mt-2 text-xs text-night-500">
          Join is tracked for signed-in members before opening {label}.
        </p>
      )}
    </>
  );

  if (compact) {
    return content;
  }

  return <Card>{content}</Card>;
}
