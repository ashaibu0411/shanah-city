import Link from "next/link";
import { getMarriageModule } from "@/lib/marriage-counseling-curriculum";
import { marriagePremium } from "@/components/marriage/marriage-counseling-premium";

export default async function MarriageDiscussPage({
  params,
}: {
  params: Promise<{ moduleId: string }>;
}) {
  const { moduleId } = await params;
  const mod = getMarriageModule(moduleId);
  return (
    <div className={marriagePremium.page}>
      <div className={marriagePremium.inset}>
        <Link href={`/marriage/module/${moduleId}/compare`} className="text-sm font-semibold text-clay-700">
          ← Comparison
        </Link>
        <h1 className="mt-2 font-display text-xl font-semibold">Let&apos;s talk about it</h1>
        <p className={marriagePremium.cardMuted}>{mod?.title ?? "Module"}</p>
        <ul className="mt-6 space-y-4">
          <li className={marriagePremium.card}>
            <p className="font-semibold">Listening exercise</p>
            <p className={`${marriagePremium.cardMuted} mt-2`}>
              Partner A shares for two minutes without interruption. Partner B summarizes what they heard,
              then asks one clarifying question.
            </p>
          </li>
          <li className={marriagePremium.card}>
            <p className="font-semibold">Express a need without accusation</p>
            <p className={`${marriagePremium.cardMuted} mt-2`}>
              Use &ldquo;When… I feel… I need…&rdquo; Then swap roles.
            </p>
          </li>
          <li className={marriagePremium.card}>
            <p className="font-semibold">Agreed next step</p>
            <p className={`${marriagePremium.cardMuted} mt-2`}>
              Write one small action you both agree to try this week. Save it in your couple journal.
            </p>
            <Link href="/marriage/journal" className={`${marriagePremium.primaryCta} mt-3`}>
              Open journal
            </Link>
          </li>
        </ul>
      </div>
    </div>
  );
}
