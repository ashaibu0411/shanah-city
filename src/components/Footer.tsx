import { ExternalLink } from "@/components/ui";
import { site } from "@/lib/site";
export function Footer() {
  return (
    <footer className="border-t border-night-900/10 bg-night-950 text-sand-100">
      <div className="mx-auto grid max-w-6xl gap-10 px-6 py-14 md:grid-cols-3">
        <div>
          <p className="font-display text-2xl font-semibold">{site.name}</p>
          <p className="mt-3 max-w-sm text-sm leading-relaxed text-sand-200/80">
            {site.tagline}
          </p>
        </div>

        <div>
          <p className="text-sm font-semibold uppercase tracking-wider text-sand-300">
            Service Times
          </p>
          <ul className="mt-4 space-y-3 text-sm text-sand-200/80">
            {site.serviceTimes.map((service) => (
              <li key={service.day}>
                <span className="font-medium text-sand-100">{service.day}</span>
                <br />
                {service.time} · {service.label}
              </li>
            ))}
          </ul>
        </div>

        <div>
          <p className="text-sm font-semibold uppercase tracking-wider text-sand-300">
            Contact
          </p>
          <ul className="mt-4 space-y-2 text-sm text-sand-200/80">
            <li>{site.address}</li>
            <li>{site.phone}</li>
            <li>{site.email}</li>
          </ul>
          <div className="mt-6 space-y-3 text-sm">
            <ExternalLink href={site.social.youtube} className="block hover:text-white">
              YouTube
            </ExternalLink>
            {site.social.facebook.map((account) => (
              <ExternalLink key={account.url} href={account.url} className="block hover:text-white">
                Facebook · {account.name}
              </ExternalLink>
            ))}
            {site.social.instagram.map((account) => (
              <ExternalLink key={account.url} href={account.url} className="block hover:text-white">
                Instagram · @{account.handle}
              </ExternalLink>
            ))}
          </div>
        </div>
      </div>

      <div className="border-t border-white/10 px-6 py-4 text-center text-xs text-sand-300/70">
        © {new Date().getFullYear()} {site.name}. All rights reserved.
      </div>
    </footer>
  );
}
