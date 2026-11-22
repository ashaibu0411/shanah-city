import Link from "next/link";
import { FASTING_GUIDE_DAYS, FASTING_GUIDE_START, fastingGuideDay } from "@/lib/fasting-guide-2026";

export const metadata = { title: "14 Days of Fasting & Prayer into 2027 | Shanah City", description: "Our Year of Expansion — 14 days of fasting and prophetic prayer." };

export default function FastingPrayerGuidePage() {
  const current = fastingGuideDay();
  return (
    <main className="mx-auto max-w-4xl px-4 pb-20 pt-8 text-night-900 dark:text-sand-100">
      <div className="rounded-[2rem] bg-[#122c54] px-6 py-10 text-white shadow-xl sm:px-10">
        <p className="text-xs font-bold uppercase tracking-[.2em] text-amber-200">Shanah City · 14 days of fasting & prayer</p>
        <h1 className="mt-4 font-display text-4xl font-semibold leading-tight sm:text-5xl">Our Year of Expansion</h1>
        <p className="mt-4 text-lg text-slate-100">We Are Believing God to Carry Our Evidence!</p>
        <p className="mt-4 text-sm text-slate-200">November 30 – December 13, 2026 · America/Denver</p>
      </div>
      <section className="mt-6 grid gap-3 sm:grid-cols-2" aria-label="Fasting and prayer schedule">
        <div className="rounded-2xl border border-night-900/10 bg-white p-5 dark:bg-white/5"><h2 className="font-semibold">Fasting</h2><p className="mt-2 text-lg">6:00 PM – 6:00 AM</p></div>
        <div className="rounded-2xl border border-night-900/10 bg-white p-5 dark:bg-white/5"><h2 className="font-semibold">Prayer times</h2><p className="mt-2 text-lg">8:00 AM · 6:00 PM · 12:00 AM</p></div>
      </section>
      <section className="mt-8 rounded-2xl border border-night-900/10 bg-white p-6 dark:bg-white/5">
        <h2 className="text-xl font-semibold">Our declaration</h2>
        <p className="mt-3 text-lg leading-relaxed">God will carry our evidence! What He has promised, He will perform. What He has spoken, He will establish. What He has started, He will complete!</p>
        <p className="mt-3 text-sm text-night-600 dark:text-sand-300">Scriptural foundation: Isaiah 54:2–3 · Genesis 26:12–14 · Psalm 126:1–3 · Hebrews 11:1–2</p>
      </section>
      <section className="mt-10">
        <h2 className="font-display text-2xl font-semibold">The 14-day journey</h2>
        <p className="mt-2 text-sm text-night-600 dark:text-sand-300">Select any day to read its full introduction, supporting scriptures, and five prophetic prayers. All 14 days are available to members and prayer leaders.</p>
        <ol className="mt-5 grid gap-3 sm:grid-cols-2">
          {FASTING_GUIDE_DAYS.map(([title, scripture], i) => (
            <li key={title} className={`rounded-2xl border p-4 ${current === i+1 ? "border-amber-500 bg-amber-50 dark:bg-amber-900/20" : "border-night-900/10 bg-white dark:border-white/10 dark:bg-white/5"}`}>
              <p className="text-xs font-bold uppercase tracking-wider text-night-600 dark:text-sand-300">Day {i+1} · {new Date(Date.parse(FASTING_GUIDE_START+"T12:00:00Z")+i*86400000).toLocaleDateString("en-US",{month:"short",day:"numeric",timeZone:"UTC"})}</p>
              <h3 className="mt-2 text-lg font-semibold leading-snug"><Link className="underline decoration-transparent hover:decoration-current" href={`/fasting-prayer-2027/day/${i+1}`}>{title} →</Link></h3>
              <p className="mt-2 text-sm text-night-600 dark:text-sand-300">{scripture}</p>
            </li>
          ))}
        </ol>
      </section>
      <p className="mt-8 text-sm text-night-600 dark:text-sand-300">Daily push reminders are scheduled for 7:00 AM Denver time, November 30–December 13, 2026. Delivery requires enabled notifications and a registered device.</p>
      <Link href="/devotions" className="mt-6 inline-block text-sm font-semibold underline">Explore Shanah City devotions</Link>
    </main>
  );
}
