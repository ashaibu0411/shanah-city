"use client";

import { ExternalLink, PageHeader } from "@/components/ui";
import { useAppShell } from "@/components/app/AppShellContext";
import { leadership, site } from "@/lib/site";

export function AboutPageView() {
  const { isMobileApp } = useAppShell();

  const quoteClass = isMobileApp
    ? "mobile-premium-quote mb-6 p-5"
    : "mb-8 rounded-2xl bg-night-900 p-8 text-sand-50";

  const sectionClass = isMobileApp
    ? "mobile-premium-section p-5"
    : "rounded-2xl bg-white p-8 ring-1 ring-night-900/5";

  const leaderClass = isMobileApp
    ? "mobile-premium-section rounded-xl p-4"
    : "rounded-xl bg-sand-50 p-4 ring-1 ring-night-900/5";

  return (
    <>
      <PageHeader eyebrow="About" title={site.name} description={site.tagline} />

      <blockquote className={quoteClass}>
        <p
          className={`font-home-hero text-2xl font-semibold italic ${
            isMobileApp ? "text-night-800" : "text-sand-50"
          }`}
        >
          &ldquo;{site.tagline}&rdquo;
        </p>
        <footer className={`mt-3 text-sm ${isMobileApp ? "text-night-500" : "text-sand-300"}`}>
          — {site.scripture}
        </footer>
      </blockquote>

      <div className="space-y-6">
        <div className={sectionClass}>
          <h2 className="font-display text-xl font-semibold text-night-900">Welcome home</h2>
          <p className="mt-3 leading-relaxed text-night-600">{site.description}</p>
          <p className="mt-4 font-medium text-night-800">{site.mission}</p>
          <p className="mt-2 text-sm italic text-night-500">{site.welcome}</p>
        </div>

        <div className={sectionClass}>
          <h2 className="font-display text-xl font-semibold text-night-900">Leadership</h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            {leadership.map((leader) => (
              <div key={leader.name} className={leaderClass}>
                <h3 className="font-semibold text-night-900">{leader.name}</h3>
                <p className="mt-1 text-sm text-night-600">{leader.role}</p>
              </div>
            ))}
          </div>
        </div>

        <p className="text-sm text-night-500">
          Learn more at{" "}
          <ExternalLink
            href={site.website}
            className="font-semibold text-night-800 hover:underline"
          >
            shanahcity.org
          </ExternalLink>
        </p>
      </div>
    </>
  );
}
