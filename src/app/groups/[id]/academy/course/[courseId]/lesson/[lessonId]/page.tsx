import { Suspense } from "react";
import { ChoirAcademyLessonPage } from "@/components/groups/choir/academy/ChoirAcademyLessonPage";

type AcademyLessonPageProps = {
  params: Promise<{ id: string; courseId: string; lessonId: string }>;
};

export default async function GroupWorshipAcademyLessonPage({ params }: AcademyLessonPageProps) {
  const { id, courseId, lessonId } = await params;
  return (
    <Suspense fallback={<div className="py-6 text-sm text-night-500">Loading lesson…</div>}>
      <ChoirAcademyLessonPage groupId={id} courseId={courseId} lessonId={lessonId} />
    </Suspense>
  );
}
