import { MarriageComparisonView } from "@/components/marriage/MarriageComparisonView";
import { marriagePremium } from "@/components/marriage/marriage-counseling-premium";

export default async function MarriageComparePage({
  params,
}: {
  params: Promise<{ moduleId: string }>;
}) {
  const { moduleId } = await params;
  return (
    <div className={marriagePremium.comparePage}>
      <div className={marriagePremium.compareInset}>
        <MarriageComparisonView moduleId={moduleId} />
      </div>
    </div>
  );
}
