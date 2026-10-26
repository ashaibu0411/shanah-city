"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { MarriageConsentPanel } from "@/components/marriage/MarriageConsentPanel";
import { marriagePremium } from "@/components/marriage/marriage-counseling-premium";
import {
  fetchMarriageHubSummaryClient,
  marriageHubLoadErrorMessage,
} from "@/lib/marriage-hub-client";
import type { MarriageHubSummary } from "@/lib/marriage-counseling-types";
import Link from "next/link";

export function MarriageConsentClient() {
  const router = useRouter();
  const [hub, setHub] = useState<MarriageHubSummary | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const result = await fetchMarriageHubSummaryClient();
      if (result.ok) {
        setHub(result.data);
        if (result.data.myConsent) router.replace("/marriage");
      } else {
        setHub(null);
        setError(marriageHubLoadErrorMessage(result));
      }
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading) {
    return (
      <p className={marriagePremium.cardMuted} aria-busy="true">
        Loading…
      </p>
    );
  }

  if (error && !hub) {
    const signInRequired = error === "__sign_in_required__";
    return (
      <div className={marriagePremium.card} role="alert">
        <p className="text-sm font-semibold text-red-900 dark:text-red-200">
          {signInRequired ? "Sign in to record consent." : error}
        </p>
        {signInRequired ? (
          <Link href="/sign-in?next=/marriage/consent" className={`${marriagePremium.primaryCta} mt-4 inline-block`}>
            Sign in
          </Link>
        ) : null}
      </div>
    );
  }

  if (!hub?.journey) {
    return (
      <div className={marriagePremium.card}>
        <p className="text-sm">Start or join a journey before recording consent.</p>
        <Link href="/marriage" className={`${marriagePremium.primaryCta} mt-4 inline-block`}>
          Go to Marriage Prep
        </Link>
      </div>
    );
  }

  return (
    <MarriageConsentPanel
      journeyId={hub.journey.id}
      partnerJoined={hub.partnerJoined}
      partnerConsent={hub.partnerConsent}
      error={error}
      onConsented={async () => {
        await load();
        router.push("/marriage");
      }}
    />
  );
}
