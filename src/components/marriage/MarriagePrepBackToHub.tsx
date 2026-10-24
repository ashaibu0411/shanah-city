import Link from "next/link";

export function MarriagePrepBackToHub({ label = "Back to Marriage Prep hub" }: { label?: string }) {
  return (
    <Link
      href="/marriage"
      className="mb-4 inline-flex min-h-[44px] items-center text-sm font-semibold text-clay-800 underline underline-offset-2 dark:text-clay-300"
    >
      ← {label}
    </Link>
  );
}
