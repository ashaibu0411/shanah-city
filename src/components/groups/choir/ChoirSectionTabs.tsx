import type { GroupBandTab } from "@/components/groups/GroupBandTabs";

type ChoirSectionTabsProps = {
  tabs: GroupBandTab[];
  activeId: string;
  onChange: (id: string) => void;
};

export function ChoirSectionTabs({ tabs, activeId, onChange }: ChoirSectionTabsProps) {
  return (
    <nav className="choir-section-tabs" aria-label="Group sections">
      {tabs.map((tab) => {
        const active = tab.id === activeId;
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onChange(tab.id)}
            className={active ? "choir-section-tab choir-section-tab-active" : "choir-section-tab"}
            aria-current={active ? "page" : undefined}
          >
            {tab.label}
          </button>
        );
      })}
    </nav>
  );
}
