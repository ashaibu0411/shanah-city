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
      <CalendarHub />
    </>
  );
}
