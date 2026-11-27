import { brandLogos, site } from "@/lib/site";
import type { ReactNode } from "react";

export const publicNavMain = [
  { label: "About", href: "/about" },
  { label: "Connect", href: "/contact" },
  { label: "Ministries", href: "/ministries" },
  { label: "Events", href: "/events" },
  { label: "Messages", href: "/messages" },
  { label: "Give", href: "/give" },
] as const;

export const publicNavAll = [
  { label: "Home", href: "/" },
  ...publicNavMain,
  { label: "Plan Your Visit", href: "/visit" },
  { label: "Download App", href: "/app" },
  { label: "Member sign in", href: "/sign-in" },
] as const;

function StripIcon({ children }: { children: ReactNode }) {
  return (
    <span className="church-premium-strip__icon" aria-hidden>
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
        {children}
      </svg>
    </span>
  );
}

export function ChurchSiteHeader({ activePath = "/" }: { activePath?: string }) {
  return (
    <header className="church-v5-header">
      <div className="church-v5__container church-v5-header__inner">
        <a href="/" className="shrink-0" aria-label="Shanah City Church home">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={brandLogos.dark} alt="Shanah City" className="church-v5-header__logo" />
        </a>

        <nav aria-label="Church website" className="church-v5-header__nav">
          {publicNavMain.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className={item.href === activePath ? "is-active" : undefined}
            >
              {item.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <a href="/visit" className="church-v5-header__cta">
            Plan Your Visit <span className="church-v5-header__cta-arrow" aria-hidden>→</span>
          </a>
          <details className="church-v5-header__menu">
            <summary aria-label="Open navigation menu">
              <span className="church-v5-header__menu-bars" aria-hidden />
            </summary>
            <nav aria-label="Mobile church website" className="church-v5-header__dropdown">
              {publicNavAll.map((item) => (
                <a key={item.href} href={item.href}>
                  {item.label}
                </a>
              ))}
            </nav>
          </details>
        </div>
      </div>
    </header>
  );
}

export function ChurchSiteFooter() {
  const year = new Date().getFullYear();
  const friday = site.serviceTimes.find((s) => s.day.toLowerCase().includes("friday"));
  const sunday = site.serviceTimes.find((s) => s.day.toLowerCase().includes("sunday"));

  return (
    <footer className="church-v5-footer">
      <div className="church-v5__container church-v5-footer__grid">
        <div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={brandLogos.light} alt="Shanah City" className="h-9 w-auto" />
          <p className="mt-4 max-w-sm text-sm leading-7 text-white/75">
            {site.mission} A welcoming church family in Aurora, Colorado.
          </p>
          <div className="mt-4 space-y-1 text-sm text-white/75">
            {sunday ? <p>Sunday worship · {sunday.time.split("–")[0].trim()}</p> : null}
            {friday ? <p>Glory Encounter · Fridays · {friday.time.split("–")[0].trim()}</p> : null}
            <p>{site.address}</p>
            <a href={`tel:${site.phone.replace(/[^\d+]/g, "")}`}>{site.phone}</a>
            <br />
            <a href={`mailto:${site.email}`}>{site.email}</a>
          </div>
        </div>
        <div>
          <p className="church-v5-footer__title">Explore</p>
          <div className="mt-4 grid gap-2">
            {publicNavMain.map((item) => (
              <a key={item.href} href={item.href}>
                {item.label}
              </a>
            ))}
            <a href="/visit">Plan Your Visit</a>
            <a href="/app">Download app</a>
          </div>
        </div>
        <div>
          <p className="church-v5-footer__title">Visit &amp; legal</p>
          <div className="mt-4 grid gap-2">
            <a href={site.mapsUrl} target="_blank" rel="noopener noreferrer">
              Get directions
            </a>
            <a href="/sign-in">Member sign in</a>
            <a href="/privacy">Privacy policy</a>
            <a href="/terms">Terms</a>
            <div className="mt-2 flex flex-wrap gap-3">
              <a href={site.social.facebook[0].url} target="_blank" rel="noopener noreferrer">
                Facebook
              </a>
              <a href={site.social.instagram[0].url} target="_blank" rel="noopener noreferrer">
                Instagram
              </a>
              <a href={site.social.youtube} target="_blank" rel="noopener noreferrer">
                YouTube
              </a>
            </div>
          </div>
        </div>
      </div>
      <div className="church-v5__container church-v5-footer__bottom">
        <span>© {year} Shanah City Church. All rights reserved.</span>
      </div>
    </footer>
  );
}

export function ChurchSiteFrame({ children }: { children: ReactNode }) {
  return (
    <div className="church-premium church-v5 min-h-screen antialiased">
      <ChurchSiteHeader />
      {children}
      <ChurchSiteFooter />
    </div>
  );
}

export function ChurchPageIntro({
  eyebrow,
  title,
  description,
  image,
  imagePosition = "center",
}: {
  eyebrow: string;
  title: string;
  description: string;
  image: string;
  imagePosition?: string;
}) {
  return (
    <section className="relative isolate overflow-hidden bg-[var(--church-midnight)] px-6 py-24 text-white sm:px-10 lg:py-32">
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url('${image}')`, backgroundPosition: imagePosition }}
        aria-hidden="true"
      />
      <div className="absolute inset-0 bg-gradient-to-r from-[#091628]/95 via-[#10264a]/85 to-[#10264a]/45" />
      <div className="church-premium__container relative">
        <p className="church-premium__eyebrow text-[var(--church-gold-soft)]">{eyebrow}</p>
        <h1 className="church-premium-hero__title mt-4 max-w-3xl">{title}</h1>
        <p className="church-premium-hero__copy">{description}</p>
      </div>
    </section>
  );
}

export function ChurchSectionHeading({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description?: string;
}) {
  return (
    <div>
      <p className="church-premium__eyebrow">{eyebrow}</p>
      <h2 className="church-premium__title mt-3 text-[clamp(1.85rem,4vw,2.75rem)]">{title}</h2>
      {description ? (
        <p className="mt-4 max-w-2xl text-base leading-7 text-[var(--church-ink-muted)]">{description}</p>
      ) : null}
    </div>
  );
}

export { StripIcon };