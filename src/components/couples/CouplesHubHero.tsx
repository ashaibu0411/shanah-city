import Image from "next/image";
import { couplesHubPremium, COUPLES_HUB_HERO_IMAGE } from "@/components/couples/couples-hub-premium";

export function CouplesHubHero({
  imageSrc = COUPLES_HUB_HERO_IMAGE,
  eyebrow,
  title,
  tagline,
  children,
  flush = false,
}: {
  imageSrc?: string;
  eyebrow?: string;
  title: string;
  tagline?: string;
  children?: React.ReactNode;
  /** Edge-to-edge hero above overlapping cream sheet */
  flush?: boolean;
}) {
  return (
    <div className={flush ? "relative overflow-hidden" : couplesHubPremium.heroWrap}>
      <div className="relative aspect-[4/3] w-full sm:aspect-[16/10]">
        <Image
          src={imageSrc}
          alt=""
          fill
          priority
          className={couplesHubPremium.heroImage}
          sizes="(max-width: 512px) 100vw, 512px"
        />
        <div className={couplesHubPremium.heroOverlay} aria-hidden />
        <div className={couplesHubPremium.heroContent}>
          {eyebrow ? <p className={couplesHubPremium.heroEyebrow}>{eyebrow}</p> : null}
          <h2 className={couplesHubPremium.heroTitle}>{title}</h2>
          {tagline ? <p className={couplesHubPremium.heroTagline}>{tagline}</p> : null}
          {children}
        </div>
      </div>
    </div>
  );
}
