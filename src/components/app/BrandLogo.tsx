import Image from "next/image";
import { site } from "@/lib/site";

type BrandLogoProps = {
  size?: "sm" | "md" | "lg";
  className?: string;
  priority?: boolean;
};

const sizes = {
  sm: {
    frame: "rounded-lg p-1",
    image: "h-7 w-auto",
    width: 96,
    height: 40,
  },
  md: {
    frame: "rounded-xl p-1",
    image: "h-8 w-auto",
    width: 120,
    height: 48,
  },
  lg: {
    frame: "h-16 w-16 rounded-2xl p-1.5 shadow-lg",
    image: "h-full w-full",
    width: 72,
    height: 72,
  },
} as const;

export function BrandLogo({
  size = "md",
  className = "",
  priority,
}: BrandLogoProps) {
  const config = sizes[size];

  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center bg-white/95 shadow-md ring-1 ring-night-900/5 ${config.frame} ${className}`}
    >
      <Image
        src="/shanah-city-logo.png"
        alt={site.name}
        width={config.width}
        height={config.height}
        className={`object-contain ${config.image}`}
        priority={priority}
      />
    </span>
  );
}
