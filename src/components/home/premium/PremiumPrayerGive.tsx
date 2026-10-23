import Link from "next/link";
import { ChurchFlyerImage } from "@/components/home/ChurchFlyerImage";
import { premiumGiveImage, premiumPrayerImage } from "@/lib/home-premium";
import { site } from "@/lib/site";

export function PremiumPrayerGive() {
  return (
    <div className="premium-prayer-give" aria-label="Prayer and giving">
      <Link href="/community" className="premium-feature-card premium-feature-card--prayer">
        <ChurchFlyerImage src={premiumPrayerImage} alt="" sizes="400px" className="premium-feature-card__image" />
        <div className="premium-feature-card__scrim" aria-hidden />
        <div className="premium-feature-card__content">
          <p className="premium-feature-card__title">Prayer Together</p>
          <p className="premium-feature-card__desc">Join morning and evening prayer with the family.</p>
          <span className="premium-feature-card__cta">Request Prayer →</span>
        </div>
      </Link>
      <Link href="/give" className="premium-feature-card premium-feature-card--give">
        <ChurchFlyerImage src={premiumGiveImage} alt="" sizes="400px" className="premium-feature-card__image" />
        <div className="premium-feature-card__scrim" aria-hidden />
        <div className="premium-feature-card__content">
          <p className="premium-feature-card__title">Give Generously</p>
          <p className="premium-feature-card__desc">{siteGivingLine()}</p>
          <span className="premium-feature-card__cta">Give Now →</span>
        </div>
      </Link>
    </div>
  );
}

function siteGivingLine() {
  return site.giving.verse.slice(0, 72) + (site.giving.verse.length > 72 ? "…" : "");
}
