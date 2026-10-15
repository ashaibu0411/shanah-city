import Link from "next/link";
import { marriagePremium } from "@/components/marriage/marriage-counseling-premium";

export default async function MarriageReviewPage({
  params,
}: {
  params: Promise<{ moduleId: string }>;
}) {
  const { moduleId } = await params;
  return (
    <div className={marriagePremium.page}>
      <div className={marriagePremium.inset}>
        <div className={marriagePremium.card}>
          <h1 className="font-display text-xl font-semibold">Assessment submitted</h1>
          <p className={`${marriagePremium.cardMuted} mt-2`}>
            Your answers are locked for this version. When your partner submits too, shared comparison
            topics will unlock for both of you.
          </p>
          <Link href={`/marriage/module/${moduleId}`} className={`${marriagePremium.secondaryCta} mt-4`}>
            View module
          </Link>
          <Link href="/marriage" className={`${marriagePremium.primaryCta} mt-2`}>
            Back to hub
          </Link>
        </div>
      </div>
    </div>
  );
}
