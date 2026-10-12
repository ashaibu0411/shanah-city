"use client";

import { ChoirMySchedulePage } from "@/components/groups/choir/schedule/ChoirMySchedulePage";
import type { ChoirMySchedulePayload } from "@/lib/choir-availability-types";

type ChoirMyScheduleTabProps = {
  groupId: string;
  initialData?: ChoirMySchedulePayload | null;
  initialError?: string | null;
};

export function ChoirMyScheduleTab(props: ChoirMyScheduleTabProps) {
  return <ChoirMySchedulePage {...props} embedded />;
}
