export type SetlistTabId = "current" | "library" | "favorites";

type SetlistSegmentTabsProps = {
  active: SetlistTabId;
  onChange: (tab: SetlistTabId) => void;
};

const TABS: { id: SetlistTabId; label: string }[] = [
  { id: "current", label: "Setlist" },
  { id: "library", label: "Library" },
  { id: "favorites", label: "Favorites" },
];

export function SetlistSegmentTabs({ active, onChange }: SetlistSegmentTabsProps) {
  return (
    <div className="choir-setlist-tabs" role="tablist" aria-label="Setlist views">
      {TABS.map((tab) => {
        const isActive = tab.id === active;
        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={isActive}
            className={`choir-setlist-tab ${isActive ? "choir-setlist-tab-active" : ""}`}
            onClick={() => onChange(tab.id)}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
