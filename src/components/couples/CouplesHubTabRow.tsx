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
  /** dark = pills on hub shell; sheet = cream-sheet segmented control; underline = love-notes style */
  variant?: "dark" | "sheet" | "underline";
}) {
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
