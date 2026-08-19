"use client";

import { VolunteerCheckInPanel } from "@/components/checkin/VolunteerCheckInPanel";
import { UsherSchedulePanel } from "@/components/frontliners/UsherSchedulePanel";

export function FrontLinersHub({
  initialDate,
  initialTime,
}: {
  initialDate?: string;
  initialTime?: string;
}) {
  return (
    <div className="space-y-8">
      <VolunteerCheckInPanel />
      <UsherSchedulePanel initialDate={initialDate} initialTime={initialTime} />
    </div>
  );
}
