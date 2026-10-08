import Link from "next/link";
import { couplesHubPremium } from "@/components/couples/couples-hub-premium";

export function CouplesHubEntryCard() {
  return (
    <div className={`${couplesHubPremium.heroCard} mb-4 !p-4`}>
      <p className={couplesHubPremium.sectionEyebrow}>Couples Hub</p>
      <p className="mt-1 font-display text-lg font-semibold text-night-950 dark:text-sand-100">
        Private marriage tools + community
      </p>
      <p className="mt-2 text-sm text-night-700 dark:text-sand-300">
        Calendar, love notes, check-ins, and games — plus Power Couples events and resources.
      </p>
      <Link href="/couples" className={`${couplesHubPremium.primaryCta} mt-4`}>
        Open Couples Hub
      </Link>
    </div>
  );
}
