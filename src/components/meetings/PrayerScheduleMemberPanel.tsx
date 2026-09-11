"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui";
import {
  formatPrayerAssignmentDate,
  SCHEDULE_SLOT_META,
  SCHEDULE_SLOT_TYPES,
  type ScheduleSlotType,
} from "@/lib/prayer-schedule-types";

type Assignment = {
  assignmentDate: string;
  userName: string;
};

type ScheduleResponse = {
  mine: Record<ScheduleSlotType, Assignment[]>;
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

  if (loading || !data) return null;

  const mySlots = SCHEDULE_SLOT_TYPES.filter((slot) => (data.mine[slot]?.length ?? 0) > 0);
  if (mySlots.length === 0) return null;

  return (
    <Card className="mb-6">
      <h3 className="font-display text-lg font-semibold text-night-900">Your schedule assignments</h3>
      <div className="mt-4 space-y-4">
        {mySlots.map((slot) => (
          <div key={slot}>
            <p className="text-sm font-semibold text-night-800">{SCHEDULE_SLOT_META[slot].label}</p>
            <ul className="mt-2 space-y-1 text-sm text-night-700">
              {data.mine[slot].map((entry) => (
                <li key={`${slot}-${entry.assignmentDate}`}>
                  {formatPrayerAssignmentDate(entry.assignmentDate)}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </Card>
  );
}
