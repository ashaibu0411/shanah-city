import Link from "next/link";
import { PremiumHomeV4Chevron, PremiumHomeV4Heart } from "@/components/home/premium/v4/PremiumHomeV4Icons";

export function PremiumHomeV4GiveBar() {
  return (
    <section className="ph4-section" aria-label="Give">
      <Link href="/give" className="ph4-give">
        <span className="ph4-give__icon">
          <PremiumHomeV4Heart />
        </span>
        <span className="ph4-give__title">Give</span>
        <span className="ph4-give__arrow">
          <PremiumHomeV4Chevron />
        </span>
      </Link>
    </section>
  );
}
