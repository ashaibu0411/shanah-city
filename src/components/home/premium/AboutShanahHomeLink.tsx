import Link from "next/link";
import { appLinkPrefetchEnabled } from "@/components/app/app-link-prefetch";

/** Shared entry into the public church profile for app and web homepages. */
export function AboutShanahHomeLink({ compact = false }: { compact?: boolean }) {
  return (
    <section aria-label="Discover Shanah City" className={compact ? "mx-4 my-5" : "mx-auto my-8 w-full max-w-[1250px] px-5"}>
      <Link
        href="/about"
        prefetch={appLinkPrefetchEnabled()}
        className="group flex min-w-0 flex-col gap-4 rounded-[26px] border border-[#decdb0] bg-[#fffaf0] p-6 shadow-[0_10px_28px_rgba(23,41,65,0.09)] transition hover:border-[#c4a575] hover:shadow-lg dark:border-white/10 dark:bg-[#0c1e37] sm:flex-row sm:items-center sm:justify-between sm:p-7"
      >
        <div className="min-w-0">
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#84663e] dark:text-blue-200">Discover Shanah City</p>
          <h2 className="mt-2 font-display text-[22px] font-bold leading-[1.3] text-[#102f55] dark:text-white sm:text-2xl">Our Story, Our Faith, Our Purpose</h2>
          <p className="mt-2 max-w-2xl text-[15px] leading-[1.65] text-[#42556b] dark:text-slate-200">Discover the faith that founded our church, the values that unite us, and our heart to serve our community.</p>
        </div>
        <span className="inline-flex min-h-11 shrink-0 items-center justify-center rounded-full bg-[#123d72] px-6 py-3 text-sm font-semibold text-white transition group-hover:bg-blue-800">
          About us <span aria-hidden className="ml-2">→</span>
        </span>
      </Link>
    </section>
  );
}
