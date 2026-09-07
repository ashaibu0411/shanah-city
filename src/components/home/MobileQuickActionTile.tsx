import Link from "next/link";
import { ChurchFlyerImage } from "@/components/home/ChurchFlyerImage";

type QuickActionName = "give" | "connect" | "community" | "devotions";

const actionMeta: Record<
  QuickActionName,
  { label: string; detail: string; cardClass: string; iconClass: string; veilClass: string }
> = {
  give: {
    label: "Give",
    detail: "Support ministry",
    cardClass: "from-teal-200/90 via-teal-100 to-cyan-100 ring-teal-400/45",
    iconClass: "bg-teal-700 text-white ring-teal-600/30 shadow-teal-900/20",
    veilClass: "from-teal-100/35 via-teal-50/20 to-transparent",
  },
  connect: {
    label: "Connect",
    detail: "Plan a visit",
    cardClass: "from-amber-200/85 via-amber-100 to-orange-100 ring-amber-400/40",
    iconClass: "bg-amber-600 text-white ring-amber-500/30 shadow-amber-900/15",
    veilClass: "from-amber-100/35 via-orange-50/15 to-transparent",
  },
  community: {
    label: "Community",
    detail: "See what's new",
    cardClass: "from-cyan-200/80 via-sky-100 to-blue-100 ring-cyan-400/40",
    iconClass: "bg-cyan-700 text-white ring-cyan-600/30 shadow-cyan-900/15",
    veilClass: "from-cyan-100/30 via-sky-50/15 to-transparent",
  },
  devotions: {
    label: "Devotions",
    detail: "Daily word",
    cardClass: "from-sand-300/70 via-amber-100 to-amber-200/80 ring-amber-400/35",
    iconClass: "bg-night-800 text-amber-200 ring-night-700/30 shadow-night-900/20",
    veilClass: "from-amber-100/30 via-sand-100/15 to-transparent",
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
    className: "h-4 w-4",
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
          <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
          <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2Z" />
        </svg>
      );
  }
}

type MobileQuickActionTileProps = {
  name: QuickActionName;
  href: string;
  imageSrc: string;
};

export function MobileQuickActionTile({ name, href, imageSrc }: MobileQuickActionTileProps) {
  const meta = actionMeta[name];

  return (
    <Link
      href={href}
      aria-label={meta.label}
      className={`mobile-explore-tile group relative flex items-center gap-2.5 overflow-hidden bg-gradient-to-br p-2.5 ring-1 shadow-sm transition active:scale-[0.98] ${meta.cardClass}`}
    >
      <div
        className="pointer-events-none absolute -right-1 top-1/2 h-16 w-16 -translate-y-1/2 opacity-[0.28]"
        aria-hidden
      >
        <div className="relative h-full w-full overflow-hidden rounded-full ring-2 ring-white/40">
          <ChurchFlyerImage
            src={imageSrc}
            alt=""
            priority={name === "give"}
            sizes="64px"
            className="mobile-media object-cover"
          />
        </div>
      </div>

      <div
        className={`pointer-events-none absolute inset-0 bg-gradient-to-r ${meta.veilClass}`}
        aria-hidden
      />

      <span
        className={`mobile-explore-tile-icon relative z-10 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-xl shadow-sm ring-1 ${meta.iconClass}`}
      >
        <QuickActionIcon name={name} />
      </span>

      <div className="relative z-10 min-w-0 flex-1">
        <p className="truncate text-[13px] font-bold leading-tight tracking-tight text-night-900">
          {meta.label}
        </p>
        <p className="truncate text-[10px] font-semibold text-night-700/75">{meta.detail}</p>
      </div>
    </Link>
  );
}
