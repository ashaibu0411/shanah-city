import Link from "next/link";

type PageShellProps = {
  eyebrow: string;
  title: string;
  description: string;
  children?: React.ReactNode;
};

export function PageShell({
  eyebrow,
  title,
  description,
  children,
}: PageShellProps) {
  return (
    <section className="mx-auto max-w-4xl px-6 py-20">
      <p className="text-sm font-semibold uppercase tracking-[0.2em] text-sand-600">
        {eyebrow}
      </p>
      <h1 className="mt-3 font-display text-5xl font-semibold text-night-900">
        {title}
      </h1>
      <p className="mt-6 text-lg leading-relaxed text-night-600">{description}</p>
      {children ?? (
        <div className="mt-10 rounded-2xl border border-dashed border-night-900/15 bg-white p-8 text-sm text-night-600">
          This section is ready for your content. Update{" "}
          <code className="rounded bg-sand-100 px-1.5 py-0.5">src/lib/site.ts</code>{" "}
          and add page-specific content when you&apos;re ready.
        </div>
      )}
      <Link
        href="/"
        className="mt-8 inline-block text-sm font-semibold text-night-800 hover:text-night-950"
      >
        ← Back to home
      </Link>
    </section>
  );
}
