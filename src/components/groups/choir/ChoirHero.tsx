import { CHOIR_BRAND_TAGLINE, CHOIR_HERO_IMAGE_PATH } from "@/lib/choir-group-constants";

export function ChoirHero() {
  return (
    <section className="choir-hero" aria-label="Shanah Worship">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={CHOIR_HERO_IMAGE_PATH} alt="" />
      <div className="choir-hero-overlay" />
      <div className="choir-hero-copy">
        <p className="choir-hero-title">Shanah Worship</p>
        <p className="choir-hero-tagline">{CHOIR_BRAND_TAGLINE}</p>
      </div>
    </section>
  );
}
