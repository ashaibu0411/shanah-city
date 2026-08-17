"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/components/auth/AuthProvider";
import { Button, Card } from "@/components/ui";
import {
  GIVING_AMOUNT_PRESETS,
  GIVING_CHECKOUT_FUNDS,
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
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/giving/checkout")
      .then((response) => response.json())
      .then((data) => {
        setEnabled(Boolean(data.enabled));
      })
      .catch(() => setEnabled(false));
  }, []);

  const amount = preset === "custom" ? Number(customAmount) : preset;

  async function startCheckout() {
    setMessage(null);
    setSubmitting(true);

    const response = await fetch("/api/giving/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount, fund, frequency }),
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
      <Card className="mb-8 border-dashed border-night-900/10 bg-sand-50/80">
        <h2 className="font-display text-xl font-semibold text-night-900">
          Shanah City online giving
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-night-600">
          Secure card giving through Shanah City is being set up. Use PayPal, Cash App, Zelle, or
          the other options below in the meantime.
        </p>
      </Card>
    );
  }

  return (
    <Card className="mb-8 overflow-hidden p-0 ring-1 ring-night-900/10">
      <div className="bg-gradient-to-br from-night-900 to-night-950 px-6 py-5 text-sand-50">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-sand-300">
          Shanah City giving
        </p>
        <h2 className="mt-1 font-display text-2xl font-semibold">Give securely online</h2>
        <p className="mt-2 max-w-2xl text-sm text-sand-200/90">
          Choose your fund and amount here, then continue to Stripe for card payment. Signed-in
          members will see gifts on their profile automatically.
        </p>
      </div>

      <div className="space-y-5 p-6">
        {!loading && user ? (
          <p className="rounded-xl bg-sand-100 px-4 py-3 text-sm text-night-700">
            Giving as <span className="font-semibold">{user.name}</span>. Your history will appear
            on your profile.
          </p>
        ) : (
          <p className="rounded-xl bg-sand-100 px-4 py-3 text-sm text-night-700">
            You can give as a guest.{" "}
            <Link href="/sign-in?next=/give" className="font-semibold text-night-900 underline">
              Sign in
            </Link>{" "}
            to track your giving history in the app.
          </p>
        )}

        <div className="grid gap-4 md:grid-cols-2">
          <label className="text-sm text-night-700">
            <span className="font-semibold">Fund</span>
            <select
              value={fund}
              onChange={(event) => setFund(event.target.value as GivingFund)}
              className="mt-1 block w-full rounded-xl border border-night-900/10 bg-white px-3 py-2.5 text-sm outline-none ring-night-900/5 focus:ring-2"
            >
              {GIVING_CHECKOUT_FUNDS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <fieldset className="text-sm text-night-700">
            <legend className="font-semibold">Frequency</legend>
            <div className="mt-2 flex flex-wrap gap-2">
              {(
                [
                  { value: "once", label: "One-time" },
                  { value: "monthly", label: "Monthly" },
                ] as const
              ).map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setFrequency(option.value)}
                  className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                    frequency === option.value
                      ? "bg-night-900 text-sand-50"
                      : "bg-sand-100 text-night-700 hover:bg-sand-200"
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </fieldset>
        </div>

        <fieldset>
          <legend className="text-sm font-semibold text-night-700">Amount</legend>
          <div className="mt-2 flex flex-wrap gap-2">
            {GIVING_AMOUNT_PRESETS.map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => setPreset(value)}
                className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                  preset === value
                    ? "bg-night-900 text-sand-50"
                    : "bg-sand-100 text-night-700 hover:bg-sand-200"
                }`}
              >
                {formatMoney(value)}
              </button>
            ))}
            <button
              type="button"
              onClick={() => setPreset("custom")}
              className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                preset === "custom"
                  ? "bg-night-900 text-sand-50"
                  : "bg-sand-100 text-night-700 hover:bg-sand-200"
              }`}
            >
              Other
            </button>
          </div>
          {preset === "custom" && (
            <input
              type="number"
              min="1"
              step="0.01"
              inputMode="decimal"
              value={customAmount}
              onChange={(event) => setCustomAmount(event.target.value)}
              placeholder="Enter amount"
              className="mt-3 w-full max-w-xs rounded-xl border border-night-900/10 bg-white px-3 py-2.5 text-sm outline-none ring-night-900/5 focus:ring-2"
            />
          )}
        </fieldset>

        <div className="flex flex-wrap items-center gap-3">
          <Button
            onClick={startCheckout}
            disabled={submitting || !Number.isFinite(amount) || amount < 1}
          >
            {submitting
              ? "Redirecting…"
              : `Continue to checkout — ${formatMoney(Number.isFinite(amount) ? amount : 0)}${
                  frequency === "monthly" ? "/mo" : ""
                }`}
          </Button>
          <p className="text-xs text-night-500">
            Payments are processed securely by Stripe. Shanah City does not store card numbers.
          </p>
        </div>

        {message && (
          <p className="rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-900">{message}</p>
        )}
      </div>
    </Card>
  );
}
