"use client";

import { useState } from "react";
import Link from "next/link";
import { Card } from "@/components/ui";
import { GroupServiceSchedulePanel } from "@/components/calendar/ChoirServiceSchedulePanel";
import {
  GroupEventsSection,
  UnavailabilitySection,
} from "@/components/calendar/GroupCalendarPanel";
import { WORSHIP_GROUP_ID } from "@/lib/worship-types";

const CHOIR_GROUP_LABEL = "Shanah Worship (Choir)";

export function WorshipTeamCalendarPanel({
  canManageSchedule,
}: {
  canManageSchedule: boolean;
}) {
  const [scheduleReload, setScheduleReload] = useState(0);
  const signInNextUrl = "/worship?tab=team-calendar";

  return (
    <div className="space-y-6">
      <Card className="border-violet-100 bg-violet-50/50">
        <h3 className="font-display text-lg font-semibold text-night-900">Worship team calendar</h3>
        <p className="mt-2 text-sm text-night-600">
          See who is on worship, praise, and ministration, what to wear, and the month at a glance.
          {canManageSchedule
            ? " Add or edit services below — the choir gets a push and group chat when you save."
            : " Leaders update assignments here; you will be notified when the schedule changes."}
        </p>
        <p className="mt-2 text-sm text-night-500">
          Setlists and rehearsal notes stay under{" "}
          <Link href="/worship" className="font-semibold text-night-800 underline">
            Service plan
          </Link>
          .
        </p>
      </Card>

      <GroupServiceSchedulePanel
        groupId={WORSHIP_GROUP_ID}
        groupLabel={CHOIR_GROUP_LABEL}
        onChanged={() => setScheduleReload((n) => n + 1)}
      />

      <GroupEventsSection
        groupId={WORSHIP_GROUP_ID}
        groupLabel={CHOIR_GROUP_LABEL}
        signInNextUrl={signInNextUrl}
        reloadKey={scheduleReload}
      />

      <UnavailabilitySection group="choir" signInNextUrl={signInNextUrl} />
    </div>
  );
}
