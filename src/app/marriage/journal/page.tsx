import { MarriageJournalPanel } from "@/components/marriage/MarriageJournalPanel";
import { marriagePremium } from "@/components/marriage/marriage-counseling-premium";

export default function MarriageJournalPage() {
  return (
    <div className={marriagePremium.page}>
      <div className={marriagePremium.inset}>
        <MarriageJournalPanel />
      </div>
    </div>
  );
}
