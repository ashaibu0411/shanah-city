import { redirect } from "next/navigation";
import { MarriageCouplesLearningCenter } from "@/components/marriage/MarriageCouplesLearningCenter";
import { marriagePremium } from "@/components/marriage/marriage-counseling-premium";
import { isMarriageStage2Enabled } from "@/lib/marriage-stage2-feature";

export default function MarriageLearnPage() {
  if (!isMarriageStage2Enabled()) {
    redirect("/marriage");
  }
  return (
    <div className={marriagePremium.page}>
      <div className={marriagePremium.inset}>
        <MarriageCouplesLearningCenter />
      </div>
    </div>
  );
}
