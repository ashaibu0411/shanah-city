import type { PremiumHomeV3TileId } from "@/lib/home-premium-v3";

const stroke = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.75,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

export function PremiumHomeV3TileIcon({
  id,
  className = "h-6 w-6",
}: {
  id: PremiumHomeV3TileId;
  className?: string;
}) {
  const props = { ...stroke, className, viewBox: "0 0 24 24", "aria-hidden": true as const };

  switch (id) {
    case "live":
      return (
        <svg {...props}>
          <rect x="3" y="5" width="18" height="14" rx="2.5" />
          <path d="m10 10 6 4-6 4v-8Z" fill="currentColor" stroke="none" />
        </svg>
      );
    case "devotions":
      return (
        <svg {...props}>
          <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
          <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2Z" />
        </svg>
      );
    case "events":
      return (
        <svg {...props}>
          <rect x="3" y="4" width="18" height="18" rx="2" />
          <path d="M16 2v4M8 2v4M3 10h18" />
        </svg>
      );
    case "connected":
      return (
        <svg {...props}>
          <path d="M16 11c1.66 0 3-1.34 3-3S17.66 5 16 5s-3 1.34-3 3 1.34 3 3 3Z" />
          <path d="M8 11c1.66 0 3-1.34 3-3S9.66 5 8 5 5 6.34 5 8s1.34 3 3 3Z" />
          <path d="M8 13c-2.67 0-8 1.34-8 4v2h8" />
          <path d="M16 13c-.34 0-.67.02-1 .06 1.17.84 2 2.05 2 3.44V19h6v-2c0-2.66-5.33-4-8-4Z" />
        </svg>
      );
    default:
      return null;
  }
}
