import { Suspense } from "react";
import { ChoirWorshipLeaderStudioPage } from "@/components/groups/choir/studio/ChoirWorshipLeaderStudioPage";

type LeaderStudioPageProps = {
  params: Promise<{ id: string }>;
};

export default async function GroupWorshipLeaderStudioPage({ params }: LeaderStudioPageProps) {
  const { id } = await params;
  return (
    <Suspense fallback={<div className="py-6 text-sm text-night-500">Loading leader studio…</div>}>
      <ChoirWorshipLeaderStudioPage groupId={id} />
    </Suspense>
  );
}
