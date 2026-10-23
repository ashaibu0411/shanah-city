import Link from "next/link";
import { marriagePremium } from "@/components/marriage/marriage-counseling-premium";

export function MarriageSubmittedReadOnlyNotice({
  comparisonUnlocked,
  partnerSubmitted,
  moduleId,
}: {
  comparisonUnlocked: boolean;
  partnerSubmitted: boolean;
  moduleId: string;
}) {
  let detail =
    "Your answers have been submitted and cannot be changed. You can review your responses while waiting for your partner to complete this module.";
  if (comparisonUnlocked) {
    detail =
      "Both partners have submitted this module. Review your answers below, or open the shared comparison.";
  } else if (partnerSubmitted) {
    detail =
      "Your partner has submitted this module. You can review your locked answers here; comparison unlocks after you both submit.";
  }

  return (
    <div className={`${marriagePremium.card} mb-4`} data-testid="marriage-lesson-read-only-banner">
      <p className="text-sm font-semibold text-clay-900 dark:text-clay-100">Submitted — Read Only</p>
      <p className={`${marriagePremium.cardMuted} mt-1 text-sm`}>{detail}</p>
      {comparisonUnlocked && (
        <Link href={`/marriage/module/${moduleId}/compare`} className={`${marriagePremium.primaryCta} mt-3 inline-flex`}>
          View comparison
        </Link>
      )}
    </div>
  );
}
