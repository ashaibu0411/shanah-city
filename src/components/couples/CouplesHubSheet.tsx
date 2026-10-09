import { couplesHubPremium } from "@/components/couples/couples-hub-premium";

export function CouplesHubSheet({
  children,
  overlap = false,
  className = "",
}: {
  children: React.ReactNode;
  overlap?: boolean;
  className?: string;
}) {
  return (
    <div
      className={`${couplesHubPremium.contentSheet} ${overlap ? couplesHubPremium.contentSheetOverlap : ""} ${className}`}
    >
      {children}
    </div>
  );
}
