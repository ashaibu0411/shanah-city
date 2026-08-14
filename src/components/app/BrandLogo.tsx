import Image from "next/image";
import { site } from "@/lib/site";

type BrandLogoProps = {
  size?: "sm" | "md" | "lg";
  className?: string;
  priority?: boolean;
};

const sizes = {
  sm: {
    frame: "rounded-md border border-white p-px",
    image: "h-7 w-auto",
    width: 96,
    height: 40,
  },
  md: {
    frame: "rounded-lg border border-white p-0.5",
    image: "h-8 w-auto",
    width: 120,
    height: 48,
  },
  lg: {
    frame: "rounded-xl border-2 border-white p-0.5 shadow-md",
    image: "h-12 w-auto sm:h-14",
    width: 140,
    height: 56,
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
      className={`inline-flex w-fit shrink-0 items-center justify-center leading-none ${config.frame} ${className}`}
    >
      <Image
        src="/shanah-city-logo.png"
        alt={site.name}
        width={config.width}
        height={config.height}
        className={`block object-contain ${config.image}`}
        priority={priority}
      />
    </span>
  );
}
