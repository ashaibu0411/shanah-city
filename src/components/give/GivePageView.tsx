"use client";

import { GiveCheckoutPanel } from "@/components/give/GiveCheckoutPanel";
import { ManageRecurringGivingCallout } from "@/components/give/ManageRecurringGivingCallout";
import { GivePlatformGrid } from "@/components/give/GivePlatformGrid";
import { TextToGivePanel } from "@/components/give/TextToGivePanel";
import { editorialPremium } from "@/components/app/editorial-premium";
import type { TextToGiveConfig } from "@/lib/giving-text";
import type { GivingPlatform } from "@/lib/types";
import { site } from "@/lib/site";

type GivePageViewProps = {
  textToGive: TextToGiveConfig | null;
  platforms: GivingPlatform[];
};

export function GivePageView({ textToGive, platforms }: GivePageViewProps) {
  return (
    <div className="give-page-premium pb-4">
      <header className={`${editorialPremium.pageHeader} mb-5`}>
        <p className={editorialPremium.pageEyebrow}>Giving</p>
        <h1 className={editorialPremium.pageTitle}>Give</h1>
      </header>

      <blockquote className={`${editorialPremium.quote} mb-6`}>
        <p className="font-display text-lg italic leading-relaxed text-night-800 dark:text-sand-100">
          &ldquo;{site.giving.verse}&rdquo;
        </p>
        <footer className="mt-3 text-sm font-semibold text-night-500 dark:text-sand-400">
          — {site.giving.reference}
        </footer>
      </blockquote>

      <ManageRecurringGivingCallout />

      <GiveCheckoutPanel />

      {textToGive ? (
        <div className="mb-10">
          <p className={`${editorialPremium.sectionLabel} mb-3`}>Text to give</p>
          <TextToGivePanel config={textToGive} />
        </div>
      ) : null}

      <section className="mb-10">
        <p className={`${editorialPremium.sectionLabel} mb-3`}>Other online options</p>
        <p className="mb-5 max-w-2xl text-sm leading-relaxed text-night-600 dark:text-sand-300">
          PayPal, Cash App, and Venmo open in their apps on mobile when installed.
        </p>
        <GivePlatformGrid platforms={platforms} />
      </section>

      <section className={`${editorialPremium.section} mb-8`}>
        <p className={editorialPremium.sectionLabel}>In person & other ways</p>
        <div className="mt-5 grid gap-4 md:grid-cols-3">
          {site.giving.methods
            .filter((method) => method.title !== "Give Online")
            .map((method) => (
              <div
                key={method.title}
                className="rounded-2xl border border-night-900/6 bg-sand-50/80 p-5 dark:border-white/10 dark:bg-[var(--color-bg-soft)]"
              >
                <h3 className="font-display text-lg font-semibold text-night-950 dark:text-sand-50">
                  {method.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-night-600 dark:text-sand-300">
                  {method.description}
                </p>
              </div>
            ))}
        </div>
      </section>

      <p className="text-sm text-night-500 dark:text-sand-400">
        Questions? Call {site.phone} or email{" "}
        <a
          href={`mailto:${site.giving.financeEmail}`}
          className="font-semibold text-night-800 hover:underline dark:text-sand-200"
        >
          {site.giving.financeEmail}
        </a>
      </p>
    </div>
  );
}
