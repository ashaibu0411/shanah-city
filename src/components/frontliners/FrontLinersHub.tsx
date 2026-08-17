"use client";

import { UsherSchedulePanel } from "@/components/frontliners/UsherSchedulePanel";

export function FrontLinersHub({
  initialDate,
  initialTime,
}: {
  initialDate?: string;
  initialTime?: string;
}) {
  return <UsherSchedulePanel initialDate={initialDate} initialTime={initialTime} />;
}
