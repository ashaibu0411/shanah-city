"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/components/auth/AuthProvider";
import { editorialPremium } from "@/components/app/editorial-premium";
import { premiumTabPill } from "@/components/app/mobile-premium";
import { Button } from "@/components/ui";
import {
  GIVING_AMOUNT_PRESETS,
  GIVING_CHECKOUT_FREQUENCIES,
  isRecurringCheckoutFrequency,
  type GivingCheckoutFrequency,
  type GivingFund,
} from "@/lib/giving-types";
import { openExternalUrl } from "@/lib/native-app";
import { getFormattedAccountName } from "@/lib/member-display-name";

function formatMoney(amount: number) {
  return amount.toLocaleString(undefined, { style: "currency", currency: "USD" });
}

type FundOption = { value: GivingFund; label: string };

export function GiveAnedotPanel() {
  const { user, loading } = useAuth();
  const [enabled, setEnabled] = useState(false);
  const [fundOptions, setFundOptions] = useState<FundOption[]>([]);
  const [fund, setFund] = useState<GivingFund>("tithe");
  const [frequency, setFrequency] = useState<GivingCheckoutFrequency>("once");
  const [preset, setPreset] = useState<number | "custom">(50);
  const [customAmount, setCustomAmount] = useState("");
  const [coverFees, setCoverFees] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/giving/anedot", { cache: "no-store" })
      .then((response) => response.json())
      .then((data) => {
        setEnabled(Boolean(data.enabled));
        const fromApi = (data.funds ?? []) as FundOption[];
        if (fromApi.length > 0) {
          setFundOptions(fromApi);
          setFund((current) =>
            fromApi.some((option) => option.value === current) ? current : fromApi[0].value,
          );
        }
      })
      .catch(() => setEnabled(false));
  }, []);

  const isRecurring = isRecurringCheckoutFrequency(frequency);
  const amount = preset === "custom" ? Number(customAmount) : preset;

  async function startCheckout() {
    setMessage(null);
    setSubmitting(true);

    const response = await fetch("/api/giving/anedot/intent", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount, fund, frequency, coverFees }),
    });
    const data = await response.json();
    setSubmitting(false);

    if (response.ok && data.redirectUrl) {
      await openExternalUrl(data.redirectUrl);
      return;
    }

    setMessage(data.error ?? "Could not open Anedot checkout.");
  }

  if (!enabled) {
    return null;
  }

  return (
    <section
      className={`${editorialPremium.surface} give-anedot-premium mb-10 overflow-hidden`}
      aria-labelledby="give-anedot-title"
    >
      <div className="border-b border-night-900/8 px-6 py-5 sm:px-8 dark:border-white/10">
        <p className={editorialPremium.sectionLabel}>Anedot hosted giving</p>
        <h2
          id="give-anedot-title"
          className="mt-1 font-display text-xl font-semibold tracking-tight text-night-950 dark:text-sand-50"
        >
          Bank (ACH) or card on Anedot&apos;s secure page
        </h2>
      </div>

      <div className="space-y-8 px-6 py-6 sm:px-8 sm:py-8">
        {!loading && user ? (
          <p className={`${editorialPremium.leadCard} !py-3.5`}>
            Giving as{" "}
            <span className="font-semibold text-night-950 dark:text-sand-50">
              {getFormattedAccountName(user)}
            </span>
            . You will complete payment on Anedot; gifts sync back after verified settlement.
          </p>
        ) : (
          <p className={`${editorialPremium.leadCard} !py-3.5`}>
            You can give as a guest on Anedot.{" "}
            <Link href="/sign-in?next=/give" className="font-semibold text-night-950 underline">
              Sign in
            </Link>{" "}
            so we can match your gift to your member history.
          </p>
        )}

        <p className="text-sm leading-relaxed text-night-600 dark:text-sand-300">
          Card and bank details stay on Anedot (not in this app). ACH gifts appear in your history
          after Anedot reports settlement.
        </p>

        <div className="grid gap-8 lg:grid-cols-2">
          <div className="space-y-6">
            <fieldset>
              <legend className={editorialPremium.sectionLabel}>Fund</legend>
              <div className="mt-3 flex flex-wrap gap-2">
                {fundOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setFund(option.value)}
                    className={premiumTabPill(fund === option.value, "px-3 py-2.5 text-left")}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </fieldset>

            <fieldset>
              <legend className={editorialPremium.sectionLabel}>Frequency</legend>
              <div className="mt-3 flex flex-wrap gap-2">
                {GIVING_CHECKOUT_FREQUENCIES.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setFrequency(option.value)}
                    className={premiumTabPill(frequency === option.value, "px-4 py-2.5")}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </fieldset>
          </div>

          <div className="space-y-6">
            <fieldset>
              <legend className={editorialPremium.sectionLabel}>Amount</legend>
              <div className="mt-3 flex flex-wrap gap-2">
                {GIVING_AMOUNT_PRESETS.map((value) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setPreset(value)}
                    className={premiumTabPill(preset === value, "min-w-[4.5rem] px-4 py-2.5")}
                  >
                    {formatMoney(value)}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => setPreset("custom")}
                  className={premiumTabPill(preset === "custom", "px-4 py-2.5")}
                >
                  Other
                </button>
              </div>
              {preset === "custom" ? (
                <input
                  type="number"
                  min="1"
                  step="0.01"
                  inputMode="decimal"
                  value={customAmount}
                  onChange={(event) => setCustomAmount(event.target.value)}
                  placeholder="Enter amount"
                  className="mt-3 w-full max-w-xs rounded-2xl border border-night-900/10 bg-white px-4 py-3 text-sm outline-none ring-night-900/5 focus:ring-2 dark:border-white/10 dark:bg-[var(--color-surface)]"
                />
              ) : null}
            </fieldset>

            {Number.isFinite(amount) && amount >= 1 ? (
              <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-night-900/8 bg-sand-50/90 px-4 py-4 dark:border-white/10 dark:bg-[var(--color-bg-soft)]">
                <input
                  type="checkbox"
                  checked={coverFees}
                  onChange={(event) => setCoverFees(event.target.checked)}
                  className="mt-1"
                />
                <span className="text-sm leading-relaxed text-night-700 dark:text-sand-200">
                  I&apos;d like to help cover processing fees on Anedot (card ~3.3% + $0.30; ACH
                  ~0.3% + $0.30 per church pricing).
                </span>
              </label>
            ) : null}
          </div>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <Button
            type="button"
            className="!rounded-full !px-6 !py-3 !text-sm !font-semibold !shadow-[0_8px_24px_rgba(45,36,24,0.18)]"
            disabled={submitting || !Number.isFinite(amount) || amount < 1}
            onClick={startCheckout}
          >
            {submitting
              ? "Opening Anedot…"
              : isRecurring
                ? `Continue on Anedot (${formatMoney(amount)}/gift)`
                : `Continue on Anedot (${formatMoney(amount)})`}
          </Button>
          {message ? <p className="text-sm text-red-700 dark:text-red-300">{message}</p> : null}
        </div>
      </div>
    </section>
  );
}
