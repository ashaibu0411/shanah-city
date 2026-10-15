import Link from "next/link";
import { editorialPremium } from "@/components/app/editorial-premium";

export function MarriageCommunityPromo() {
  return (
    <div className="mb-6 rounded-2xl bg-gradient-to-br from-rose-950/95 to-night-900 p-5 text-white ring-1 ring-white/10">
      <p className="text-xs font-bold uppercase tracking-[0.2em] text-rose-200/90">Marriage &amp; Relationships</p>
      <h2 className="mt-1 font-display text-lg font-semibold">Before We Say &ldquo;I Do&rdquo;</h2>
      <p className="mt-2 text-sm leading-relaxed text-white/85">
        Premarital and marriage enrichment journeys for linked spouses — private answers, shared comparisons
        after you both submit.
      </p>
      <Link
        href="/marriage"
        className={`${editorialPremium.primaryButton} mt-4 inline-flex min-h-[44px] items-center justify-center px-5 py-2.5 text-sm font-semibold`}
      >
        Open counseling hub
      </Link>
    </div>
  );
}
