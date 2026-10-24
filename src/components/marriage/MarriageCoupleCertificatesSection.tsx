"use client";

import type { MarriageCoupleCertificatesGalleryView } from "@/lib/marriage-certificate-types";
import { marriagePremium } from "@/components/marriage/marriage-counseling-premium";

type Props = {
  gallery: MarriageCoupleCertificatesGalleryView;
  journeyId: string;
};

export function MarriageCoupleCertificatesSection({ gallery, journeyId }: Props) {
  return (
    <section className={`${marriagePremium.card} mt-6 min-w-0`} aria-labelledby="my-certificates-heading">
      <h2 id="my-certificates-heading" className={marriagePremium.sectionLabel}>
        My certificates
      </h2>
      <p className={`${marriagePremium.cardMuted} mt-1 text-sm`}>
        Session milestones unlock when your counselor marks a session complete. The official program certificate
        is issued separately by the Senior Pastor.
      </p>

      <ul className="mt-4 space-y-2">
        {gallery.sessionMilestones.map((m) => (
          <li
            key={m.sessionKey}
            className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-stone-200 px-3 py-3 text-sm dark:border-white/10"
          >
            <div className="min-w-0">
              <p className="font-semibold">
                Session {m.order}: {m.title}
              </p>
              <p className="text-xs text-night-500">
                {m.unlocked
                  ? m.completionDateMissing
                    ? "Complete — completion date not recorded"
                    : "Complete"
                  : "Locked until counselor marks session complete"}
              </p>
            </div>
            {m.unlocked ? (
              <a
                href={`/api/marriage/certificates/session/${encodeURIComponent(m.sessionKey)}?journeyId=${encodeURIComponent(journeyId)}`}
                className="min-h-[44px] shrink-0 rounded-full bg-clay-800 px-4 py-2 text-xs font-bold text-white dark:bg-clay-600"
              >
                Download
              </a>
            ) : (
              <span className="text-xs font-semibold text-night-400">Locked</span>
            )}
          </li>
        ))}
      </ul>

      <div className="mt-4 rounded-xl border border-clay-200 bg-clay-50/50 px-3 py-3 dark:border-clay-800 dark:bg-clay-950/20">
        <p className="text-sm font-semibold">Official program certificate</p>
        <p className="mt-1 text-xs text-night-600 dark:text-sand-400">
          Status: {gallery.finalCertificate.status.replace(/_/g, " ")}
          {gallery.finalCertificate.certificateNumber
            ? ` · ${gallery.finalCertificate.certificateNumber}`
            : ""}
        </p>
        {gallery.finalCertificate.eligibilitySummary.length > 0 &&
        gallery.finalCertificate.status === "not_eligible" ? (
          <ul className="mt-2 list-inside list-disc text-xs text-night-500">
            {gallery.finalCertificate.eligibilitySummary.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
        ) : null}
        {gallery.finalCertificate.canDownload ? (
          <a
            href={`/api/marriage/certificates/final?journeyId=${encodeURIComponent(journeyId)}`}
            className="mt-3 inline-block min-h-[44px] rounded-full bg-clay-800 px-4 py-2 text-xs font-bold text-white dark:bg-clay-600"
          >
            Download final certificate
          </a>
        ) : null}
      </div>
    </section>
  );
}
