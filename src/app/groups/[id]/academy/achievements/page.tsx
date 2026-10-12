import { Suspense } from "react";
import { ChoirAcademyAchievementsPage } from "@/components/groups/choir/academy/ChoirAcademyAchievementsPage";

type AcademyAchievementsPageProps = {
  params: Promise<{ id: string }>;
};

export default async function GroupWorshipAcademyAchievementsPage({ params }: AcademyAchievementsPageProps) {
  const { id } = await params;
  return (
    <Suspense fallback={<div className="py-6 text-sm text-night-500">Loading achievements…</div>}>
      <ChoirAcademyAchievementsPage groupId={id} />
    </Suspense>
  );
}
