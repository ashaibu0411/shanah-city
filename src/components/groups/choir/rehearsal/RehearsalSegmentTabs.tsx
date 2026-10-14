export type RehearsalTabId = "room" | "record" | "library" | "audio" | "parts" | "notes";

type RehearsalSegmentTabsProps = {
  active: RehearsalTabId;
  onChange: (tab: RehearsalTabId) => void;
};

const TABS: { id: RehearsalTabId; label: string }[] = [
  { id: "room", label: "Practice" },
  { id: "record", label: "Record" },
  { id: "library", label: "Library" },
  { id: "audio", label: "Audio" },
  { id: "parts", label: "Parts" },
  { id: "notes", label: "Notes" },
];

export function RehearsalSegmentTabs({ active, onChange }: RehearsalSegmentTabsProps) {
  return (
    <div className="choir-rehearsal-tabs" role="tablist" aria-label="Rehearsal views">
      {TABS.map((tab) => {
        const isActive = tab.id === active;
        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={isActive}
            className={`choir-rehearsal-tab ${isActive ? "choir-rehearsal-tab-active" : ""}`}
            onClick={() => onChange(tab.id)}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
