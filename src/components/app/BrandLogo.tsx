"use client";

import Image from "next/image";
import { useTheme } from "@/components/app/ThemeProvider";
import { brandLogos, site } from "@/lib/site";

type BrandLogoProps = {
  size?: "sm" | "md" | "lg";
  /** light = cream headers; dark = navy hero areas; auto = follows app theme */
  variant?: "light" | "dark" | "auto";
  className?: string;
  priority?: boolean;
};

const sizes = {
  sm: {
    image: "h-7 w-auto",
    width: 96,
    height: 40,
  },
  md: {
    image: "h-8 w-auto",
    width: 120,
    height: 48,
  },
  lg: {
    image: "h-12 w-auto sm:h-14",
    width: 140,
    height: 56,
  },
} as const;

export function BrandLogo({
  size = "md",
  variant = "auto",
  className = "",
  priority,
}: BrandLogoProps) {
  const { isDark } = useTheme();
  const config = sizes[size];
  const resolvedVariant =
    variant === "auto" ? (isDark ? "dark" : "light") : variant;
  const src = resolvedVariant === "dark" ? brandLogos.dark : brandLogos.light;

  return (
    <span className={`inline-flex w-fit shrink-0 items-center justify-center leading-none ${className}`}>
      <Image
        src={src}
        alt={site.name}
        width={config.width}
        height={config.height}
        className={`block object-contain ${config.image}`}
        priority={priority}
      />
    </span>
  );
}
