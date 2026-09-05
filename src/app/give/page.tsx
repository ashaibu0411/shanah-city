import { GiveCheckoutPanel } from "@/components/give/GiveCheckoutPanel";
import { GivePlatformGrid } from "@/components/give/GivePlatformGrid";
import { TextToGivePanel } from "@/components/give/TextToGivePanel";
import { PageHeader } from "@/components/ui";
import { getTextToGiveConfig } from "@/lib/giving-text";
import { givingPlatforms } from "@/lib/giving-links";
import { site } from "@/lib/site";

export default function GivePage() {
  const textToGive = getTextToGiveConfig();

  return (
    <>
      <PageHeader
        eyebrow="Giving"
        title="Give"
        description="Glorify God with every area of your life — including your finances."
      />

      <blockquote className="mb-8 rounded-2xl bg-sand-100 p-6 ring-1 ring-night-900/5">
        <p className="font-display text-lg italic text-night-800">
          &ldquo;{site.giving.verse}&rdquo;
        </p>
        <footer className="mt-2 text-sm font-semibold text-night-500">
          — {site.giving.reference}
        </footer>
      </blockquote>

      <div className="mb-8 rounded-2xl bg-white p-8 ring-1 ring-night-900/5">
        <h2 className="font-display text-xl font-semibold text-night-900">
          Why we give
        </h2>
        <p className="mt-3 leading-relaxed text-night-600">{site.giving.why}</p>
      </div>

      <GiveCheckoutPanel />

      {textToGive ? <TextToGivePanel config={textToGive} /> : null}

      <section className="mb-8">
        <h2 className="mb-4 font-display text-xl font-semibold text-night-900">
          Other online options
        </h2>
        <p className="mb-4 text-sm text-night-600">
          Choose the option that works best for you. PayPal, Cash App, and Venmo open in
          their apps on mobile when installed.
        </p>
        <GivePlatformGrid platforms={givingPlatforms} />
      </section>

      <section>
        <h2 className="mb-4 font-display text-xl font-semibold text-night-900">
          Other ways to give
        </h2>
        <div className="grid gap-4 md:grid-cols-3">
          {site.giving.methods
            .filter((method) => method.title !== "Give Online")
            .map((method) => (
              <div
                key={method.title}
                className="rounded-2xl bg-white p-6 ring-1 ring-night-900/5"
              >
                <h3 className="font-display text-xl font-semibold text-night-900">
                  {method.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-night-600">
                  {method.description}
                </p>
              </div>
            ))}
        </div>
      </section>

      <p className="mt-6 text-sm text-night-500">
        Questions? Call {site.phone} or email{" "}
        <a href={`mailto:${site.giving.financeEmail}`} className="font-semibold text-night-700 hover:underline">
          {site.giving.financeEmail}
        </a>
      </p>
    </>
  );
}
