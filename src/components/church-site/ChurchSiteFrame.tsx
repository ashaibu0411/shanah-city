import { brandLogos, site } from "@/lib/site";
import type { ReactNode } from "react";

export const publicNavMain = [
  { label: "Home", href: "/" },
  { label: "About", href: "/about" },
  { label: "Visit", href: "/visit" },
  { label: "Ministries", href: "/ministries" },
  { label: "Messages", href: "/messages" },
  { label: "Events", href: "/events" },
  { label: "Contact", href: "/contact" },
] as const;

export const publicNavAll = [
  ...publicNavMain,
  { label: "Download App", href: "/app" },
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
    <header className="church-premium-header">
      <div className="church-premium__container church-premium-header__inner">
        <a href="/" className="church-premium-header__brand" aria-label="Shanah City Church home">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={brandLogos.light} alt="" className="h-10 w-auto max-w-[8.5rem] object-contain" />
          <span className="church-premium-header__wordmark hidden sm:block">
            Shanah City
            <br />
            Church
          </span>
        </a>

        <nav aria-label="Church website" className="church-premium-header__nav">
          {publicNavMain.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className={item.href === activePath || (activePath === "/" && item.href === "/") ? "is-active" : ""}
            >
              {item.label}
            </a>
          ))}
        </nav>

        <div className="church-premium-header__actions">
          <a href="/app" className="church-premium-header__text-link">
            Download App
          </a>
          <a href="/give" className="church-premium__btn-primary hidden sm:inline-flex">
            Give
          </a>
          <details className="church-premium-header__menu">
            <summary aria-label="Open navigation menu">☰</summary>
            <nav aria-label="Mobile church website" className="church-premium-header__dropdown">
              {publicNavAll.map((item) => (
                <a key={item.href} href={item.href}>
                  {item.label}
                </a>
              ))}
              <a href="/give">Give online</a>
            </nav>
          </details>
        </div>
      </div>
    </header>
  );
}

export function ChurchSiteFooter() {
  const year = new Date().getFullYear();
  return (
    <footer className="church-premium-footer">
      <div className="church-premium__container church-premium-footer__grid">
        <div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={brandLogos.dark} alt="Shanah City" className="h-10 w-auto" />
          <p className="mt-4 max-w-sm text-sm leading-7 text-white/80">
            Changing lives to higher levels in God. A welcoming, multicultural church family in Aurora,
            Colorado.
          </p>
        </div>
        <div>
          <p className="church-premium-footer__title">Explore</p>
          <div className="mt-4 grid gap-2 text-sm">
            {publicNavMain.map((item) => (
              <a key={item.href} href={item.href}>
                {item.label}
              </a>
            ))}
            <a href="/give">Give</a>
            <a href="/app">Download app</a>
          </div>
        </div>
        <div>
          <p className="church-premium-footer__title">Visit &amp; connect</p>
          <div className="mt-4 space-y-2 text-sm leading-7 text-white/80">
            <p>Sunday worship · 10:00 AM</p>
            <p>{site.address}</p>
            <a href={`mailto:${site.email}`}>{site.email}</a>
            <a href={site.mapsUrl} target="_blank" rel="noopener noreferrer">
              Get directions
            </a>
            <a href="https://shanah-city.vercel.app/login">Member sign in</a>
          </div>
        </div>
      </div>
      <div className="church-premium__container church-premium-footer__bottom">
        <span>© {year} Shanah City Church. All rights reserved.</span>
        <div className="flex flex-wrap gap-4">
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
    </footer>
  );
}

export function ChurchSiteFrame({ children }: { children: ReactNode }) {
  return (
    <div className="church-premium min-h-screen font-sans antialiased">
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