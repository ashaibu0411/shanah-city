"use client";

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
    <div className={`border-b border-night-900/10 bg-white ${className}`}>
      <div
        className="flex overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        role="tablist"
      >
        {tabs.map((tab) => {
          const active = tab.id === activeId;
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => onChange(tab.id)}
              className={`shrink-0 border-b-2 px-4 py-3 text-sm font-semibold transition ${
                active
                  ? "border-night-900 text-night-900"
                  : "border-transparent text-night-500 hover:text-night-700"
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
