import { Suspense } from "react";
import { CalendarHub } from "@/components/calendar/CalendarHub";
import { PageHeader } from "@/components/ui";

export default function CalendarPage() {
  return (
    <>
      <PageHeader
        eyebrow="Schedule"
        title="Calendars"
        description="Browse worship, meetings, and church events by month. Tap a day for full details, times, and RSVP."
      />
      <Suspense fallback={<p className="text-sm text-night-600">Loading calendar…</p>}>
        <CalendarHub />
      </Suspense>
    </>
  );
}
