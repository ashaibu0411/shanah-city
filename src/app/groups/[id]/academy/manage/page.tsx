import { Suspense } from "react";
import { ChoirAcademyManagePage } from "@/components/groups/choir/academy/ChoirAcademyManagePage";

type AcademyManagePageProps = {
  params: Promise<{ id: string }>;
};

export default async function GroupWorshipAcademyManagePage({ params }: AcademyManagePageProps) {
  const { id } = await params;
  return (
    <Suspense fallback={<div className="py-6 text-sm text-night-500">Loading studio…</div>}>
      <ChoirAcademyManagePage groupId={id} />
    </Suspense>
  );
}
