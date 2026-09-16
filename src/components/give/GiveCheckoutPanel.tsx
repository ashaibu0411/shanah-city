"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/components/auth/AuthProvider";
import { editorialPremium } from "@/components/app/editorial-premium";
import { premiumTabPill } from "@/components/app/mobile-premium";
import { Button } from "@/components/ui";
import {
  estimateProcessingFeeCoverage,
  formatGivingFeeHint,
  type GivingFeePaymentMethod,
} from "@/lib/giving-fees";
import {
  givingTodayDateKey,
  recurringStartSummary,
} from "@/lib/giving-recurring-start";
import {
  GIVING_AMOUNT_PRESETS,
  GIVING_CHECKOUT_FUNDS,
  GIVING_CHECKOUT_FREQUENCIES,
  isRecurringCheckoutFrequency,
  type GivingCheckoutFrequency,
  type GivingFund,
} from "@/lib/giving-types";
import { openExternalUrl } from "@/lib/native-app";

function formatMoney(amount: number) {
  return amount.toLocaleString(undefined, { style: "currency", currency: "USD" });
}

export function GiveCheckoutPanel() {
  const { user, loading } = useAuth();
  const [enabled, setEnabled] = useState(false);
  const [fund, setFund] = useState<GivingFund>("tithe");
  const [frequency, setFrequency] = useState<GivingCheckoutFrequency>("once");
  const [preset, setPreset] = useState<number | "custom">(50);
  const [customAmount, setCustomAmount] = useState("");
  const [coverFees, setCoverFees] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<GivingFeePaymentMethod>("card");
  const [recurringStartDate, setRecurringStartDate] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const minStartDate = useMemo(() => givingTodayDateKey(), []);

  useEffect(() => {
    fetch("/api/giving/checkout")
      .then((response) => response.json())
      .then((data) => {
        setEnabled(Boolean(data.enabled));
      })
      .catch(() => setEnabled(false));
  }, []);

  useEffect(() => {
    if (isRecurringCheckoutFrequency(frequency) && !recurringStartDate) {
      setRecurringStartDate(minStartDate);
    }
  }, [frequency, minStartDate, recurringStartDate]);

  const frequencyOption =
    GIVING_CHECKOUT_FREQUENCIES.find((option) => option.value === frequency) ??
    GIVING_CHECKOUT_FREQUENCIES[0];

  const isRecurring = isRecurringCheckoutFrequency(frequency);
  const amount = preset === "custom" ? Number(customAmount) : preset;

  const feeCoverage = useMemo(() => {
    if (!Number.isFinite(amount) || amount < 1) {
      return { fee: 0, total: 0 };
    }
    return estimateProcessingFeeCoverage(amount, paymentMethod);
  }, [amount, paymentMethod]);

  const checkoutTotal = coverFees ? feeCoverage.total : amount;
  const startSummary = isRecurring
    ? recurringStartSummary(recurringStartDate || minStartDate)
    : null;

  async function startCheckout() {
    setMessage(null);
    setSubmitting(true);

    const payload: Record<string, unknown> = { amount, fund, frequency, coverFees, paymentMethod };
    if (isRecurring && recurringStartDate) {
      payload.recurringStartDate = recurringStartDate;
    }

    const response = await fetch("/api/giving/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await response.json();
    setSubmitting(false);

    if (response.ok && data.url) {
      await openExternalUrl(data.url);
      return;
    }

    setMessage(data.error ?? "Could not start checkout.");
  }

  if (!enabled) {
    return (
      <section className={`${editorialPremium.leadCard} mb-8 border-dashed`}>
        <p className={editorialPremium.sectionLabel}>Shanah City online giving</p>
        <h2 className={editorialPremium.sectionTitle}>Secure giving is being set up</h2>
        <p className="mt-3 text-sm leading-relaxed text-night-600">
          Use PayPal, Cash App, Zelle, or the other options below in the meantime.
        </p>
      </section>
    );
  }

  return (
    <section
      className={`${editorialPremium.surface} give-checkout-premium mb-10 overflow-hidden`}
      aria-labelledby="give-checkout-title"
    >
      <div className="give-checkout-premium-hero relative overflow-hidden px-6 py-8 sm:px-8 sm:py-10">
        <div
          className="pointer-events-none absolute inset-0 bg-gradient-to-br from-night-950 via-night-900 to-clay-900/40"
          aria-hidden
        />
        <div className="pointer-events-none absolute -right-16 top-0 h-48 w-48 rounded-full bg-clay-500/20 blur-3xl" aria-hidden />
        <p className="relative text-[10px] font-bold uppercase tracking-[0.28em] text-sand-300/90">
          Shanah City giving
        </p>
        <h2
          id="give-checkout-title"
          className="relative mt-2 font-display text-2xl font-semibold tracking-tight text-sand-50 sm:text-[1.75rem]"
        >
          Give securely online
        </h2>
        <p className="relative mt-3 max-w-2xl text-sm leading-relaxed text-sand-200/90">
          Card, Apple Pay, or bank (ACH) through Stripe. Signed-in members see gifts on their
          profile automatically.
        </p>
      </div>

      <div className="space-y-8 px-6 py-8 sm:px-8">
        {!loading && user ? (
          <p className={`${editorialPremium.leadCard} !py-3.5`}>
            Giving as <span className="font-semibold text-night-950">{user.name}</span>. History
            appears on your profile.
          </p>
        ) : (
          <p className={`${editorialPremium.leadCard} !py-3.5`}>
            You can give as a guest.{" "}
            <Link href="/sign-in?next=/give" className="font-semibold text-night-950 underline">
              Sign in
            </Link>{" "}
            to track giving in the app.
          </p>
        )}

        <div className="grid gap-8 lg:grid-cols-2">
          <div className="space-y-6">
            <div>
              <p className={editorialPremium.sectionLabel}>Fund</p>
              <select
                value={fund}
                onChange={(event) => setFund(event.target.value as GivingFund)}
                className="mt-2 block w-full rounded-2xl border border-night-900/10 bg-white px-4 py-3 text-sm font-medium text-night-900 outline-none ring-night-900/5 focus:ring-2 dark:border-white/10 dark:bg-[var(--color-surface)]"
              >
                {GIVING_CHECKOUT_FUNDS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

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

            {isRecurring ? (
              <div>
                <label className={editorialPremium.sectionLabel} htmlFor="recurring-start-date">
                  First gift date
                </label>
                <input
                  id="recurring-start-date"
                  type="date"
                  min={minStartDate}
                  value={recurringStartDate}
                  onChange={(event) => setRecurringStartDate(event.target.value)}
                  className="mt-2 block w-full max-w-xs rounded-2xl border border-night-900/10 bg-white px-4 py-3 text-sm text-night-900 outline-none ring-night-900/5 focus:ring-2 dark:border-white/10 dark:bg-[var(--color-surface)]"
                />
                <p className="mt-2 text-xs leading-relaxed text-night-500">{startSummary}</p>
              </div>
            ) : null}
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

            <fieldset>
              <legend className={editorialPremium.sectionLabel}>Pay with</legend>
              <p className="mt-1 text-xs leading-relaxed text-night-500 dark:text-sand-400">
                Card ~2.9% + $0.30; bank (ACH) ~0.8% (max $5). Fee coverage matches your choice
                below.
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setPaymentMethod("card")}
                  className={premiumTabPill(paymentMethod === "card", "px-4 py-2.5")}
                >
                  Card / Apple Pay
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMethod("ach")}
                  className={premiumTabPill(paymentMethod === "ach", "px-4 py-2.5")}
                >
                  Bank (ACH)
                </button>
              </div>
            </fieldset>

            {Number.isFinite(amount) && amount >= 1 ? (
              <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-night-900/8 bg-sand-50/90 px-4 py-4 dark:border-white/10 dark:bg-[var(--color-bg-soft)]">
                <input
                  type="checkbox"
                  checked={coverFees}
                  onChange={(event) => setCoverFees(event.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-night-900/20"
                />
                <span className="text-sm text-night-700 dark:text-sand-200">
                  <span className="font-semibold text-night-950 dark:text-sand-50">
                    Add {formatMoney(feeCoverage.fee)} to cover processing fees
                  </span>
                  <span className="mt-1 block text-xs text-night-500 dark:text-sand-400">
                    Shanah City receives your full {formatMoney(amount)} gift.{" "}
                    {coverFees
                      ? paymentMethod === "ach"
                        ? `Bank fee coverage ${formatMoney(feeCoverage.fee)}.`
                        : `Card fee coverage ${formatMoney(feeCoverage.fee)}.`
                      : formatGivingFeeHint(amount)}
                  </span>
                </span>
              </label>
            ) : null}
          </div>
        </div>

        <div className="give-checkout-premium-summary rounded-2xl border border-night-900/8 bg-gradient-to-br from-sand-50 to-white px-5 py-5 dark:border-white/10 dark:from-[var(--color-bg-soft)] dark:to-[var(--color-surface)]">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-night-500">
                Checkout total
              </p>
              <p className="mt-1 font-display text-3xl font-semibold tracking-tight text-night-950 dark:text-sand-50">
                {formatMoney(checkoutTotal)}
                <span className="text-lg text-night-500">{frequencyOption.suffix}</span>
              </p>
              {coverFees && feeCoverage.fee > 0 ? (
                <p className="mt-1 text-xs text-night-500">
                  {formatMoney(amount)} gift + {formatMoney(feeCoverage.fee)} fee coverage
                </p>
              ) : null}
              {isRecurring && startSummary ? (
                <p className="mt-2 text-xs text-night-600 dark:text-sand-300">{startSummary}</p>
              ) : null}
            </div>
            <Button
              className="!rounded-full !px-6 !py-3 !text-sm !font-semibold !shadow-[0_8px_24px_rgba(45,36,24,0.18)]"
              onClick={startCheckout}
              disabled={submitting || !Number.isFinite(amount) || amount < 1}
            >
              {submitting ? "Redirecting…" : "Continue to Stripe"}
            </Button>
          </div>
          <p className="mt-4 text-xs leading-relaxed text-night-500 dark:text-sand-400">
            Payments are processed securely by Stripe. Bank debits may take a few business days to
            settle. Recurring gifts can be updated anytime from{" "}
            <Link href="/profile" className="font-semibold text-night-700 underline dark:text-sand-200">
              Profile → Your giving
            </Link>
            .
          </p>
        </div>

        {message ? (
          <p className="rounded-2xl bg-amber-50 px-4 py-3 text-sm text-amber-900 ring-1 ring-amber-200/80">
            {message}
          </p>
        ) : null}
      </div>
    </section>
  );
}
