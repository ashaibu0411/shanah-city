import { couplesHubPremium } from "@/components/couples/couples-hub-premium";

export function CouplesHubTabRow<T extends string>({
  tabs,
  active,
  onChange,
  variant = "dark",
}: {
  tabs: { id: T; label: string }[];
  active: T;
  onChange: (id: T) => void;
  /** dark = pills on hub shell; sheet = cream-sheet segmented control; underline = love-notes style; community = mockup feed tabs */
  variant?: "dark" | "sheet" | "underline" | "community";
}) {
  if (variant === "community") {
    return (
      <div className="couples-community-tabs" role="tablist">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={active === tab.id}
            onClick={() => onChange(tab.id)}
            className={`couples-community-tabs__item ${active === tab.id ? "couples-community-tabs__item--active" : ""}`}
          >
            {tab.label}
          </button>
        ))}
      </div>
    );
  }

  if (variant === "sheet") {
    return (
      <div className={couplesHubPremium.sheetTabTrack}>
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => onChange(tab.id)}
            className={`${couplesHubPremium.sheetTabPill} ${
              active === tab.id ? couplesHubPremium.sheetTabActive : couplesHubPremium.sheetTabIdle
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>
    );
  }

  if (variant === "underline") {
    return (
      <div className={couplesHubPremium.sheetTabUnderlineTrack}>
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => onChange(tab.id)}
            className={`${couplesHubPremium.sheetTabUnderline} ${
              active === tab.id
                ? couplesHubPremium.sheetTabUnderlineActive
                : couplesHubPremium.sheetTabUnderlineIdle
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-wrap gap-2">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          onClick={() => onChange(tab.id)}
          className={`${couplesHubPremium.tabPill} ${
            active === tab.id ? couplesHubPremium.tabPillActive : couplesHubPremium.tabPillIdle
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
