"use client";

import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { AdminSubNav } from "@/components/admin/AdminSubNav";
import {
  emptyFinanceGrid,
  financeFundLabel,
  FINANCE_COUNT_FUNDS,
  FINANCE_COUNT_METHODS,
  mergeFinanceGrid,
  mostRecentSundayIso,
  sumFinanceLines,
  type FinanceCountCell,
  type FinanceWeeklySheet,
  type FinanceWeeklySummary,
} from "@/lib/finance-types";
import { Button, Card } from "@/components/ui";

function formatMoney(amount: number) {
  return amount.toLocaleString(undefined, { style: "currency", currency: "USD" });
}

function formatWeekLabel(weekEnding: string) {
  return new Date(`${weekEnding}T12:00:00`).toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

export function AdminFinancePanel() {
  const { permissions } = useAuth();
  const [weekEnding, setWeekEnding] = useState(mostRecentSundayIso());
  const [lines, setLines] = useState<FinanceCountCell[]>(emptyFinanceGrid());
  const [notes, setNotes] = useState("");
  const [status, setStatus] = useState<FinanceWeeklySheet["status"]>("draft");
  const [sheets, setSheets] = useState<FinanceWeeklySheet[]>([]);
  const [summary, setSummary] = useState<FinanceWeeklySummary | null>(null);
  const [reportSince, setReportSince] = useState(() => {
    const date = new Date();
    date.setDate(date.getDate() - 56);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
  });
  const [reportUntil, setReportUntil] = useState(mostRecentSundayIso());
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);

  const rowTotals = useMemo(() => {
    const totals: Record<string, number> = {};
    for (const fund of FINANCE_COUNT_FUNDS) {
      totals[fund.key] = lines
        .filter((cell) => cell.fund === fund.key)
        .reduce((sum, cell) => sum + cell.amount, 0);
    }
    return totals;
  }, [lines]);

  const columnTotals = useMemo(() => {
    const totals: Record<string, number> = {};
    for (const method of FINANCE_COUNT_METHODS) {
      totals[method.key] = lines
        .filter((cell) => cell.method === method.key)
        .reduce((sum, cell) => sum + cell.amount, 0);
    }
    return totals;
  }, [lines]);

  const grandTotal = useMemo(() => sumFinanceLines(lines), [lines]);

  function getCellAmount(fund: string, method: string) {
    return lines.find((cell) => cell.fund === fund && cell.method === method)?.amount ?? 0;
  }

  function setCellAmount(fund: string, method: string, value: string) {
    const amount = value === "" ? 0 : Number(value);
    setLines((current) =>
      mergeFinanceGrid(
        current.map((cell) =>
          cell.fund === fund && cell.method === method
            ? { ...cell, amount: Number.isFinite(amount) ? amount : 0 }
            : cell,
        ),
      ),
    );
  }

  async function loadWeek(targetWeek = weekEnding) {
    setLoading(true);
    const response = await fetch(
      `/api/admin/finance?weekEnding=${encodeURIComponent(targetWeek)}`,
    );
    const data = await response.json();
    setLoading(false);

    if (response.ok) {
      if (data.sheet) {
        setLines(mergeFinanceGrid(data.sheet.lines));
        setNotes(data.sheet.notes ?? "");
        setStatus(data.sheet.status);
      } else {
        setLines(emptyFinanceGrid());
        setNotes("");
        setStatus("draft");
      }
      setMessage(null);
    } else {
      setMessage(data.error ?? "Could not load weekly sheet.");
    }
  }

  async function loadReport() {
    const params = new URLSearchParams();
    if (reportSince) params.set("since", reportSince);
    if (reportUntil) params.set("until", reportUntil);
    const response = await fetch(`/api/admin/finance?${params.toString()}`);
    const data = await response.json();
    if (response.ok) {
      setSheets(data.sheets ?? []);
      setSummary(data.summary ?? null);
    }
  }

  useEffect(() => {
    loadWeek();
    loadReport();
  }, []);

  useEffect(() => {
    loadWeek(weekEnding);
  }, [weekEnding]);

  async function saveSheet(action: "save" | "submit") {
    setMessage(null);
    const response = await fetch("/api/admin/finance", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, weekEnding, lines, notes }),
    });
    const data = await response.json();

    if (response.ok) {
      setStatus(data.sheet.status);
      setMessage(
        action === "submit"
          ? `Week submitted — total ${formatMoney(data.sheet.totalAmount)}.`
          : "Draft saved.",
      );
      loadReport();
    } else {
      setMessage(data.error ?? "Could not save weekly sheet.");
    }
  }

  async function reopenWeek() {
    const response = await fetch("/api/admin/finance", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "reopen", weekEnding }),
    });
    const data = await response.json();
    if (response.ok) {
      setStatus("draft");
      setMessage("Week reopened for editing.");
      loadReport();
    } else {
      setMessage(data.error ?? "Could not reopen week.");
    }
  }

  function exportCsv() {
    const params = new URLSearchParams();
    if (reportSince) params.set("since", reportSince);
    if (reportUntil) params.set("until", reportUntil);
    params.set("format", "csv");
    window.location.href = `/api/admin/finance?${params.toString()}`;
  }

  return (
    <>
      <AdminSubNav />

      <Card className="mb-6">
        <h2 className="font-display text-xl font-semibold text-night-900">Weekly count sheet</h2>
        <p className="mt-1 text-sm text-night-600">
          Use the same grid every week: enter totals only (not individual donor names). Tab
          across cells, then submit when the count is complete.
        </p>

        <div className="mt-4 flex flex-wrap items-end gap-3">
          <label className="text-sm text-night-700">
            <span className="font-semibold">Week ending</span>
            <input
              type="date"
              value={weekEnding}
              onChange={(event) => setWeekEnding(event.target.value)}
              className="mt-1 block rounded-xl border border-night-900/10 bg-sand-50 px-3 py-2.5 text-sm outline-none ring-night-900/5 focus:ring-2"
            />
          </label>
          <p className="text-sm text-night-600">{formatWeekLabel(weekEnding)}</p>
          {status === "submitted" ? (
            <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-800">
              Submitted
            </span>
          ) : (
            <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-800">
              Draft
            </span>
          )}
        </div>

        {loading ? (
          <p className="mt-4 text-sm text-night-500">Loading sheet…</p>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="min-w-full border-collapse text-sm">
              <thead>
                <tr>
                  <th className="border border-night-900/10 bg-sand-50 px-3 py-2 text-left">
                    Fund
                  </th>
                  {FINANCE_COUNT_METHODS.map((method) => (
                    <th
                      key={method.key}
                      className="border border-night-900/10 bg-sand-50 px-3 py-2 text-left"
                    >
                      {method.label}
                    </th>
                  ))}
                  <th className="border border-night-900/10 bg-sand-50 px-3 py-2 text-left">
                    Row total
                  </th>
                </tr>
              </thead>
              <tbody>
                {FINANCE_COUNT_FUNDS.map((fund) => (
                  <tr key={fund.key}>
                    <td className="border border-night-900/10 px-3 py-2 font-medium text-night-900">
                      {fund.label}
                    </td>
                    {FINANCE_COUNT_METHODS.map((method) => (
                      <td key={method.key} className="border border-night-900/10 px-2 py-2">
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          inputMode="decimal"
                          disabled={status === "submitted"}
                          value={getCellAmount(fund.key, method.key) || ""}
                          onChange={(event) =>
                            setCellAmount(fund.key, method.key, event.target.value)
                          }
                          placeholder="0"
                          aria-label={`${fund.label} ${method.label}`}
                          className="w-full min-w-[88px] rounded-lg border border-night-900/10 bg-white px-2 py-1.5 text-sm outline-none ring-night-900/5 focus:ring-2 disabled:bg-sand-100"
                        />
                      </td>
                    ))}
                    <td className="border border-night-900/10 px-3 py-2 font-semibold text-night-900">
                      {formatMoney(rowTotals[fund.key] ?? 0)}
                    </td>
                  </tr>
                ))}
                <tr className="bg-sand-50/80">
                  <td className="border border-night-900/10 px-3 py-2 font-semibold text-night-900">
                    Column total
                  </td>
                  {FINANCE_COUNT_METHODS.map((method) => (
                    <td
                      key={method.key}
                      className="border border-night-900/10 px-3 py-2 font-semibold text-night-900"
                    >
                      {formatMoney(columnTotals[method.key] ?? 0)}
                    </td>
                  ))}
                  <td className="border border-night-900/10 px-3 py-2 font-display text-lg font-semibold text-night-900">
                    {formatMoney(grandTotal)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        )}

        <textarea
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
          disabled={status === "submitted"}
          placeholder="Notes for this week (optional)"
          className="mt-4 w-full rounded-xl border border-night-900/10 bg-sand-50 p-3 text-sm outline-none ring-night-900/5 focus:ring-2 disabled:bg-sand-100"
          rows={2}
        />

        <div className="mt-4 flex flex-wrap gap-2">
          <Button onClick={() => saveSheet("save")} disabled={status === "submitted"}>
            Save draft
          </Button>
          <Button
            variant="secondary"
            onClick={() => saveSheet("submit")}
            disabled={status === "submitted" || grandTotal <= 0}
          >
            Submit week
          </Button>
          {permissions.canManageAdmin && status === "submitted" && (
            <Button variant="secondary" onClick={reopenWeek}>
              Reopen week
            </Button>
          )}
        </div>
      </Card>

      <Card className="mb-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="font-display text-xl font-semibold text-night-900">Weekly report</h2>
            <p className="mt-1 text-sm text-night-600">
              Review submitted weeks and export a spreadsheet for leadership.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" onClick={loadReport}>
              Refresh report
            </Button>
            <Button variant="secondary" onClick={exportCsv}>
              Export CSV
            </Button>
          </div>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <input
            type="date"
            value={reportSince}
            onChange={(event) => setReportSince(event.target.value)}
            aria-label="Report from date"
            className="rounded-xl border border-night-900/10 bg-sand-50 px-3 py-2.5 text-sm outline-none ring-night-900/5 focus:ring-2"
          />
          <input
            type="date"
            value={reportUntil}
            onChange={(event) => setReportUntil(event.target.value)}
            aria-label="Report to date"
            className="rounded-xl border border-night-900/10 bg-sand-50 px-3 py-2.5 text-sm outline-none ring-night-900/5 focus:ring-2"
          />
        </div>

        {summary && (
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            <div className="rounded-xl bg-sand-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-night-500">
                Total in range
              </p>
              <p className="mt-1 font-display text-2xl font-semibold text-night-900">
                {formatMoney(summary.totalAmount)}
              </p>
              <p className="text-sm text-night-600">{summary.sheetCount} weeks</p>
            </div>
            <div className="rounded-xl bg-sand-50 p-4 md:col-span-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-night-500">
                By fund
              </p>
              <ul className="mt-2 space-y-1 text-sm text-night-700">
                {Object.entries(summary.byFund).length === 0 ? (
                  <li>No submitted weeks in this range.</li>
                ) : (
                  Object.entries(summary.byFund).map(([key, value]) => (
                    <li key={key} className="flex justify-between gap-3">
                      <span>{financeFundLabel(key)}</span>
                      <span className="font-semibold">{formatMoney(value)}</span>
                    </li>
                  ))
                )}
              </ul>
            </div>
          </div>
        )}

        <div className="mt-6 overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="text-xs uppercase tracking-wide text-night-500">
              <tr>
                <th className="py-2 pr-4">Week ending</th>
                <th className="py-2 pr-4">Status</th>
                <th className="py-2 pr-4">Total</th>
                <th className="py-2 pr-4">Submitted by</th>
              </tr>
            </thead>
            <tbody>
              {sheets.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-4 text-night-500">
                    No weekly sheets in this range yet.
                  </td>
                </tr>
              ) : (
                sheets.map((sheet) => (
                  <tr key={sheet.id} className="border-t border-night-900/5">
                    <td className="py-3 pr-4">
                      <button
                        type="button"
                        onClick={() => setWeekEnding(sheet.weekEnding)}
                        className="font-medium text-night-900 hover:underline"
                      >
                        {sheet.weekEnding}
                      </button>
                    </td>
                    <td className="py-3 pr-4 capitalize">{sheet.status}</td>
                    <td className="py-3 pr-4 font-semibold">{formatMoney(sheet.totalAmount)}</td>
                    <td className="py-3 pr-4 text-night-600">
                      {sheet.submittedByName ?? sheet.createdByName}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {message && (
        <p className="rounded-xl bg-sand-100 px-4 py-3 text-sm text-night-700">{message}</p>
      )}
    </>
  );
}
