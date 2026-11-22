import Link from "next/link";
import { notFound } from "next/navigation";
import { FASTING_PRAYER_CONTENT } from "@/lib/fasting-guide-content";
import { FASTING_GUIDE_DAYS, FASTING_GUIDE_START } from "@/lib/fasting-guide-2026";
export const dynamicParams = false;
export function generateStaticParams() { return FASTING_GUIDE_DAYS.map((_, index) => ({ day: String(index + 1) })); }
export default async function FastingPrayerDay({ params }: { params: Promise<{ day: string }> }) {
  const { day: raw } = await params;
  const day = Number(raw);
  if (!Number.isInteger(day) || day < 1 || day > 14) notFound();
  const [, scripture] = FASTING_GUIDE_DAYS[day - 1];
  const content = FASTING_PRAYER_CONTENT[day];
  const title = content.theme;
  const date = new Date(Date.parse(FASTING_GUIDE_START + "T12:00:00Z") + (day - 1) * 86400000).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric", timeZone: "UTC" });
  return <main className="mx-auto max-w-2xl px-4 pb-20 pt-8 text-night-900 dark:text-sand-100">
    <Link href="/fasting-prayer-2027" className="text-sm font-semibold underline">← All 14 days</Link>
    <header className="mt-5 rounded-[2rem] bg-[#122c54] px-6 py-9 text-white shadow-xl">
      <p className="text-xs font-bold uppercase tracking-[.2em] text-amber-200">Shanah City · Day {day} of 14</p>
      <h1 className="mt-4 font-display text-3xl font-semibold leading-tight sm:text-4xl">{title}</h1>
      <p className="mt-3 text-sm text-slate-200">{date}</p>
    </header>
    <section className="mt-6 rounded-2xl border border-night-900/10 bg-white p-6 dark:border-white/10 dark:bg-white/5">
      <h2 className="text-lg font-semibold">Key scripture</h2><p className="mt-3 text-xl leading-relaxed">{scripture}</p>
      <p className="mt-5 text-base leading-7">{content.introduction}</p>
    </section>
    <section className="mt-5 rounded-2xl border border-night-900/10 bg-white p-6 dark:border-white/10 dark:bg-white/5">
      <h2 className="text-xl font-semibold">Scriptures</h2>
      <ol className="mt-4 list-decimal space-y-3 pl-6 text-base leading-7">{content.scriptures.map((item,i)=><li key={i} className="pl-1">{item}</li>)}</ol>
    </section>
    <section className="mt-5 rounded-2xl border border-night-900/10 bg-white p-6 dark:border-white/10 dark:bg-white/5">
      <h2 className="text-xl font-semibold">Prophetic Prayers</h2>
      <ol className="mt-4 list-decimal space-y-4 pl-6 text-base leading-7">{content.prayers.map((item,i)=><li key={i} className="pl-1">{item}</li>)}</ol>
    </section>
    <nav className="mt-8 flex items-center justify-between gap-3 text-sm font-semibold">
      {day > 1 ? <Link className="rounded-xl border px-4 py-3" href={`/fasting-prayer-2027/day/${day-1}`}>← Previous day</Link> : <span />}
      {day < 14 ? <Link className="rounded-xl bg-[#122c54] px-4 py-3 text-white" href={`/fasting-prayer-2027/day/${day+1}`}>Next day →</Link> : <Link href="/fasting-prayer-2027">All days</Link>}
    </nav>
  </main>;
}
