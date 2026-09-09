import { groupsPremium } from "@/components/groups/groups-premium";

export function GroupPremiumSectionLabel({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <p className={`${groupsPremium.sectionLabel} ${className}`}>{children}</p>
  );
}

export function GroupPremiumStackCard({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={`${groupsPremium.stackCard} ${className}`}>{children}</section>
  );
}

export function GroupPremiumLeaderChip({ name }: { name: string }) {
  const initial = name.trim().charAt(0).toUpperCase() || "?";
  return (
    <span className={groupsPremium.leaderChip}>
      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-night-950 text-[10px] font-bold text-white">
        {initial}
      </span>
      {name}
    </span>
  );
}

export function GroupPremiumChevron() {
  return (
    <svg
      viewBox="0 0 20 20"
      className="h-5 w-5 shrink-0 text-night-400"
      aria-hidden
    >
      <path
        fill="currentColor"
        d="M7.21 14.77a.75.75 0 0 1 .02-1.06L10.94 10 7.23 6.29a.75.75 0 1 1 1.06-1.06l4.25 4.25a.75.75 0 0 1 0 1.06l-4.25 4.25a.75.75 0 0 1-1.06-.02Z"
      />
    </svg>
  );
}

export function GroupPremiumSummaryBar({
  totalLabel,
  secondaryLabel,
}: {
  totalLabel: string;
  secondaryLabel?: string;
}) {
  return (
    <div className="mb-3 flex flex-wrap items-center gap-2">
      <span className={groupsPremium.summaryPill}>{totalLabel}</span>
      {secondaryLabel ? (
        <span className={groupsPremium.summaryPillMuted}>{secondaryLabel}</span>
      ) : null}
    </div>
  );
}
