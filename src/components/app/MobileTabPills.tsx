"use client";

import { editorialPremium } from "@/components/app/editorial-premium";

export type MobileTabPill = {
  id: string;
  label: string;
  badge?: number;
};

type MobileTabPillsProps = {
  tabs: MobileTabPill[];
  activeId: string;
  onChange: (id: string) => void;
  className?: string;
  /** Cinematic media hub: pill look is driven by premium V4 CSS, not editorial Tailwind tokens. */
  variant?: "default" | "cinematic";
};

export function MobileTabPills({
  tabs,
  activeId,
  onChange,
  className = "",
  variant = "default",
}: MobileTabPillsProps) {
  return (
    <div
      className={`mobile-tab-pills mobile-tab-pill-bar flex flex-wrap gap-2 ${className}`}
      role="tablist"
    >
      {tabs.map((tab) => {
        const active = activeId === tab.id;
        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(tab.id)}
            className={
              variant === "cinematic"
                ? "mobile-tab-pill-cinematic rounded-full px-4 py-1.5 text-sm font-semibold transition active:scale-[0.98]"
                : active
                  ? editorialPremium.tabActive
                  : editorialPremium.tabIdle
            }
          >
            {tab.label}
            {tab.badge && tab.badge > 0 ? (
              <span className="ml-2 inline-flex min-w-[1.25rem] items-center justify-center rounded-full bg-amber-400 px-1.5 py-0.5 text-[10px] font-bold text-night-950">
                {tab.badge}
              </span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}
