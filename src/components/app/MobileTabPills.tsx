"use client";

import { premiumTeal } from "@/components/app/mobile-premium";

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
};

export function MobileTabPills({
  tabs,
  activeId,
  onChange,
  className = "",
}: MobileTabPillsProps) {
  return (
    <div className={`mobile-tab-pill-bar flex flex-wrap gap-2 ${className}`}>
      {tabs.map((tab) => {
        const active = activeId === tab.id;
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onChange(tab.id)}
            className={`rounded-full px-4 py-1.5 text-sm font-semibold transition active:scale-[0.98] ${
              active ? premiumTeal.tabActive : premiumTeal.tabIdle
            }`}
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
