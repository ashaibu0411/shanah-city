import { Suspense } from "react";
import { ChoirResourceManagePage } from "@/components/groups/choir/resources/ChoirResourceManagePage";

type ManageResourcesPageProps = {
  params: Promise<{ id: string }>;
};

export default async function GroupManageMinistryResourcesPage({ params }: ManageResourcesPageProps) {
  const { id } = await params;
  return (
    <Suspense fallback={<div className="py-6 text-sm text-night-500">Loading…</div>}>
      <ChoirResourceManagePage groupId={id} />
    </Suspense>
  );
}
