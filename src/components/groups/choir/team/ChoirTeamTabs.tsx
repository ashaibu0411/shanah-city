export type ChoirTeamTabId = "assignments" | "members" | "roles" | "availability";

type ChoirTeamTabsProps = {
  active: ChoirTeamTabId;
  onChange: (tab: ChoirTeamTabId) => void;
};

const TABS: { id: ChoirTeamTabId; label: string }[] = [
  { id: "assignments", label: "My Assignments" },
  { id: "members", label: "Team Members" },
  { id: "roles", label: "Roles & Sections" },
  { id: "availability", label: "Availability" },
];

export function ChoirTeamTabs({ active, onChange }: ChoirTeamTabsProps) {
  return (
    <div className="choir-team-tabs" role="tablist" aria-label="Worship team views">
      {TABS.map((tab) => {
        const isActive = tab.id === active;
        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={isActive}
            className={`choir-team-tab ${isActive ? "choir-team-tab-active" : ""}`}
            onClick={() => onChange(tab.id)}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
