"use client";

import { CouplesHubSheet } from "@/components/couples/CouplesHubSheet";
import { CouplesHubTitleBar } from "@/components/couples/CouplesHubTitleBar";
import { couplesHubPremium } from "@/components/couples/couples-hub-premium";

export function CouplesHubScreen({
  title,
  backHref,
  backLabel,
  hero,
  headerExtra,
  children,
  fab,
  sheetOverlap = false,
  sheetClassName = "",
}: {
  title: string;
  backHref?: string;
  backLabel?: string;
  /** Full-width hero above the cream sheet (date night, devotionals). */
  hero?: React.ReactNode;
  /** Tabs or controls rendered on the dark band above the sheet. */
  headerExtra?: React.ReactNode;
  children: React.ReactNode;
  fab?: { label: string; onClick: () => void };
  sheetOverlap?: boolean;
  sheetClassName?: string;
}) {
  return (
    <div className={couplesHubPremium.page}>
      <div className="mx-auto w-full max-w-lg">
        <CouplesHubTitleBar title={title} backHref={backHref} backLabel={backLabel} />
        {headerExtra ? <div className="px-4 pb-3">{headerExtra}</div> : null}
        {hero}
        <CouplesHubSheet overlap={sheetOverlap || Boolean(hero)} className={sheetClassName}>
          {children}
        </CouplesHubSheet>
      </div>
      {fab ? (
        <button
          type="button"
          aria-label={fab.label}
          className={couplesHubPremium.sheetFab}
          onClick={fab.onClick}
        >
          +
        </button>
      ) : null}
    </div>
  );
}
