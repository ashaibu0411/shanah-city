"use client";

import { useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { Button } from "@/components/ui";
import { GIVING_CHECKOUT_FUNDS } from "@/lib/giving-types";
import type { PublicGivingHubMethod } from "@/lib/giving-hub-types";

type Props = {
  methods: PublicGivingHubMethod[];
};

export function GivingHubOffPlatformPanel({ methods }: Props) {
  const { user } = useAuth();
  const eligible = methods.filter((m) => m.methodKey === "zelle" || m.methodKey === "cashapp");
  const [methodKey, setMethodKey] = useState<string>(eligible[0]?.methodKey ?? "zelle");
  const [amount, setAmount] = useState("");
  const [fund, setFund] = useState("offering");
  const [note, setNote] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (eligible.length === 0) return null;

  async function submit() {
    if (!user) return;
    setSubmitting(true);
    setError(null);
    setStatus(null);
    try {
      const res = await fetch("/api/giving/hub/off-platform", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          methodKey,
          amount: Number(amount),
          fund,
          donorNote: note,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Could not notify Finance.");
        return;
      }
      setStatus(data.message ?? "Sent to Finance for matching.");
      setAmount("");
      setNote("");
    } catch {
      setError("Could not notify Finance.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="mb-10 rounded-2xl border border-night-900/8 bg-white/80 p-5 dark:border-white/10 dark:bg-[var(--color-bg-soft)]">
      <p className="text-xs font-semibold uppercase tracking-wide text-night-500 dark:text-sand-400">
        After you send Zelle or Cash App
      </p>
      <p className="mt-2 max-w-2xl text-sm text-night-600 dark:text-sand-300">
        Tell Finance what you sent so they can match it to your giving profile. This does not move
        money — you still complete payment in your bank or Cash App app first.
      </p>
      {!user ? (
        <p className="mt-3 text-sm text-night-600 dark:text-sand-300">
          <a href="/sign-in?next=/give" className="font-semibold underline">
            Sign in
          </a>{" "}
          to notify Finance.
        </p>
      ) : (
        <div className="mt-4 flex flex-col gap-3 sm:max-w-md">
          <select
            className="rounded-xl border border-night-900/10 bg-white px-3 py-2 text-sm dark:border-white/15 dark:bg-night-900"
            value={methodKey}
            onChange={(e) => setMethodKey(e.target.value)}
          >
            {eligible.map((m) => (
              <option key={m.id} value={m.methodKey}>
                {m.displayName}
              </option>
            ))}
          </select>
          <input
            type="number"
            min="1"
            step="0.01"
            placeholder="Amount (USD)"
            className="rounded-xl border border-night-900/10 bg-white px-3 py-2 text-sm dark:border-white/15 dark:bg-night-900"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
          <select
            className="rounded-xl border border-night-900/10 bg-white px-3 py-2 text-sm dark:border-white/15 dark:bg-night-900"
            value={fund}
            onChange={(e) => setFund(e.target.value)}
          >
            {GIVING_CHECKOUT_FUNDS.map((f) => (
              <option key={f.value} value={f.value}>
                {f.label}
              </option>
            ))}
          </select>
          <input
            type="text"
            placeholder="Optional note (confirmation, memo)"
            className="rounded-xl border border-night-900/10 bg-white px-3 py-2 text-sm dark:border-white/15 dark:bg-night-900"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            maxLength={500}
          />
          <Button type="button" onClick={() => void submit()} disabled={submitting || !amount}>
            {submitting ? "Sending…" : "Notify Finance"}
          </Button>
          {error ? <p className="text-sm text-red-600">{error}</p> : null}
          {status ? <p className="text-sm text-emerald-700 dark:text-emerald-400">{status}</p> : null}
        </div>
      )}
    </section>
  );
}
