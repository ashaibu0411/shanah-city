import { Suspense } from "react";
import { ChoirAcademyCoursePage } from "@/components/groups/choir/academy/ChoirAcademyCoursePage";

type AcademyCoursePageProps = {
  params: Promise<{ id: string; courseId: string }>;
};

export default async function GroupWorshipAcademyCoursePage({ params }: AcademyCoursePageProps) {
  const { id, courseId } = await params;
  return (
    <Suspense fallback={<div className="py-6 text-sm text-night-500">Loading course…</div>}>
      <ChoirAcademyCoursePage groupId={id} courseId={courseId} />
    </Suspense>
  );
}
