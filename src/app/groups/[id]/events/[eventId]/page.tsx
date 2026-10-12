import { Suspense } from "react";
import { ChoirWorshipEventDetailPage } from "@/components/groups/choir/events/ChoirWorshipEventDetailPage";

type WorshipEventDetailRouteProps = {
  params: Promise<{ id: string; eventId: string }>;
};

export default async function GroupWorshipEventDetailPage({ params }: WorshipEventDetailRouteProps) {
  const { id, eventId } = await params;
  return (
    <Suspense fallback={<div className="py-6 text-sm text-night-500">Loading event…</div>}>
      <ChoirWorshipEventDetailPage groupId={id} eventId={eventId} />
    </Suspense>
  );
}
