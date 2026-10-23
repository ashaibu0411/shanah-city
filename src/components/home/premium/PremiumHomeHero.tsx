"use client";

import Link from "next/link";
import { HomePastorPortrait } from "@/components/home/HomePastorPortrait";
import {
  homeGreetingEmoji,
  homeHeroHeadline,
  homeHeroSubcopy,
  homeHeroSupportLine,
} from "@/lib/home-premium";
import { site } from "@/lib/site";
import { homeMobileHeroImage } from "@/lib/home-explore-tile-images";
import { ChurchFlyerImage } from "@/components/home/ChurchFlyerImage";

type PremiumHomeHeroProps = {
  variant: "desktop" | "mobile";
  firstName?: string | null;
  campusLabel?: string;
  nextServiceLabel?: string;
};

export function PremiumHomeHero({
  variant,
  firstName = null,
  campusLabel,
  nextServiceLabel,
}: PremiumHomeHeroProps) {
  const headline = homeHeroHeadline(firstName);
  const sub = homeHeroSubcopy(firstName);
  const emoji = firstName ? homeGreetingEmoji() : "";
  const support =
    variant === "desktop"
      ? `${sub} A Jesus-centered community for real people, real life, and a greater purpose.`
      : sub;

  if (variant === "mobile") {
    return (
      <section className="premium-hero premium-hero--mobile" aria-label="Welcome">
        <div className="premium-hero__media">
          <ChurchFlyerImage
            src={homeMobileHeroImage}
            alt=""
            priority
            sizes="100vw"
            className="h-full w-full object-cover object-[center_40%]"
          />
          <div className="premium-hero__scrim premium-hero__scrim--mobile" aria-hidden />
        </div>
        <div className="premium-hero__content premium-hero__content--mobile">
          <p className="premium-hero__greeting">
            {headline}
            {emoji ? ` ${emoji}` : ""}
          </p>
          <p className="premium-hero__sub">{sub}</p>
          <p className="premium-hero__meta">{site.welcome}</p>
          {campusLabel && nextServiceLabel ? (
            <p className="premium-hero__chip">
              Sun {nextServiceLabel} · {campusLabel}
            </p>
          ) : null}
          <div className="premium-hero__actions premium-hero__actions--mobile">
            <Link href="/live" className="premium-btn premium-btn--primary">
              <span className="premium-btn__play" aria-hidden>
                ▶
              </span>
              Watch Live
            </Link>
            <Link href={site.visitCTA.href} className="premium-btn premium-btn--ghost">
              Plan Your Visit
            </Link>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="premium-hero premium-hero--desktop" aria-label="Welcome">
      <HomePastorPortrait variant="desktop" layout="cinema" className="premium-hero__cinema" />
      <div className="premium-hero__scrim premium-hero__scrim--desktop" aria-hidden />
      <div className="premium-hero__content premium-hero__content--desktop">
        <div className="premium-hero__copy">
          <h1 className="premium-hero__title">
            {headline}
            {emoji ? ` ${emoji}` : ""}
          </h1>
          <p className="premium-hero__sub">{support}</p>
          <p className="premium-hero__verse">{site.welcome}</p>
          <div className="premium-hero__actions">
            <Link href="/live" className="premium-btn premium-btn--primary">
              <span className="premium-btn__play" aria-hidden>
                ▶
              </span>
              Watch Live
            </Link>
            <Link href={site.visitCTA.href} className="premium-btn premium-btn--link">
              Plan Your Visit →
            </Link>
          </div>
        </div>
        <aside className="premium-hero__aside hidden xl:block">
          <p className="premium-hero__aside-verse">{homeHeroSupportLine()}</p>
        </aside>
      </div>
    </section>
  );
}
