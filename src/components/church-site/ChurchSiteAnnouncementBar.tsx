import type { ChurchSiteBanner } from "@/lib/church-site-banner";

export function ChurchSiteAnnouncementBar({ banner }: { banner: ChurchSiteBanner | null }) {
  if (!banner) return null;
  return (
    <a href={banner.href} className="church-cine-banner">
      <span className="church-premium__container church-cine-banner__inner">
        <span className="church-cine-banner__text">{banner.label}</span>
        <span className="church-cine-banner__cta" aria-hidden>
          Learn more →
        </span>
      </span>
    </a>
  );
}