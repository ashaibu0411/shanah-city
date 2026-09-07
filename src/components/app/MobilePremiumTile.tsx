import Link from "next/link";
import { ChurchFlyerImage } from "@/components/home/ChurchFlyerImage";
import {
  mobilePremiumActions,
  mobilePremiumExploreActions,
  type MobilePremiumActionId,
} from "@/components/app/mobile-premium";

function PremiumActionIcon({ name }: { name: MobilePremiumActionId }) {
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
    case "calendar":
      return (
        <svg {...shared}>
          <rect x="3" y="4" width="18" height="18" rx="2" />
          <path d="M16 2v4M8 2v4M3 10h18" />
        </svg>
      );
  }
}

type MobilePremiumTileProps = {
  action: MobilePremiumActionId;
  href: string;
  imageSrc: string;
  priority?: boolean;
  compact?: boolean;
};

export function MobilePremiumTile({
  action,
  href,
  imageSrc,
  priority = false,
  compact = false,
}: MobilePremiumTileProps) {
  const meta = mobilePremiumActions[action];

  return (
    <Link
      href={href}
      aria-label={meta.label}
      className={`mobile-premium-4k group relative block overflow-hidden transition active:scale-[0.985] ${
        compact ? "mobile-premium-4k-compact" : "mobile-premium-4k-flyer"
      }`}
    >
      <div className="mobile-premium-4k__bezel pointer-events-none absolute inset-0 z-30" aria-hidden />
      <div className="mobile-premium-4k__shine pointer-events-none absolute inset-0 z-20" aria-hidden />
      <div className="mobile-premium-4k__grain pointer-events-none absolute inset-0 z-20" aria-hidden />

      <div className="absolute inset-0">
        <ChurchFlyerImage
          src={imageSrc}
          alt=""
          priority={priority}
          sizes={compact ? "120px" : "(max-width: 512px) 50vw, 240px"}
          className="mobile-premium-4k__media mobile-media object-cover"
        />
      </div>

      <div
        className={`pointer-events-none absolute inset-0 z-10 bg-gradient-to-t ${meta.overlay}`}
        aria-hidden
      />
      <div
        className={`pointer-events-none absolute inset-x-0 top-0 z-10 h-1/2 bg-gradient-to-b ${meta.accent}`}
        aria-hidden
      />

      <div className="mobile-premium-4k__glass-bar relative z-20 flex items-center gap-2.5">
        <span
          className={`mobile-premium-4k__icon inline-flex shrink-0 items-center justify-center rounded-xl ring-1 backdrop-blur-md ${meta.iconTone}`}
        >
          <PremiumActionIcon name={action} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate font-display text-[13px] font-bold leading-tight tracking-tight text-white drop-shadow-sm">
            {meta.label}
          </p>
          <p className="truncate text-[10px] font-semibold uppercase tracking-[0.14em] text-white/75">
            {meta.detail}
          </p>
        </div>
      </div>
    </Link>
  );
}

type MobilePremiumExploreGridProps = {
  imageForAction: (action: MobilePremiumActionId) => string;
  className?: string;
  compact?: boolean;
};

export function MobilePremiumExploreGrid({
  imageForAction,
  className = "",
  compact = false,
}: MobilePremiumExploreGridProps) {
  return (
    <div className={`grid grid-cols-2 gap-2.5 ${className}`}>
      {mobilePremiumExploreActions.map((item, index) => (
        <MobilePremiumTile
          key={item.id}
          action={item.id}
          href={item.href}
          imageSrc={imageForAction(item.id)}
          priority={index === 0}
          compact={compact}
        />
      ))}
    </div>
  );
}
