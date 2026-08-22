"use client";

import { useAppShell } from "@/components/app/AppShellContext";
import { GuestCaptureForm } from "@/components/guest/GuestCaptureForm";
import { Button, ExternalLink } from "@/components/ui";
import { site } from "@/lib/site";

export function ConnectPageView() {
  const { isMobileApp } = useAppShell();

  if (isMobileApp) {
    return (
      <div className="space-y-3">
        <div className="mobile-card overflow-hidden p-0">
          <div
            className={`bg-gradient-to-br ${site.visitCTA.gradient} px-4 py-5 text-white`}
          >
            <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-white/80">
              Plan your visit
            </p>
            <h2 className="mt-1 font-display text-2xl font-bold tracking-tight">
              We&apos;d love to meet you
            </h2>
            <p className="mt-2 text-sm leading-snug text-white/85">
              Aurora, Colorado · Accra, Ghana
            </p>
          </div>
        </div>

        <div className="mobile-card p-4">
          <h3 className="font-display text-lg font-bold tracking-tight text-night-900">
            Service times
          </h3>
          <ul className="mt-3 space-y-2">
            {site.serviceTimes.map((service) => (
              <li
                key={service.day}
                className="flex items-center justify-between rounded-xl bg-night-950 px-3 py-2.5 text-sm text-white"
              >
                <span className="font-semibold">{service.day}</span>
                <span className="text-sand-200">{service.time}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="mobile-card p-4">
          <h3 className="font-display text-lg font-bold tracking-tight text-night-900">
            First time here?
          </h3>
          <p className="mt-1 text-sm leading-snug text-night-600">
            Tell us you came — no account needed. Our welcome team will be glad to meet you.
          </p>
          <GuestCaptureForm embedded />
        </div>

        <div className="mobile-card p-4">
          <h3 className="font-display text-lg font-bold tracking-tight text-night-900">
            What to expect
          </h3>
          <p className="mt-2 text-sm leading-relaxed text-night-600">
            {site.visitInfo.duration} {site.visitInfo.worship}
          </p>
          <ul className="mt-3 space-y-2">
            {site.visitInfo.highlights.map((item) => (
              <li key={item} className="flex items-start gap-2 text-sm text-night-700">
                <span className="font-bold text-emerald-600">✓</span>
                {item}
              </li>
            ))}
          </ul>
        </div>

        <div className="mobile-card p-4">
          <h3 className="font-display text-lg font-bold tracking-tight text-night-900">
            Contact
          </h3>
          <ul className="mt-3 space-y-3 text-sm text-night-700">
            <li>
              <span className="font-semibold text-night-900">Address</span>
              <p className="mt-0.5">{site.address}</p>
              <ExternalLink href={site.mapsUrl} className="mt-1 inline-block font-semibold text-night-900 underline">
                Open in Maps →
              </ExternalLink>
            </li>
            <li>
              <span className="font-semibold text-night-900">Phone</span>
              <p className="mt-0.5">
                <a href={`tel:${site.phone}`} className="underline">
                  {site.phone}
                </a>
              </p>
            </li>
            <li>
              <span className="font-semibold text-night-900">Email</span>
              <p className="mt-0.5">
                <a href={`mailto:${site.email}`} className="underline">
                  {site.email}
                </a>
              </p>
            </li>
          </ul>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="mb-6 rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-800 p-8 text-white">
        <h2 className="font-display text-2xl font-semibold">First time here?</h2>
        <p className="mt-2 max-w-xl text-sm text-emerald-100">
          Tell us you came — no account or sign-in needed. Our welcome team will be glad to meet you.
        </p>
        <Button href="/guest" className="mt-5 bg-white text-emerald-900 hover:bg-emerald-50">
          Connect as a guest
        </Button>
      </div>

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
          <h3 className="font-display text-xl font-semibold text-night-900">What to expect</h3>
          <p className="mt-3 text-sm leading-relaxed text-night-600">
            {site.visitInfo.duration} {site.visitInfo.worship}
          </p>
          <ul className="mt-4 space-y-2">
            {site.visitInfo.highlights.map((item) => (
              <li key={item} className="flex items-start gap-2 text-sm text-night-600">
                <span className="text-emerald-600">✓</span>
                {item}
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-2xl bg-white p-8 ring-1 ring-night-900/5">
          <h3 className="font-display text-xl font-semibold text-night-900">Contact us</h3>
          <ul className="mt-4 space-y-3 text-sm text-night-600">
            <li>
              <span className="font-semibold text-night-800">Address:</span> {site.address}
              <br />
              <ExternalLink href={site.mapsUrl} className="mt-1 inline-block text-night-700 hover:underline">
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
              <span className="font-semibold text-night-800">Office:</span> {site.officeHours}
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
          <ExternalLink href={site.social.youtube} className="mt-1 inline-block text-sm font-medium text-night-700 hover:underline">
            @ShanahCity →
          </ExternalLink>
        </div>
        <div>
          <p className="text-sm font-semibold text-night-800">Facebook</p>
          <ul className="mt-1 space-y-1">
            {site.social.facebook.map((account) => (
              <li key={account.url}>
                <ExternalLink href={account.url} className="text-sm font-medium text-night-700 hover:underline">
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
                <ExternalLink href={account.url} className="text-sm font-medium text-night-700 hover:underline">
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
