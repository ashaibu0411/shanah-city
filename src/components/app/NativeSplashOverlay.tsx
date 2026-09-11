"use client";

import Image from "next/image";
import { brandLogos, site } from "@/lib/site";

type NativeSplashPhase = "enter" | "exit" | "hidden";

type NativeSplashOverlayProps = {
  phase: NativeSplashPhase;
};

export function NativeSplashOverlay({ phase }: NativeSplashOverlayProps) {
  if (phase === "hidden") return null;

  return (
    <div
      className={`native-splash-overlay${phase === "exit" ? " native-splash-overlay--exit" : ""}`}
      aria-hidden="true"
    >
      <div
        className={`native-splash-logo${phase === "enter" ? " native-splash-logo--animate" : ""}`}
      >
        <Image
          src={brandLogos.light}
          alt={site.name}
          width={280}
          height={112}
          priority
          className="native-splash-logo__image"
        />
      </div>
    </div>
  );
}
