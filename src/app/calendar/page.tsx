import { Suspense } from "react";
import { CalendarHub } from "@/components/calendar/CalendarHub";
import { PageHeader } from "@/components/ui";

export default function CalendarPage() {
  return (
    <>
      <PageHeader
        eyebrow="Schedule"
        title="Church calendar"
        description="Worship, outreach, and special events by month. Tap a day for details and RSVP."
      />
      <Suspense fallback={<p className="text-sm text-night-600">Loading calendar…</p>}>
        <CalendarHub />
      </Suspense>
    </>
  );
}
