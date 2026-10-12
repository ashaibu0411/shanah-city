import { Suspense } from "react";
import { ChoirTeamAvailabilityPage } from "@/components/groups/choir/availability/ChoirTeamAvailabilityPage";

type TeamAvailabilityPageProps = {
  params: Promise<{ id: string }>;
};

export default async function GroupTeamAvailabilityPage({ params }: TeamAvailabilityPageProps) {
  const { id } = await params;
  return (
    <Suspense fallback={<div className="py-6 text-sm text-night-500">Loading team availability…</div>}>
      <ChoirTeamAvailabilityPage groupId={id} />
    </Suspense>
  );
}
