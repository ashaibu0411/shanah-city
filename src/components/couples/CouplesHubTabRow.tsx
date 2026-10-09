import { couplesHubPremium } from "@/components/couples/couples-hub-premium";

export function CouplesHubTabRow<T extends string>({
  tabs,
  active,
  onChange,
}: {
  tabs: { id: T; label: string }[];
  active: T;
  onChange: (id: T) => void;
}) {
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
