import Link from "next/link";
import { marriagePremium } from "@/components/marriage/marriage-counseling-premium";

export function MarriageCounselingGuestIntro() {
  return (
    <div className={marriagePremium.page}>
      <div className={marriagePremium.inset}>
        <div className={marriagePremium.hero}>
          <p className={marriagePremium.sectionLabel}>Marriage &amp; Relationships</p>
          <h1 className={marriagePremium.heroTitle}>Before We Say &ldquo;I Do&rdquo;</h1>
          <p className={marriagePremium.heroLead}>
            Shanah City&apos;s Marriage Prep helps couples prepare for covenant marriage with guided
            assessments, partner comparisons, and pastoral counseling support. Each partner uses their
            own secure login.
          </p>
        </div>

        <div className={`${marriagePremium.card} mt-6 space-y-3 text-sm leading-relaxed`}>
          <p>
            Sign in to start or continue a premarital journey, accept a partner invitation, or meet
            with your counselor. Assessments, homework, and private notes require authentication — we
            never show another couple&apos;s data here.
          </p>
          <p className={marriagePremium.cardMuted}>
            Pastoral preparation and education — not emergency care or licensed therapy. For crisis
            support, contact your pastor or local services.
          </p>
        </div>

        <div className="mt-6 grid gap-2 sm:grid-cols-2">
          <Link href="/sign-in?next=/marriage" className={marriagePremium.primaryCta}>
            Sign in
          </Link>
          <Link href="/sign-up?next=/marriage" className={marriagePremium.secondaryCta}>
            Create account
          </Link>
        </div>

        <Link href="/marriage/about" className={`${marriagePremium.secondaryCta} mt-3`}>
          Learn about the program
        </Link>
      </div>
    </div>
  );
}
