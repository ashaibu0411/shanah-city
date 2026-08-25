import { DevotionListItem } from "@/components/devotions/DevotionListItem";
import type { Devotion } from "@/lib/types";

export function DevotionsFeed({ devotions }: { devotions: Devotion[] }) {
  return (
    <div className="grid gap-3">
      {devotions.map((devotion) => (
        <DevotionListItem key={devotion.id} devotion={devotion} />
      ))}
    </div>
  );
}
