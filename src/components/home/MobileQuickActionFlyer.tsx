import Image from "next/image";

type QuickActionFlyerName = "give" | "connect" | "community" | "devotions";

const flyerArt: Record<
  QuickActionFlyerName,
  { src: string; alt: string; label: string }
> = {
  give: { src: "/mobile-flyers/give.png", alt: "Give", label: "Give" },
  connect: { src: "/mobile-flyers/connect.png", alt: "Connect", label: "Connect" },
  community: { src: "/mobile-flyers/community.png", alt: "Community", label: "Community" },
  devotions: { src: "/mobile-flyers/devotions.png", alt: "Devotions", label: "Devotions" },
};

type MobileQuickActionFlyerProps = {
  name: QuickActionFlyerName;
  className?: string;
};

export function MobileQuickActionFlyer({ name, className = "" }: MobileQuickActionFlyerProps) {
  const art = flyerArt[name];

  return (
    <div className={`relative h-full w-full overflow-hidden ${className}`}>
      <Image
        src={art.src}
        alt={art.alt}
        fill
        sizes="(max-width: 512px) 50vw, 240px"
        className="mobile-media object-cover transition duration-500 group-hover:scale-[1.03]"
        priority={name === "give"}
      />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-night-950/55 via-transparent to-night-950/10" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 p-3">
        <p className="font-display text-lg font-bold tracking-tight text-white drop-shadow-md">
          {art.label}
        </p>
      </div>
    </div>
  );
}
