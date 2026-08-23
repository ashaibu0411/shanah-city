import { Suspense } from "react";
import { CalendarHub } from "@/components/calendar/CalendarHub";
import { PageHeader } from "@/components/ui";

export default function CalendarPage() {
  return (
    <>
      <PageHeader
        eyebrow="Schedule"
        title="Calendars"
        description="Church events sync from Outlook. Choir and pastor calendars stay in the app."
      />
      <Suspense fallback={<p className="text-sm text-night-600">Loading calendar…</p>}>
        <CalendarHub />
      </Suspense>
    </>
  );
}
