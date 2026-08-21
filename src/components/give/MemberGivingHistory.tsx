"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/components/auth/AuthProvider";
import { Button, Card } from "@/components/ui";
import { getDenverWeekRange } from "@/lib/denver-time";
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

  useEffect(() => {
    if (loading || !user) return;

    setFetching(true);
    fetch("/api/giving/history")
      .then((response) => response.json())
      .then((data) => {
        if (data.records) {
          setRecords(data.records);
          setTotal(data.summary?.totalAmount ?? 0);
        }
      })
      .finally(() => setFetching(false));
  }, [user, loading]);

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
    <Card>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-display text-xl font-semibold text-night-900">Your giving</h2>
          <p className="mt-1 text-sm text-night-600">
            Gifts made through Shanah City online giving appear here automatically.
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

      {fetching ? (
        <p className="mt-4 text-sm text-night-500">Loading giving history…</p>
      ) : records.length === 0 ? (
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
  );
}
