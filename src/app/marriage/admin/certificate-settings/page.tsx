import { MarriageCertificateSettingsPanel } from "@/components/marriage/MarriageCertificateSettingsPanel";
import { marriagePremium } from "@/components/marriage/marriage-counseling-premium";

export default function MarriageCertificateSettingsPage() {
  return (
    <div className={marriagePremium.page}>
      <MarriageCertificateSettingsPanel />
    </div>
  );
}
