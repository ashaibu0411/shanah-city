import Link from "next/link";

/** Shared entry into the public church profile for app and web homepages. */
export function AboutShanahHomeLink({ compact = false }: { compact?: boolean }) {
  return (
    <section aria-label="Discover Shanah City" className={compact ? "mx-4 my-5" : "mx-auto my-8 w-full max-w-[1250px] px-5"}>
      <Link href="/about" className="group flex min-w-0 flex-col gap-4 rounded-2xl border border-blue-100 bg-white p-5 shadow-sm transition hover:border-blue-300 hover:shadow-md dark:border-white/10 dark:bg-[#0c1e37] sm:flex-row sm:items-center sm:justify-between sm:p-7">
        <div className="min-w-0">
          <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-blue-700 dark:text-blue-200">Discover Shanah City</p>
          <h2 className="mt-2 text-xl font-extrabold leading-snug text-slate-950 dark:text-white sm:text-2xl">Our Story, Our Faith, Our Purpose</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-700 dark:text-slate-200">Discover the faith that founded our church, the values that unite us, and our heart to serve our community.</p>
        </div>
        <span className="inline-flex min-h-11 shrink-0 items-center justify-center rounded-full bg-[#082a59] px-5 py-2 text-sm font-bold text-white transition group-hover:bg-blue-800">
          About us <span aria-hidden className="ml-2">→</span>
        </span>
      </Link>
    </section>
  );
}
