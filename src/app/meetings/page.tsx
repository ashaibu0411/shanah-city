import { MeetingsList } from "@/components/meetings/MeetingsList";
import { PageHeader } from "@/components/ui";

export default function MeetingsPage() {
  return (
    <>
      <PageHeader
        eyebrow="Connect"
        title="Meetings"
        description="Join small groups, youth, prayer nights, and leader huddles — Zoom and Teams links in one tap."
      />
      <MeetingsList />
    </>
  );
}
