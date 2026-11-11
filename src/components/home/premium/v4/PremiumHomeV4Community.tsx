import Link from "next/link";
import { ChurchFlyerImage } from "@/components/home/ChurchFlyerImage";
import { premiumStayConnectedImage } from "@/lib/home-premium";
import { PremiumHomeV4Chevron } from "@/components/home/premium/v4/PremiumHomeV4Icons";

export function PremiumHomeV4Community() {
  return (
    <section className="ph4-section" aria-label="Community">
      <Link href="/community" className="ph4-community">
        <ChurchFlyerImage
          src={premiumStayConnectedImage}
          alt=""
          sizes="100vw"
          className="ph4-community__image"
        />
        <div className="ph4-community__scrim" aria-hidden />
        <div className="ph4-community__content">
          <h2 className="ph4-community__title">Community</h2>
          <p className="ph4-community__lead">Grow in faith and build meaningful relationships.</p>
          <p className="ph4-community__sub">
            Join a group and stay connected with the Shanah City family.
          </p>
        </div>
        <span className="ph4-community__arrow">
          <PremiumHomeV4Chevron className="h-6 w-6" />
        </span>
      </Link>
    </section>
  );
}
