import { ConnectHero } from "@/components/connect/ConnectHero";
import { Button, ExternalLink, PageHeader } from "@/components/ui";
import { site } from "@/lib/site";

export default function ConnectPage() {
  return (
    <>
      <PageHeader
        eyebrow="Plan your visit"
        title="Connect"
        description="New here? We'd love to meet you. Join us in Aurora, Colorado or Accra, Ghana."
      />

      <ConnectHero />

      <div className="mb-6 rounded-2xl bg-night-900 p-8 text-sand-50">
        <h2 className="font-display text-2xl font-semibold">Service times</h2>
        <ul className="mt-4 space-y-3">
          {site.serviceTimes.map((service) => (
            <li
              key={service.day}
              className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-white/10 px-4 py-3"
            >
              <span className="font-medium">{service.day}</span>
              <span className="text-sand-200">{service.time}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="rounded-2xl bg-white p-8 ring-1 ring-night-900/5">
          <h3 className="font-display text-xl font-semibold text-night-900">
            What to expect
          </h3>
          <p className="mt-3 text-sm leading-relaxed text-night-600">
            {site.visitInfo.duration} {site.visitInfo.worship}
          </p>
          <ul className="mt-4 space-y-2">
            {site.visitInfo.highlights.map((item) => (
              <li
                key={item}
                className="flex items-start gap-2 text-sm text-night-600"
              >
                <span className="text-emerald-600">✓</span>
                {item}
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-2xl bg-white p-8 ring-1 ring-night-900/5">
          <h3 className="font-display text-xl font-semibold text-night-900">
            Contact us
          </h3>
          <ul className="mt-4 space-y-3 text-sm text-night-600">
            <li>
              <span className="font-semibold text-night-800">Address:</span>{" "}
              {site.address}
              <br />
              <ExternalLink
                href={site.mapsUrl}
                className="mt-1 inline-block text-night-700 hover:underline"
              >
                Open in Google Maps →
              </ExternalLink>
            </li>
            <li>
              <span className="font-semibold text-night-800">Phone:</span>{" "}
              <a href={`tel:${site.phone}`} className="hover:underline">
                {site.phone}
              </a>
            </li>
            <li>
              <span className="font-semibold text-night-800">Email:</span>{" "}
              <a href={`mailto:${site.email}`} className="hover:underline">
                {site.email}
              </a>
            </li>
            <li>
              <span className="font-semibold text-night-800">Office:</span>{" "}
              {site.officeHours}
            </li>
          </ul>
          <Button href={`${site.website}/contact`} className="mt-6">
            Contact form on shanahcity.org
          </Button>
        </div>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <div>
          <p className="text-sm font-semibold text-night-800">YouTube</p>
          <ExternalLink
            href={site.social.youtube}
            className="mt-1 inline-block text-sm font-medium text-night-700 hover:underline"
          >
            @ShanahCity →
          </ExternalLink>
        </div>
        <div>
          <p className="text-sm font-semibold text-night-800">Facebook</p>
          <ul className="mt-1 space-y-1">
            {site.social.facebook.map((account) => (
              <li key={account.url}>
                <ExternalLink
                  href={account.url}
                  className="text-sm font-medium text-night-700 hover:underline"
                >
                  {account.name} →
                </ExternalLink>
              </li>
            ))}
          </ul>
        </div>
        <div className="sm:col-span-2">
          <p className="text-sm font-semibold text-night-800">Instagram</p>
          <ul className="mt-1 flex flex-wrap gap-4">
            {site.social.instagram.map((account) => (
              <li key={account.url}>
                <ExternalLink
                  href={account.url}
                  className="text-sm font-medium text-night-700 hover:underline"
                >
                  @{account.handle} →
                </ExternalLink>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </>
  );
}
