"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui";
import { formatPrayerAssignmentDate, PRAYER_SLOT_META } from "@/lib/prayer-schedule-types";

type Assignment = {
  assignmentDate: string;
  userName: string;
};

type ScheduleResponse = {
  mine: {
    morning: Assignment[];
    evening: Assignment[];
  };
  team: {
    morning: Assignment[];
    evening: Assignment[];
  };
};

export function PrayerScheduleMemberPanel() {
  const [data, setData] = useState<ScheduleResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/prayer-schedule")
      .then((response) => response.json())
      .then((payload) => {
        if (payload.mine) setData(payload);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return null;

  const myMorning = data?.mine.morning ?? [];
  const myEvening = data?.mine.evening ?? [];
  const hasMine = myMorning.length > 0 || myEvening.length > 0;
  const hasTeam =
    (data?.team.morning.length ?? 0) > 0 || (data?.team.evening.length ?? 0) > 0;

  if (!hasMine && !hasTeam) return null;

  return (
    <Card className="mb-6">
      <h3 className="font-display text-lg font-semibold text-night-900">Prayer leader schedule</h3>
      {hasMine ? (
        <div className="mt-4 space-y-4">
          {myMorning.length > 0 && (
            <div>
              <p className="text-sm font-semibold text-night-800">{PRAYER_SLOT_META.morning.label}</p>
              <ul className="mt-2 space-y-1 text-sm text-night-700">
                {myMorning.map((entry) => (
                  <li key={`morning-${entry.assignmentDate}`}>
                    {formatPrayerAssignmentDate(entry.assignmentDate)}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {myEvening.length > 0 && (
            <div>
              <p className="text-sm font-semibold text-night-800">{PRAYER_SLOT_META.evening.label}</p>
              <ul className="mt-2 space-y-1 text-sm text-night-700">
                {myEvening.map((entry) => (
                  <li key={`evening-${entry.assignmentDate}`}>
                    {formatPrayerAssignmentDate(entry.assignmentDate)}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      ) : (
        <p className="mt-3 text-sm text-night-600">
          Published prayer rotations are listed below when you are assigned to lead.
        </p>
      )}
    </Card>
  );
}
