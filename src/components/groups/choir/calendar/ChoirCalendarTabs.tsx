export type ChoirCalendarTabId = "calendar" | "my" | "team" | "list" | "rehearsals";

type ChoirCalendarTabsProps = {
  active: ChoirCalendarTabId;
  onChange: (tab: ChoirCalendarTabId) => void;
};

const TABS: { id: ChoirCalendarTabId; label: string }[] = [
  { id: "calendar", label: "Calendar" },
  { id: "rehearsals", label: "Rehearsals" },
  { id: "my", label: "My Schedule" },
  { id: "team", label: "Team Schedule" },
  { id: "list", label: "List View" },
];

export function ChoirCalendarTabs({ active, onChange }: ChoirCalendarTabsProps) {
  return (
    <div className="choir-calendar-tabs" role="tablist" aria-label="Worship calendar views">
      {TABS.map((tab) => {
        const isActive = tab.id === active;
        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={isActive}
            className={`choir-calendar-tab ${isActive ? "choir-calendar-tab-active" : ""}`}
            onClick={() => onChange(tab.id)}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
