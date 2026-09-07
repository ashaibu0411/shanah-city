import { redirect } from "next/navigation";
import { DevotionsPageView } from "@/components/devotions/DevotionsPageView";
import { MarkFeedRead } from "@/components/notifications/MarkFeedRead";
import { getDevotions } from "@/lib/devotion-server";

export const dynamic = "force-dynamic";

type DevotionsPageProps = {
  searchParams: Promise<{ id?: string }>;
};

export default async function DevotionsPage({ searchParams }: DevotionsPageProps) {
  const { id } = await searchParams;
  if (id?.trim()) {
    redirect(`/devotions/${encodeURIComponent(id.trim())}`);
  }

  const devotions = await getDevotions();

  return (
    <>
      <DevotionsPageView devotions={devotions} />
      <MarkFeedRead feed="devotions" />
    </>
  );
}
