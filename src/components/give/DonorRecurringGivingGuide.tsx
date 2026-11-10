import Link from "next/link";

export function DonorRecurringGivingGuide() {
  return (
    <section className="mb-8 rounded-2xl border border-emerald-600/20 bg-emerald-50/60 p-5 dark:border-emerald-500/25 dark:bg-emerald-950/20">
      <h2 className="font-display text-lg font-semibold text-night-950 dark:text-sand-50">
        Manage recurring giving
      </h2>
      <p className="mt-2 text-sm leading-relaxed text-night-700 dark:text-sand-200">
        Update your gift amount, card or bank payment method, or cancel a recurring gift in Stripe&apos;s
        secure billing portal. Sign in, then open your profile giving section or use the button below
        after you start a recurring gift online.
      </p>
      <p className="mt-2 text-sm text-night-600 dark:text-sand-300">
        <strong>Bank debit (ACH) recurring</strong> through standalone church debits is planned as a
        separate phase. Today, recurring gifts use Stripe Checkout (card or ACH where enabled).
      </p>
      <p className="mt-3">
        <Link
          href="/profile#giving"
          className="text-sm font-semibold text-emerald-800 underline dark:text-emerald-300"
        >
          Your giving &amp; recurring gifts →
        </Link>
      </p>
    </section>
  );
}
