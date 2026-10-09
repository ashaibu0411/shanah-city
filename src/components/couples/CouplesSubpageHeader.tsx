import Link from "next/link";
import { couplesHubPremium } from "@/components/couples/couples-hub-premium";

export function CouplesSubpageHeader({
  title,
  subtitle,
  backHref = "/couples/marriage",
  backLabel = "Our marriage",
}: {
  title: string;
  subtitle?: string;
  backHref?: string;
  backLabel?: string;
}) {
  return (
    <header className="mb-5">
      <Link href={backHref} className={couplesHubPremium.backLink}>
        <span aria-hidden>←</span> {backLabel}
      </Link>
      <h1 className={`${couplesHubPremium.screenTitle} mt-3`}>{title}</h1>
      {subtitle ? <p className={couplesHubPremium.screenSubtitle}>{subtitle}</p> : null}
    </header>
  );
}
