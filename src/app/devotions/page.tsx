import { DevotionCard, DevotionPreview } from "@/components/devotions/DevotionCard";
import { PageHeader } from "@/components/ui";
import { getDevotions } from "@/lib/devotion-server";

export const dynamic = "force-dynamic";

export default async function DevotionsPage() {
  const devotions = await getDevotions();

  return (
    <>
      <PageHeader
        eyebrow="Daily"
        title="Devotions"
        description="Start each day with scripture, reflection, and prayer — built for a daily habit."
      />
      <div className="grid gap-4">
        {devotions.map((devotion) => (
          <DevotionCard key={devotion.id} devotion={devotion} />
        ))}
      </div>
    </>
  );
}
