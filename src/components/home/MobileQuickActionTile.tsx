import Link from "next/link";

type QuickActionName = "give" | "connect" | "community" | "devotions";

const actionMeta: Record<
  QuickActionName,
  { label: string; detail: string; cardClass: string; iconClass: string }
> = {
  give: {
    label: "Give",
    detail: "Support ministry",
    cardClass:
      "from-teal-50 via-cyan-50/95 to-teal-100/80 ring-teal-200/55 shadow-teal-900/[0.06]",
    iconClass: "bg-teal-600/12 text-teal-700 ring-teal-300/40",
  },
  connect: {
    label: "Connect",
    detail: "Plan a visit",
    cardClass:
      "from-violet-50 via-fuchsia-50/40 to-violet-100/75 ring-violet-200/50 shadow-violet-900/[0.06]",
    iconClass: "bg-violet-600/10 text-violet-700 ring-violet-300/35",
  },
  community: {
    label: "Community",
    detail: "See what's new",
    cardClass:
      "from-sky-50 via-cyan-50/90 to-blue-100/70 ring-sky-200/55 shadow-blue-900/[0.06]",
    iconClass: "bg-sky-600/10 text-sky-700 ring-sky-300/40",
  },
  devotions: {
    label: "Devotions",
    detail: "Daily word",
    cardClass:
      "from-amber-50 via-orange-50/30 to-amber-100/75 ring-amber-200/50 shadow-amber-900/[0.06]",
    iconClass: "bg-amber-600/10 text-amber-800 ring-amber-300/40",
  },
};

function QuickActionIcon({ name }: { name: QuickActionName }) {
  const shared = {
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 2,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    className: "h-[18px] w-[18px]",
    "aria-hidden": true,
  };

  switch (name) {
    case "give":
      return (
        <svg {...shared}>
          <path d="M12 21s-7-4.5-7-10a4 4 0 0 1 7-2 4 4 0 0 1 7 2c0 5.5-7 10-7 10Z" />
        </svg>
      );
    case "connect":
      return (
        <svg {...shared}>
          <path d="M16 11c1.66 0 3-1.34 3-3S17.66 5 16 5s-3 1.34-3 3 1.34 3 3 3Z" />
          <path d="M8 11c1.66 0 3-1.34 3-3S9.66 5 8 5 5 6.34 5 8s1.34 3 3 3Z" />
          <path d="M8 13c-2.67 0-8 1.34-8 4v2h8" />
          <path d="M16 13c-.34 0-.67.02-1 .06 1.17.84 2 2.05 2 3.44V19h6v-2c0-2.66-5.33-4-8-4Z" />
        </svg>
      );
    case "community":
      return (
        <svg {...shared}>
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
      );
    case "devotions":
      return (
        <svg {...shared}>
          <path d="M12 3l1.5 4.5L18 9l-4.5 1.5L12 15l-1.5-4.5L6 9l4.5-1.5L12 3Z" />
        </svg>
      );
  }
}

type MobileQuickActionTileProps = {
  name: QuickActionName;
  href: string;
};

export function MobileQuickActionTile({ name, href }: MobileQuickActionTileProps) {
  const meta = actionMeta[name];

  return (
    <Link
      href={href}
      aria-label={meta.label}
      className={`mobile-explore-tile group block bg-gradient-to-br p-3 ring-1 transition active:scale-[0.98] ${meta.cardClass}`}
    >
      <span
        className={`mobile-explore-tile-icon inline-flex h-9 w-9 items-center justify-center rounded-xl ring-1 ${meta.iconClass}`}
      >
        <QuickActionIcon name={name} />
      </span>
      <p className="mt-2.5 text-[13px] font-bold leading-tight tracking-tight text-night-900">
        {meta.label}
      </p>
      <p className="mt-0.5 text-[10px] font-medium leading-snug text-night-600/75">
        {meta.detail}
      </p>
    </Link>
  );
}
