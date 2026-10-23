import { MarriageDeletionRequestsAdmin } from "@/components/marriage/MarriageDeletionRequestsAdmin";
import { marriagePremium } from "@/components/marriage/marriage-counseling-premium";

export default function MarriageDeletionRequestsAdminPage() {
  return (
    <div className={marriagePremium.page}>
      <div className={marriagePremium.inset}>
        <MarriageDeletionRequestsAdmin />
      </div>
    </div>
  );
}
