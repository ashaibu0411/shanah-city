import Link from "next/link";
import { couplesHubPremium } from "@/components/couples/couples-hub-premium";
import { powerCouplesGroupHubPath } from "@/lib/couples-hub-paths";

export function CouplesHubTitleBar({
  title,
  backHref = powerCouplesGroupHubPath(),
  backLabel = "Back",
}: {
  title: string;
  backHref?: string;
  backLabel?: string;
}) {
  return (
    <div className={couplesHubPremium.titleBar}>
      <Link href={backHref} className={couplesHubPremium.titleBarBack} aria-label={backLabel}>
        <span aria-hidden>‹</span>
      </Link>
      <h1 className={couplesHubPremium.titleBarHeading}>{title}</h1>
      <div className={couplesHubPremium.titleBarSpacer} aria-hidden />
    </div>
  );
}
