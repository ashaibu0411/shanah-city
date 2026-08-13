import { CalendarHub } from "@/components/calendar/CalendarHub";
import { PageHeader } from "@/components/ui";

export default function CalendarPage() {
  return (
    <>
      <PageHeader
        eyebrow="Schedule"
        title="Calendars"
        description="Church events, choir availability, and pastor schedules — all in one place."
      />
      <CalendarHub />
    </>
  );
}
