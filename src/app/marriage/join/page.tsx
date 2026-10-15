import { MarriageJoinInvite } from "@/components/marriage/MarriageJoinInvite";
import { marriagePremium } from "@/components/marriage/marriage-counseling-premium";

export default function MarriageJoinPage() {
  return (
    <div className={marriagePremium.page}>
      <div className={marriagePremium.inset}>
        <MarriageJoinInvite />
      </div>
    </div>
  );
}
