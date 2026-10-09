"use client";

import Link from "next/link";
import { couplesHubPremium } from "@/components/couples/couples-hub-premium";

export function CouplesLinkGate({
  pendingIncoming,
  tone = "sheet",
}: {
  pendingIncoming?: boolean;
  tone?: "sheet" | "dark";
}) {
  const cardClass = tone === "sheet" ? couplesHubPremium.sheetStatusInfo : couplesHubPremium.gateCard;
  const ctaClass = tone === "sheet" ? couplesHubPremium.sheetPrimaryCta : couplesHubPremium.primaryCta;
  return (
    <div className={cardClass}>
      <p
        className={`font-display text-base font-semibold ${
          tone === "sheet" ? "text-stone-900" : "text-night-950 dark:text-sand-100"
        }`}
      >
        {pendingIncoming ? "Accept your spouse’s invite" : "Link your spouse to unlock"}
      </p>
      <p className="mt-2">
        {pendingIncoming
          ? "Open your profile to accept the link request. Your private calendar, notes, and check-ins stay between the two of you."
          : "Each of you keeps your own login. Only linked spouses can see your shared marriage workspace — church admins cannot browse private marriage data."}
      </p>
      <Link href="/profile#spouse-account" className={`${ctaClass} mt-4`}>
        {pendingIncoming ? "Review invite on profile" : "Link spouse account"}
      </Link>
    </div>
  );
}
