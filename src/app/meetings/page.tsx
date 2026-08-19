import { MeetingsList } from "@/components/meetings/MeetingsList";
import { PageHeader } from "@/components/ui";

export default function MeetingsPage() {
  return (
    <>
      <PageHeader
        eyebrow="Connect"
        title="Meetings"
        description="Morning prayer is Monday–Friday at 8:00 AM MST. Evening prayer is Tuesday–Thursday at 8:00 PM MST. Monthly gatherings and service links are below."
      />
      <MeetingsList />
    </>
  );
}
