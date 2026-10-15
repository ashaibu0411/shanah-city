import { Suspense } from "react";
import { MarriageModuleSubmitReview } from "@/components/marriage/MarriageModuleSubmitReview";
import { marriagePremium } from "@/components/marriage/marriage-counseling-premium";

export default async function MarriageModuleSubmitPage({
  params,
}: {
  params: Promise<{ moduleId: string }>;
}) {
  const { moduleId } = await params;
  return (
    <div className={marriagePremium.page}>
      <div className={marriagePremium.inset}>
        <Suspense fallback={<p className={marriagePremium.cardMuted}>Loading…</p>}>
          <MarriageModuleSubmitReview moduleId={moduleId} />
        </Suspense>
      </div>
    </div>
  );
}
