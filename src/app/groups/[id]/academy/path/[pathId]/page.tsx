import { Suspense } from "react";
import { ChoirAcademyPathPage } from "@/components/groups/choir/academy/ChoirAcademyPathPage";

type AcademyPathPageProps = {
  params: Promise<{ id: string; pathId: string }>;
};

export default async function GroupWorshipAcademyPathPage({ params }: AcademyPathPageProps) {
  const { id, pathId } = await params;
  return (
    <Suspense fallback={<div className="py-6 text-sm text-night-500">Loading learning path…</div>}>
      <ChoirAcademyPathPage groupId={id} pathId={pathId} />
    </Suspense>
  );
}
