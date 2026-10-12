import { Suspense } from "react";
import { ChoirAcademyCoursesPage } from "@/components/groups/choir/academy/ChoirAcademyCoursesPage";

type AcademyCoursesPageProps = {
  params: Promise<{ id: string }>;
};

export default async function GroupWorshipAcademyCoursesPage({ params }: AcademyCoursesPageProps) {
  const { id } = await params;
  return (
    <Suspense fallback={<div className="py-6 text-sm text-night-500">Loading courses…</div>}>
      <ChoirAcademyCoursesPage groupId={id} />
    </Suspense>
  );
}
