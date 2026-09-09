"use client";

import { editorialPremium } from "@/components/app/editorial-premium";
import { ExternalLink, PageHeader } from "@/components/ui";
import { leadership, site } from "@/lib/site";

export function AboutPageView() {
  const quoteClass = `${editorialPremium.quote} mb-6`;
  const sectionClass = `${editorialPremium.section} mb-0`;
  const leaderClass = `${editorialPremium.section} rounded-xl`;

  return (
    <>
      <PageHeader eyebrow="About" title={site.name} description={site.tagline} />

      <blockquote className={quoteClass}>
        <p className="font-home-hero text-2xl font-semibold italic text-night-800">
          &ldquo;{site.tagline}&rdquo;
        </p>
        <footer className="mt-3 text-sm text-night-500">
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
