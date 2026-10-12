import { Suspense } from "react";
import { ChoirAcademyHomePage } from "@/components/groups/choir/academy/ChoirAcademyHomePage";

type AcademyPageProps = {
  params: Promise<{ id: string }>;
};

export default async function GroupWorshipAcademyPage({ params }: AcademyPageProps) {
  const { id } = await params;
  return (
    <Suspense fallback={<div className="py-6 text-sm text-night-500">Loading Worship Academy…</div>}>
      <ChoirAcademyHomePage groupId={id} />
    </Suspense>
  );
}
