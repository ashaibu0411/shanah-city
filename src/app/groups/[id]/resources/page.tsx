import { Suspense } from "react";
import { ChoirMinistryResourceCenterPage } from "@/components/groups/choir/resources/ChoirMinistryResourceCenterPage";

type ResourcesPageProps = {
  params: Promise<{ id: string }>;
};

export default async function GroupMinistryResourcesPage({ params }: ResourcesPageProps) {
  const { id } = await params;
  return (
    <Suspense fallback={<div className="py-6 text-sm text-night-500">Loading resource center…</div>}>
      <ChoirMinistryResourceCenterPage groupId={id} />
    </Suspense>
  );
}
