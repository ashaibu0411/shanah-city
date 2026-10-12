import { Suspense } from "react";
import { ChoirTeamConnectPage } from "@/components/groups/choir/connect/ChoirTeamConnectPage";

type ConnectPageProps = {
  params: Promise<{ id: string }>;
};

export default async function GroupTeamConnectPage({ params }: ConnectPageProps) {
  const { id } = await params;
  return (
    <Suspense fallback={<div className="py-6 text-sm text-night-500">Loading Team Connect…</div>}>
      <ChoirTeamConnectPage groupId={id} />
    </Suspense>
  );
}
