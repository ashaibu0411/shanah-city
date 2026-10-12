import { Suspense } from "react";
import { ChoirAvailabilityCenterPage } from "@/components/groups/choir/availability/ChoirAvailabilityCenterPage";

type AvailabilityPageProps = {
  params: Promise<{ id: string }>;
};

export default async function GroupAvailabilityPage({ params }: AvailabilityPageProps) {
  const { id } = await params;
  return (
    <Suspense fallback={<div className="py-6 text-sm text-night-500">Loading availability center…</div>}>
      <ChoirAvailabilityCenterPage groupId={id} />
    </Suspense>
  );
}
