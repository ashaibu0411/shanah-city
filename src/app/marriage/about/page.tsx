import Link from "next/link";
import { marriagePremium } from "@/components/marriage/marriage-counseling-premium";

export default function MarriageAboutPage() {
  return (
    <div className={marriagePremium.page}>
      <div className={marriagePremium.inset}>
        <Link href="/marriage" className="text-sm font-semibold text-clay-700">
          ← Hub
        </Link>
        <h1 className="mt-2 font-display text-2xl font-semibold">About this program</h1>
        <div className={`${marriagePremium.card} mt-6 space-y-3 text-sm leading-relaxed`}>
          <p>
            Shanah City&apos;s Marriage &amp; Relationships hub supports premarital preparation, marriage
            enrichment, and counselor-guided exercises. Each partner uses their own login; answers stay
            private until both submit eligible assessments.
          </p>
          <p>
            This is pastoral education and preparation — not licensed therapy, emergency response, or a
            substitute for professional mental health care.
          </p>
          <p>
            For safety concerns involving abuse or coercion, use private counselor pathways — disclosures
            are not automatically shared with a partner.
          </p>
          <p className="text-xs text-night-500">
            Retention: journey data is stored for counseling continuity; contact church admin to request
            deletion or counselor access revocation.
          </p>
        </div>
      </div>
    </div>
  );
}
