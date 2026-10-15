import { MarriageCounselorWorkspace } from "@/components/marriage/MarriageCounselorWorkspace";
import { marriagePremium } from "@/components/marriage/marriage-counseling-premium";

export default function MarriageCounselorPage() {
  return (
    <div className={marriagePremium.page}>
      <div className={marriagePremium.inset}>
        <MarriageCounselorWorkspace />
      </div>
    </div>
  );
}
