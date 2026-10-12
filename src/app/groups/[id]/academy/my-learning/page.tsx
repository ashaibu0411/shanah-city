import { Suspense } from "react";
import { ChoirAcademyMyLearningPage } from "@/components/groups/choir/academy/ChoirAcademyMyLearningPage";

type AcademyMyLearningPageProps = {
  params: Promise<{ id: string }>;
};

export default async function GroupWorshipAcademyMyLearningPage({ params }: AcademyMyLearningPageProps) {
  const { id } = await params;
  return (
    <Suspense fallback={<div className="py-6 text-sm text-night-500">Loading my learning…</div>}>
      <ChoirAcademyMyLearningPage groupId={id} />
    </Suspense>
  );
}
