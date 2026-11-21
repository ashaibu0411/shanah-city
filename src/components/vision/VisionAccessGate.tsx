import Link from "next/link";

/**
 * Shown when a signed-in member opens a vision deep link without an assignment.
 * Does not reveal proposal text, comments, or publication status.
 */
export function VisionAccessGate() {
  const panel =
    "min-w-0 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-600 dark:bg-slate-800 sm:p-10";

  return (
    <div className="mx-auto w-full max-w-2xl min-w-0 space-y-7 px-3 py-9 text-slate-900 dark:text-slate-100 sm:px-6">
      <header className="rounded-3xl bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950 p-8 text-white shadow-lg">
        <p className="text-sm font-extrabold uppercase tracking-[.1em] text-blue-100">
          Shanah City · Private leadership
        </p>
        <h1 className="mt-3 text-3xl font-extrabold leading-tight tracking-tight sm:text-4xl">
          Vision proposal access
        </h1>
      </header>
      <section className={panel + " space-y-7 text-[17px] leading-[1.8] text-slate-800 dark:text-slate-100"}>
        <p className="text-xl font-extrabold leading-[1.45] text-slate-950 dark:text-white">
          This proposal is available only to invited leaders.
        </p>
        <p className="font-medium text-slate-700 dark:text-slate-100">
          If someone shared a link with you, sign-in alone does not grant access. Ask the Senior Pastor
          to invite your Shanah City account through Vision Center, then open the same link again.
        </p>
        <p className="text-base font-semibold leading-[1.7] text-slate-600 dark:text-slate-200">
          Review comments and unpublished drafts stay private and are never exposed through a share link.
        </p>
        <Link
          href="/leadership/vision"
          className="inline-flex min-h-[48px] items-center justify-center rounded-xl bg-blue-700 px-5 py-3 text-base font-bold text-white shadow-sm dark:bg-blue-500 dark:text-white"
        >
          Go to Vision Center
        </Link>
      </section>
    </div>
  );
}