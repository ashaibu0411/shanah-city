import { redirect } from "next/navigation";
import { DevotionsFeed } from "@/components/devotions/DevotionsFeed";
import { MarkFeedRead } from "@/components/notifications/MarkFeedRead";
import { PageHeader } from "@/components/ui";
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
      <PageHeader
        eyebrow="Daily"
        title="Devotions"
        description="Browse past devotions by title. Tap any message to read or listen in full."
      />
      <MarkFeedRead feed="devotions" />
      {devotions.length === 0 ? (
        <p className="rounded-2xl bg-white p-5 text-sm text-night-600 ring-1 ring-night-900/5">
          No published devotion yet. Check back soon.
        </p>
      ) : (
        <DevotionsFeed devotions={devotions} />
      )}
    </>
  );
}
