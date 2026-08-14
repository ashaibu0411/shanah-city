import { MeetingsList } from "@/components/meetings/MeetingsList";
import { PageHeader } from "@/components/ui";

export default function MeetingsPage() {
  return (
    <>
      <PageHeader
        eyebrow="Connect"
        title="Meetings"
        description="Join in-person gatherings or tap Zoom and Teams links — all in one place."
      />
      <MeetingsList />
    </>
  );
}
