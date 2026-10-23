import Link from "next/link";
import { ChurchFlyerImage } from "@/components/home/ChurchFlyerImage";
import { premiumStayConnectedImage } from "@/lib/home-premium";

export function PremiumStayConnected() {
  return (
    <section className="premium-stay-connected" aria-label="Stay connected">
      <Link href="/groups" className="premium-stay-connected__link">
        <ChurchFlyerImage
          src={premiumStayConnectedImage}
          alt=""
          sizes="(max-width: 768px) 100vw, 960px"
          className="premium-stay-connected__image"
        />
        <div className="premium-stay-connected__scrim" aria-hidden />
        <div className="premium-stay-connected__content">
          <p className="premium-stay-connected__eyebrow">Stay Connected</p>
          <p className="premium-stay-connected__title">
            Grow in faith and build meaningful relationships.
          </p>
          <span className="premium-btn premium-btn--secondary premium-btn--sm">Explore Groups →</span>
        </div>
      </Link>
    </section>
  );
}
