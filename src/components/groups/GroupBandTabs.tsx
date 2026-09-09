"use client";

import { groupsPremium } from "@/components/groups/groups-premium";

export type GroupBandTab = {
  id: string;
  label: string;
};

type GroupBandTabsProps = {
  tabs: GroupBandTab[];
  activeId: string;
  onChange: (id: string) => void;
  className?: string;
};

export function GroupBandTabs({ tabs, activeId, onChange, className = "" }: GroupBandTabsProps) {
  return (
    <div className={`px-4 pb-3 ${className}`} role="tablist">
      <div className={groupsPremium.pillTrack}>
        {tabs.map((tab) => {
          const active = tab.id === activeId;
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => onChange(tab.id)}
              className={`${groupsPremium.pillButton} ${
                active ? groupsPremium.pillActive : groupsPremium.pillIdle
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
