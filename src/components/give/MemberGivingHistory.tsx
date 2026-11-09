"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/components/auth/AuthProvider";
import { Button, Card } from "@/components/ui";
import { MemberRecurringGivingPanel } from "@/components/give/MemberRecurringGivingPanel";
import { getDenverWeekRange } from "@/lib/denver-time";
import { GIVING_HISTORY_AFTER_AUTH_POLL_MS } from "@/lib/giving-history-client";
import type { GivingRecord } from "@/lib/giving-types";

function formatMoney(amount: number) {
  return amount.toLocaleString(undefined, { style: "currency", currency: "USD" });
}

type HistoryRecord = GivingRecord & { fundLabel: string };

export function MemberGivingHistory() {
  const { user, loading } = useAuth();
  const [records, setRecords] = useState<HistoryRecord[]>([]);
  const [total, setTotal] = useState(0);
  const [fetching, setFetching] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const loadHistory = useCallback(() => {
    if (!user) return;

    setFetching(true);
    setLoadError(null);
    fetch("/api/giving/history", { cache: "no-store", credentials: "include" })
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) {
          setLoadError(data.error ?? "Could not load giving history.");
          return;
        }
        if (data.records) {
          setRecords(data.records);
          setTotal(data.summary?.totalAmount ?? 0);
          setLoadError(null);
        }
        const recovered =
          (data.stripeSync?.recorded ?? 0) + (data.stripeSync?.linked ?? 0);
        if (recovered > 0) {
          window.sessionStorage.removeItem("giving-history-refresh");
        }
      })
      .catch(() => {
        setLoadError(
          "Could not refresh giving history. Your last loaded records are still shown.",
        );
      })
      .finally(() => setFetching(false));
  }, [user]);

  useEffect(() => {
    if (loading || !user) return;
    loadHistory();
  }, [user, loading, loadHistory]);

  useEffect(() => {
    if (!user) return;

    function onVisible() {
      if (document.visibilityState === "visible") {
        loadHistory();
      }
    }

    function onFocus() {
      loadHistory();
    }

    const refreshStamp = window.sessionStorage.getItem("giving-history-refresh");
    if (refreshStamp) {
      loadHistory();
    }

    const pollTimers = refreshStamp
      ? GIVING_HISTORY_AFTER_AUTH_POLL_MS.map((delayMs) =>
          window.setTimeout(() => {
            if (window.sessionStorage.getItem("giving-history-refresh")) {
              loadHistory();
            }
          }, delayMs),
        )
      : [];

    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("focus", onFocus);
    return () => {
      pollTimers.forEach((timer) => window.clearTimeout(timer));
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("focus", onFocus);
    };
  }, [user, loadHistory]);

  const { since: weekSince, until: weekUntil } = getDenverWeekRange();
  const weekTotal = useMemo(
    () =>
      records
        .filter((record) => record.givenOn >= weekSince && record.givenOn <= weekUntil)
        .reduce((sum, record) => sum + record.amount, 0),
    [records, weekSince, weekUntil],
  );

  if (loading || !user) return null;

  return (
    <div id="your-giving">
    <Card>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-display text-xl font-semibold text-night-900">Your giving</h2>
          <p className="mt-1 text-sm text-night-600">
            Gifts made through Shanah City online giving appear here automatically. Past guest
            gifts linked to your email show up after you sign up or sign in.
          </p>
        </div>
        <Button href="/give" variant="secondary">
          Give again
        </Button>
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl bg-sand-50 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-night-500">
            This week
          </p>
          <p className="mt-1 font-display text-2xl font-semibold text-night-900">
            {formatMoney(weekTotal)}
          </p>
          <p className="text-xs text-night-500">
            {weekSince} – {weekUntil} (Denver)
          </p>
        </div>
        <div className="rounded-xl bg-sand-50 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-night-500">
            Total recorded
          </p>
          <p className="mt-1 font-display text-2xl font-semibold text-night-900">
            {formatMoney(total)}
          </p>
        </div>
      </div>

      <MemberRecurringGivingPanel />

      {loadError ? (
        <p className="mt-4 text-sm text-rose-700">{loadError}</p>
      ) : null}

      {fetching ? (
        <p className="mt-4 text-sm text-night-500">Loading giving history…</p>
      ) : records.length === 0 && !loadError ? (
        <p className="mt-4 text-sm text-night-600">
          No gifts recorded yet.{" "}
          <Link href="/give" className="font-semibold text-night-900 underline">
            Give online
          </Link>
          .
        </p>
      ) : (
        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="text-xs uppercase tracking-wide text-night-500">
              <tr>
                <th className="py-2 pr-4">Date</th>
                <th className="py-2 pr-4">Fund</th>
                <th className="py-2 pr-4">Amount</th>
                <th className="py-2 pr-4">Method</th>
              </tr>
            </thead>
            <tbody>
              {records.slice(0, 12).map((record) => (
                <tr key={record.id} className="border-t border-night-900/5">
                  <td className="py-3 pr-4">{record.givenOn}</td>
                  <td className="py-3 pr-4">{record.fundLabel}</td>
                  <td className="py-3 pr-4 font-semibold">{formatMoney(record.amount)}</td>
                  <td className="py-3 pr-4 capitalize text-night-600">
                    {record.source === "stripe" ? "Online" : record.method.replace("-", " ")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
    </div>
  );
}
