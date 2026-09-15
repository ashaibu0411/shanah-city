"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { editorialPremium } from "@/components/app/editorial-premium";
import { Button } from "@/components/ui";
import type { RecurringGivingSubscriptionView } from "@/lib/giving-billing-server";
import { openExternalUrl } from "@/lib/native-app";
import { site } from "@/lib/site";

function formatMoney(amount: number, currency: string) {
  return amount.toLocaleString(undefined, { style: "currency", currency });
}

export function MemberRecurringGivingPanel() {
  const { user, loading } = useAuth();
  const [configured, setConfigured] = useState(false);
  const [subscriptions, setSubscriptions] = useState<RecurringGivingSubscriptionView[]>([]);
  const [fetching, setFetching] = useState(false);
  const [portalBusy, setPortalBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (loading || !user) return;

    setFetching(true);
    fetch("/api/giving/recurring", { cache: "no-store" })
      .then((response) => response.json())
      .then((data) => {
        if (data.error) {
          setMessage(data.error);
          return;
        }
        setConfigured(Boolean(data.configured));
        setSubscriptions(data.subscriptions ?? []);
      })
      .catch(() => {
        setMessage("Could not load recurring giving.");
      })
      .finally(() => setFetching(false));
  }, [user, loading]);

  async function openBillingPortal() {
    setPortalBusy(true);
    setMessage(null);
    try {
      const response = await fetch("/api/giving/billing-portal", { method: "POST" });
      const data = await response.json();
      if (!response.ok || !data.url) {
        setMessage(data.error ?? "Could not open giving management.");
        return;
      }
      await openExternalUrl(data.url);
    } catch {
      setMessage("Could not open giving management.");
    } finally {
      setPortalBusy(false);
    }
  }

  if (loading || !user) return null;

  return (
    <div className="mt-4 border-t border-night-900/8 pt-4 dark:border-white/10">
      <p className={editorialPremium.sectionLabel}>Recurring giving</p>
      <h3 className={editorialPremium.sectionTitle}>Manage your schedule</h3>
      <p className="mt-2 text-sm leading-relaxed text-night-600 dark:text-sand-300">
        Update amount, change payment method, or cancel a recurring gift in Stripe&apos;s secure
        customer portal. Sign in with the same email you used at checkout (
        <span className="font-semibold text-night-900 dark:text-sand-50">{user.email}</span>).
      </p>

      {fetching ? (
        <p className="mt-3 text-sm text-night-500">Checking recurring gifts…</p>
      ) : !configured ? (
        <p className="mt-3 text-sm text-night-600">
          Online recurring management is not available in this environment yet.
        </p>
      ) : subscriptions.length === 0 ? (
        <p className="mt-3 text-sm text-night-600">
          No active recurring gifts found for this account. If you set one up as a guest, sign in
          with that same email or contact{" "}
          <a
            href={`mailto:${site.giving.financeEmail}`}
            className="font-semibold text-night-900 underline dark:text-sand-100"
          >
            {site.giving.financeEmail}
          </a>
          .
        </p>
      ) : (
        <ul className="mt-4 space-y-3">
          {subscriptions.map((subscription) => (
            <li
              key={subscription.id}
              className="rounded-2xl border border-night-900/8 bg-white/80 px-4 py-3 dark:border-white/10 dark:bg-[var(--color-surface)]"
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="font-semibold text-night-950 dark:text-sand-50">
                    {formatMoney(subscription.amount, subscription.currency)}{" "}
                    <span className="text-sm font-medium text-night-500">
                      {subscription.frequencyLabel.toLowerCase()}
                    </span>
                  </p>
                  <p className="text-sm text-night-600 dark:text-sand-300">
                    {subscription.fundLabel} · {subscription.statusLabel}
                    {subscription.cancelAtPeriodEnd ? " · Cancels at period end" : ""}
                  </p>
                  {subscription.nextChargeLabel ? (
                    <p className="mt-1 text-xs text-night-500">{subscription.nextChargeLabel}</p>
                  ) : null}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      <div className="mt-4 flex flex-wrap gap-3">
        <Button
          variant="secondary"
          onClick={() => void openBillingPortal()}
          disabled={portalBusy || !configured}
        >
          {portalBusy ? "Opening…" : "Manage or cancel in Stripe"}
        </Button>
        <Button href="/give" variant="ghost" className="!px-0">
          Set up new gift
        </Button>
      </div>

      {message ? <p className="mt-3 text-sm text-amber-800">{message}</p> : null}
    </div>
  );
}
