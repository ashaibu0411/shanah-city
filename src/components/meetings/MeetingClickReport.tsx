"use client";

import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { meetings } from "@/lib/site";
import type { MeetingClickLog } from "@/lib/meeting-click-types";
import { Badge, Card } from "@/components/ui";

function formatWhen(iso: string) {
  return new Date(iso).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function sourceLabel(source: MeetingClickLog["source"]) {
  switch (source) {
    case "group_page":
      return "Group page";
    case "push":
      return "Push notification";
    default:
      return "Meetings page";
  }
}

export function MeetingClickReport() {
  const { user } = useAuth();
  const [clicks, setClicks] = useState<MeetingClickLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [meetingId, setMeetingId] = useState("");
  const [groupId, setGroupId] = useState("");

  const canView =
    user?.role === "leader" || user?.role === "team" || Boolean(groupId);

  useEffect(() => {
    if (!user || (user.role !== "leader" && user.role !== "team" && !groupId)) {
      return;
    }

    const params = new URLSearchParams({ limit: "50" });
    if (meetingId) params.set("meetingId", meetingId);
    if (groupId) params.set("groupId", groupId);

    setLoading(true);
    setError(null);

    fetch(`/api/meetings/clicks?${params.toString()}`)
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.error ?? "Could not load report.");
        }
        setClicks(data.clicks ?? []);
      })
      .catch((err: Error) => {
        setError(err.message);
        setClicks([]);
      })
      .finally(() => setLoading(false));
  }, [user, meetingId, groupId]);

  const summary = useMemo(() => {
    const uniqueMembers = new Set(clicks.map((click) => click.userId));
    return {
      clicks: clicks.length,
      members: uniqueMembers.size,
    };
  }, [clicks]);

  if (!user || !canView) {
    return null;
  }

  if (user.role !== "leader" && user.role !== "team") {
    return null;
  }

  return (
    <Card className="mt-8">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-sand-600">
            Join report
          </p>
          <h2 className="mt-1 font-display text-xl font-semibold text-night-900">
            Who clicked to join
          </h2>
          <p className="mt-1 text-sm text-night-600">
            Tracks signed-in members when they use a tracked Join button (not copy/paste of the raw Zoom URL).
          </p>
        </div>
        <div className="flex gap-2 text-sm text-night-600">
          <span>
            <strong>{summary.members}</strong> members
          </span>
          <span>·</span>
          <span>
            <strong>{summary.clicks}</strong> clicks
          </span>
        </div>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <label className="text-sm text-night-700">
          <span className="font-semibold">Filter by meeting</span>
          <select
            value={meetingId}
            onChange={(event) => setMeetingId(event.target.value)}
            className="mt-1 w-full rounded-xl border border-night-900/10 bg-sand-50 px-3 py-2 text-sm"
          >
            <option value="">All meetings</option>
            {meetings.map((meeting) => (
              <option key={meeting.id} value={meeting.id}>
                {meeting.title}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm text-night-700">
          <span className="font-semibold">Filter by group id</span>
          <input
            value={groupId}
            onChange={(event) => setGroupId(event.target.value.trim())}
            placeholder="group-1234567890"
            className="mt-1 w-full rounded-xl border border-night-900/10 bg-sand-50 px-3 py-2 text-sm"
          />
        </label>
      </div>

      {loading && <p className="mt-4 text-sm text-night-500">Loading report…</p>}
      {error && (
        <p className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
      )}

      {!loading && !error && clicks.length === 0 && (
        <p className="mt-4 text-sm text-night-500">No tracked joins yet.</p>
      )}

      {!loading && clicks.length > 0 && (
        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="text-xs uppercase tracking-wide text-night-500">
              <tr>
                <th className="py-2 pr-4">When</th>
                <th className="py-2 pr-4">Member</th>
                <th className="py-2 pr-4">Meeting / group</th>
                <th className="py-2 pr-4">Source</th>
              </tr>
            </thead>
            <tbody>
              {clicks.map((click) => (
                <tr key={click.id} className="border-t border-night-900/5">
                  <td className="py-3 pr-4 text-night-600">{formatWhen(click.clickedAt)}</td>
                  <td className="py-3 pr-4">
                    <p className="font-medium text-night-900">{click.userName}</p>
                    <p className="text-xs text-night-500">{click.userEmail}</p>
                  </td>
                  <td className="py-3 pr-4">
                    <p className="font-medium text-night-900">{click.meetingTitle}</p>
                    {click.groupName && (
                      <p className="text-xs text-night-500">Group · {click.groupName}</p>
                    )}
                    {click.platform && (
                      <span className="mt-1 inline-block">
                        <Badge variant="outline">{click.platform}</Badge>
                      </span>
                    )}
                  </td>
                  <td className="py-3 pr-4 text-night-600">{sourceLabel(click.source)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}
