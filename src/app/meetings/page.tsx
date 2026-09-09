import { MeetingsList } from "@/components/meetings/MeetingsList";
import { MarkFeedRead } from "@/components/notifications/MarkFeedRead";
import { PageHeader } from "@/components/ui";

export default function MeetingsPage() {
  return (
    <>
      <PageHeader
        eyebrow="Connect"
        title="Ministry meetings"
        description="Daily prayer and ministry Zoom links. Join from here — church-wide worship and events are on the calendar."
        sectionIndex={0}
        accentWord="meetings"
      />
      <MarkFeedRead feed="meetings" />
      <MeetingsList />
    </>
  );
}
