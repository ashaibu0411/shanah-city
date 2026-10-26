"use client";

import Link from "next/link";
import { marriagePremium } from "@/components/marriage/marriage-counseling-premium";
import { MARRIAGE_CONSENT_VERSION } from "@/lib/marriage-counseling-curriculum";
import { readJsonResponse } from "@/lib/read-json-response";

type Props = {
  journeyId: string;
  partnerJoined: boolean;
  partnerConsent: boolean;
  onConsented: () => void | Promise<void>;
  error?: string;
};

export function MarriageConsentPanel({
  journeyId,
  partnerJoined,
  partnerConsent,
  onConsented,
  error,
}: Props) {
  async function recordConsent() {
    const res = await fetch("/api/marriage/journey", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "consent", journeyId }),
    });
    const data = await readJsonResponse<{ error?: string }>(res);
    if (!res.ok) throw new Error(data.error ?? "Consent could not be saved.");
    await onConsented();
  }

  return (
    <div className={`${marriagePremium.card} mt-6`}>
      <p className={marriagePremium.sectionLabel}>Individual consent &amp; privacy</p>
      <h2 className="mt-1 font-display text-lg font-semibold">Before you begin assessments</h2>
      <p className={`${marriagePremium.cardMuted} mt-3 text-sm leading-relaxed`}>
        Marriage Prep is a pastoral preparation tool, not emergency or clinical care. Each partner must
        accept these rules on their own account — consent is never shared automatically when you invite
        or join a journey.
      </p>
      <ul className="mt-4 list-disc space-y-2 pl-5 text-sm text-night-800 dark:text-sand-200">
        <li>
          Answers marked for sharing appear to your partner only after you both submit that module.
        </li>
        <li>Private reflections and counselor-only items stay off your partner&apos;s screen unless you grant sharing.</li>
        <li>Your counselor sees only what church policy and your consents allow.</li>
        <li>
          Consent version <span className="font-mono text-xs">{MARRIAGE_CONSENT_VERSION}</span> — recorded
          with a timestamp for your account only.
        </li>
      </ul>
      {partnerJoined && !partnerConsent ? (
        <p className="mt-4 text-sm text-amber-800 dark:text-amber-200">
          After you accept, your partner must also accept on their device before couple comparisons and
          joint homework unlock.
        </p>
      ) : null}
      {!partnerJoined ? (
        <p className="mt-4 text-sm text-night-700 dark:text-sand-300">
          You may accept now and begin individual work while you wait for your partner to join with your
          invitation code.
        </p>
      ) : null}
      {error ? (
        <p className="mt-3 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-800 dark:bg-red-950/40 dark:text-red-200">
          {error}
        </p>
      ) : null}
      <button
        type="button"
        className={`${marriagePremium.primaryCta} mt-5`}
        onClick={() => void recordConsent().catch((e) => alert(e instanceof Error ? e.message : "Consent failed."))}
      >
        I understand — record my consent
      </button>
      <Link href="/marriage" className={`${marriagePremium.secondaryCta} mt-3 inline-block`}>
        Back to Marriage Prep hub
      </Link>
    </div>
  );
}
