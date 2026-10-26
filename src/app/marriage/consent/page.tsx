import { MarriageConsentClient } from "@/app/marriage/consent/MarriageConsentClient";
import { marriagePremium } from "@/components/marriage/marriage-counseling-premium";

export default function MarriageConsentPage() {
  return (
    <div className={marriagePremium.page}>
      <div className={marriagePremium.inset}>
        <MarriageConsentClient />
      </div>
    </div>
  );
}
