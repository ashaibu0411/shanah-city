import { ChurchFlyerImage } from "@/components/home/ChurchFlyerImage";

type QuickActionFlyerName = "give" | "connect" | "community" | "devotions";

const flyerMeta: Record<
  QuickActionFlyerName,
  { alt: string; label: string }
> = {
  give: { alt: "Give", label: "Give" },
  connect: { alt: "Connect", label: "Connect" },
  community: { alt: "Community", label: "Community" },
  devotions: { alt: "Devotions", label: "Devotions" },
};

type MobileQuickActionFlyerProps = {
  name: QuickActionFlyerName;
  imageSrc: string;
  className?: string;
  overlayClassName?: string;
};

export function MobileQuickActionFlyer({
  name,
  imageSrc,
  className = "",
  overlayClassName = "from-night-950/75 via-night-950/15 to-night-950/90",
}: MobileQuickActionFlyerProps) {
  const art = flyerMeta[name];

  return (
    <div className={`relative h-full w-full overflow-hidden ${className}`}>
      <ChurchFlyerImage
        src={imageSrc}
        alt={art.alt}
        priority={name === "give"}
        className="mobile-media object-cover transition duration-500 group-hover:scale-[1.03]"
      />
      <div className={`pointer-events-none absolute inset-0 bg-gradient-to-t ${overlayClassName}`} />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 p-3">
        <p className="font-display text-lg font-bold tracking-tight text-white drop-shadow-md">
          {art.label}
        </p>
      </div>
    </div>
  );
}
