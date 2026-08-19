import { DevotionCard } from "@/components/devotions/DevotionCard";
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
        description="Start each day with scripture, reflection, and prayer. Anyone can read or listen — no account needed."
      />
      {devotions.length === 0 ? (
        <p className="rounded-2xl bg-white p-5 text-sm text-night-600 ring-1 ring-night-900/5">
          No published devotion yet. Check back soon.
        </p>
      ) : (
        <div className="grid gap-4">
          {devotions.map((devotion) => (
            <DevotionCard key={devotion.id} devotion={devotion} />
          ))}
        </div>
      )}
    </>
  );
}
