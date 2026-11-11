"use client";

import { useEffect, useState } from "react";
import { ChurchFlyerImage } from "@/components/home/ChurchFlyerImage";
import { site } from "@/lib/site";
import {
  premiumV4HeroMountainImage,
  premiumV4HomeGreeting,
  premiumV4ServiceChip,
} from "@/lib/home-premium-v4";

type PremiumHomeV4HeroProps = {
  firstName?: string | null;
  campusLabel?: string;
};

export function PremiumHomeV4Hero({ firstName, campusLabel }: PremiumHomeV4HeroProps) {
  const [greeting, setGreeting] = useState<string | null>(null);

  useEffect(() => {
    setGreeting(premiumV4HomeGreeting(firstName));
  }, [firstName]);

  return (
    <section className="ph4-hero" aria-label="Welcome">
      <div className="ph4-hero__media">
        <ChurchFlyerImage
          src={premiumV4HeroMountainImage}
          alt=""
          priority
          sizes="100vw"
          className="ph4-hero__image"
        />
        <div className="ph4-hero__glow ph4-hero__glow--violet" aria-hidden />
        <div className="ph4-hero__glow ph4-hero__glow--gold" aria-hidden />
        <div className="ph4-hero__scrim" aria-hidden />
      </div>
      <div className="ph4-hero__content">
        {greeting ? <p className="ph4-hero__greeting">{greeting}</p> : null}
        <p className="ph4-hero__welcome">Welcome to</p>
        <h1 className="ph4-hero__title">Shanah City</h1>
        <p className="ph4-hero__tagline">{site.tagline}</p>
        <p className="ph4-hero__service">{premiumV4ServiceChip(campusLabel)}</p>
      </div>
    </section>
  );
}
