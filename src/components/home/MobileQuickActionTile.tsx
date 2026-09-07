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
    cardClass:
      "from-teal-50/95 via-cyan-50/90 to-teal-100/75 ring-teal-200/55 shadow-teal-900/[0.06]",
    iconClass: "bg-teal-600/12 text-teal-700 ring-teal-300/40 backdrop-blur-sm",
    veilClass: "from-teal-50/88 via-cyan-50/55 to-teal-100/35",
  },
  connect: {
    label: "Connect",
    detail: "Plan a visit",
    cardClass:
      "from-violet-50/95 via-fuchsia-50/45 to-violet-100/70 ring-violet-200/50 shadow-violet-900/[0.06]",
    iconClass: "bg-violet-600/10 text-violet-700 ring-violet-300/35 backdrop-blur-sm",
    veilClass: "from-violet-50/88 via-fuchsia-50/50 to-violet-100/30",
  },
  community: {
    label: "Community",
    detail: "See what's new",
    cardClass:
      "from-sky-50/95 via-cyan-50/85 to-blue-100/65 ring-sky-200/55 shadow-blue-900/[0.06]",
    iconClass: "bg-sky-600/10 text-sky-700 ring-sky-300/40 backdrop-blur-sm",
    veilClass: "from-sky-50/88 via-cyan-50/50 to-blue-100/32",
  },
  devotions: {
    label: "Devotions",
    detail: "Daily word",
    cardClass:
      "from-amber-50/95 via-orange-50/35 to-amber-100/70 ring-amber-200/50 shadow-amber-900/[0.06]",
    iconClass: "bg-amber-600/10 text-amber-800 ring-amber-300/40 backdrop-blur-sm",
    veilClass: "from-amber-50/88 via-orange-50/45 to-amber-100/30",
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
  imageSrc: string;
};

export function MobileQuickActionTile({ name, href, imageSrc }: MobileQuickActionTileProps) {
  const meta = actionMeta[name];

  return (
    <Link
      href={href}
      aria-label={meta.label}
      className={`mobile-explore-tile group relative block overflow-hidden bg-gradient-to-br p-3 ring-1 transition active:scale-[0.98] ${meta.cardClass}`}
    >
      <div
        className="pointer-events-none absolute -right-3 -top-1 h-[72%] w-[58%] opacity-[0.2] saturate-[0.85] relative"
        aria-hidden
      >
        <ChurchFlyerImage
          src={imageSrc}
          alt=""
          priority={name === "give"}
          sizes="120px"
          className="mobile-media scale-110 object-cover object-center transition duration-500 group-active:scale-[1.06]"
        />
      </div>

      <div
        className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${meta.veilClass}`}
        aria-hidden
      />

      <div className="relative z-10">
        <span
          className={`mobile-explore-tile-icon inline-flex h-9 w-9 items-center justify-center rounded-2xl ring-1 ${meta.iconClass}`}
        >
          <QuickActionIcon name={name} />
        </span>
        <p className="mt-2.5 text-[13px] font-bold leading-tight tracking-tight text-night-900">
          {meta.label}
        </p>
        <p className="mt-0.5 text-[10px] font-medium leading-snug text-night-600/75">
          {meta.detail}
        </p>
      </div>
    </Link>
  );
}
