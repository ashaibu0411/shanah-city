import type { PremiumQuickActionId } from "@/lib/home-premium";

type IconProps = { className?: string };

const shared = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.75,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

export function PremiumQuickActionIcon({
  id,
  className = "h-5 w-5",
}: {
  id: PremiumQuickActionId;
  className?: string;
}) {
  const props = { ...shared, className, "aria-hidden": true as const };

  switch (id) {
    case "live":
      return (
        <svg {...props}>
          <rect x="3" y="5" width="18" height="14" rx="2.5" />
          <path d="m10 10 6 4-6 4v-8Z" fill="currentColor" stroke="none" />
        </svg>
      );
    case "sermons":
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
    case "groups":
      return (
        <svg {...props}>
          <path d="M16 11c1.66 0 3-1.34 3-3S17.66 5 16 5s-3 1.34-3 3 1.34 3 3 3Z" />
          <path d="M8 11c1.66 0 3-1.34 3-3S9.66 5 8 5 5 6.34 5 8s1.34 3 3 3Z" />
          <path d="M8 13c-2.67 0-8 1.34-8 4v2h8" />
          <path d="M16 13c-.34 0-.67.02-1 .06 1.17.84 2 2.05 2 3.44V19h6v-2c0-2.66-5.33-4-8-4Z" />
        </svg>
      );
    case "give":
      return (
        <svg {...props}>
          <path d="M12 21s-7-4.5-7-10a4 4 0 0 1 7-2 4 4 0 0 1 7 2c0 5.5-7 10-7 10Z" />
        </svg>
      );
    case "check-in":
      return (
        <svg {...props}>
          <path d="M9 11 12 14 22 4" />
          <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
        </svg>
      );
    case "prayer":
      return (
        <svg {...props}>
          <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
          <path d="M19 10v1a7 7 0 0 1-14 0v-1M12 18v4M8 22h8" />
        </svg>
      );
    case "meetings":
      return (
        <svg {...props}>
          <circle cx="5" cy="12" r="1.5" fill="currentColor" stroke="none" />
          <circle cx="12" cy="12" r="1.5" fill="currentColor" stroke="none" />
          <circle cx="19" cy="12" r="1.5" fill="currentColor" stroke="none" />
        </svg>
      );
    case "marriage":
      return (
        <svg {...props}>
          <path d="M8 12a4 4 0 0 1 8 0" />
          <circle cx="9" cy="9" r="2.5" />
          <circle cx="15" cy="9" r="2.5" />
          <path d="M7 20h10" />
        </svg>
      );
  }
}

export function AppNavIconGlyph({ href, className = "h-[18px] w-[18px]" }: { href: string; className?: string }) {
  const map: Record<string, PremiumQuickActionId | "home" | "devotions" | "community" | "messages" | "photos" | "shop" | "campuses" | "profile" | "couples" | "admin"> = {
    "/": "home",
    "/live": "live",
    "/devotions": "devotions",
    "/meetings": "meetings",
    "/community": "community",
    "/groups": "groups",
    "/messages": "messages",
    "/calendar": "events",
    "/check-in": "check-in",
    "/photos": "photos",
    "/shop": "shop",
    "/campuses": "campuses",
    "/give": "give",
    "/profile": "profile",
    "/marriage": "marriage",
    "/groups/group-shanah-power-couples": "groups",
  };

  const key = map[href];
  const props = { ...shared, className, "aria-hidden": true as const };

  if (key === "home") {
    return (
      <svg {...props}>
        <path d="M4 10.5 12 4l8 6.5V19a1 1 0 0 1-1 1h-5v-6H10v6H5a1 1 0 0 1-1-1v-8.5Z" />
      </svg>
    );
  }
  if (key === "devotions") {
    return (
      <svg {...props}>
        <path d="M12 3v18M8 7h8M8 17h8" />
        <path d="M5 3h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z" />
      </svg>
    );
  }
  if (key === "messages") {
    return (
      <svg {...props}>
        <path d="M21 12a8 8 0 0 1-8 8H7l-4 3V12a8 8 0 0 1 16 0Z" />
      </svg>
    );
  }
  if (key === "photos") {
    return (
      <svg {...props}>
        <rect x="3" y="5" width="18" height="14" rx="2" />
        <circle cx="9" cy="10" r="2" />
        <path d="m21 17-5-5-4 4-2-2-5 5" />
      </svg>
    );
  }
  if (key === "shop") {
    return (
      <svg {...props}>
        <path d="M6 6h15l-1.5 9h-12L6 6Z" />
        <path d="M6 6 5 3H2" />
        <circle cx="9" cy="20" r="1" />
        <circle cx="18" cy="20" r="1" />
      </svg>
    );
  }
  if (key === "campuses") {
    return (
      <svg {...props}>
        <circle cx="12" cy="10" r="3" />
        <path d="M12 2a8 8 0 0 0-8 8c0 5 8 12 8 12s8-7 8-12a8 8 0 0 0-8-8Z" />
      </svg>
    );
  }
  if (key === "profile") {
    return (
      <svg {...props}>
        <circle cx="12" cy="8" r="3.5" />
        <path d="M5 20a7 7 0 0 1 14 0" />
      </svg>
    );
  }
  if (key === "community") {
    return (
      <svg {...props}>
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    );
  }
  if (
    key === "live" ||
    key === "sermons" ||
    key === "events" ||
    key === "groups" ||
    key === "give" ||
    key === "check-in" ||
    key === "prayer" ||
    key === "meetings" ||
    key === "marriage"
  ) {
    return <PremiumQuickActionIcon id={key} className={className} />;
  }

  return (
    <svg {...props}>
      <circle cx="12" cy="12" r="8" />
    </svg>
  );
}

export function ChevronRightIcon({ className = "h-4 w-4" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className} aria-hidden>
      <path d="m9 6 6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
