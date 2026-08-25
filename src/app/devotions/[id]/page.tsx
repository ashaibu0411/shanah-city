import { notFound, redirect } from "next/navigation";
import { DevotionDetail } from "@/components/devotions/DevotionDetail";
import { MarkFeedRead } from "@/components/notifications/MarkFeedRead";
import { getDevotionById } from "@/lib/devotion-server";

export const dynamic = "force-dynamic";

type DevotionDetailPageProps = {
  params: Promise<{ id: string }>;
};

export default async function DevotionDetailPage({ params }: DevotionDetailPageProps) {
  const { id } = await params;
  const devotion = await getDevotionById(id);

  if (!devotion || devotion.published === false) {
    notFound();
  }

  return (
    <>
      <MarkFeedRead feed="devotions" />
      <DevotionDetail devotion={devotion} />
    </>
  );
}
