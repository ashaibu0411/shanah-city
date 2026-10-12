import { Suspense } from "react";
import { ChoirWorshipEventsPage } from "@/components/groups/choir/events/ChoirWorshipEventsPage";

type WorshipEventsPageProps = {
  params: Promise<{ id: string }>;
};

export default async function GroupWorshipEventsPage({ params }: WorshipEventsPageProps) {
  const { id } = await params;
  return (
    <Suspense fallback={<div className="py-6 text-sm text-night-500">Loading worship events…</div>}>
      <ChoirWorshipEventsPage groupId={id} />
    </Suspense>
  );
}
