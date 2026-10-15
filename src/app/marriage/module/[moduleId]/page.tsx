import { Suspense } from "react";
import { MarriageModuleExperience } from "@/components/marriage/MarriageModuleExperience";
import { marriagePremium } from "@/components/marriage/marriage-counseling-premium";

export default async function MarriageModulePage({
  params,
}: {
  params: Promise<{ moduleId: string }>;
}) {
  const { moduleId } = await params;
  return (
    <div className={marriagePremium.page}>
      <div className={marriagePremium.inset}>
        <Suspense fallback={<p className={marriagePremium.cardMuted}>Loading module…</p>}>
          <MarriageModuleExperience moduleId={moduleId} />
        </Suspense>
      </div>
    </div>
  );
}
