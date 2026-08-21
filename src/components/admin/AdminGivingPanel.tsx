"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { GivingThankYouComposer } from "@/components/admin/GivingThankYouComposer";
import { AdminSubNav } from "@/components/admin/AdminSubNav";
import {
  fundLabel,
  GIVING_FUND_OPTIONS,
  GIVING_METHOD_OPTIONS,
  methodLabel,
  type GivingRecord,
  type GivingReportSummary,
} from "@/lib/giving-types";
import type { AdminPeopleEntry } from "@/lib/member-types";
import { getDenverWeekRange } from "@/lib/denver-time";
import { campuses } from "@/lib/site";
import { Button, Card } from "@/components/ui";

function todayIso() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

function monthStartIso() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
}

function formatMoney(amount: number) {
  return amount.toLocaleString(undefined, { style: "currency", currency: "USD" });
}

function formatRefreshTime(date: Date) {
  return date.toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });
}

export function AdminGivingPanel() {
  const searchParams = useSearchParams();
  const initialMemberId = searchParams.get("member") ?? "";
  const [records, setRecords] = useState<GivingRecord[]>([]);
  const [summary, setSummary] = useState<GivingReportSummary | null>(null);
  const [people, setPeople] = useState<AdminPeopleEntry[]>([]);
  const [since, setSince] = useState(monthStartIso());
  const [until, setUntil] = useState(todayIso());
  const [fundFilter, setFundFilter] = useState("");
  const [donorEmailFilter, setDonorEmailFilter] = useState("");
  const [guestsOnly, setGuestsOnly] = useState(false);
  const [sendingStatement, setSendingStatement] = useState(false);
  const [loading, setLoading] = useState(true);
  const [lastRefreshedAt, setLastRefreshedAt] = useState<Date | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const [memberId, setMemberId] = useState(initialMemberId);
  const [donorName, setDonorName] = useState("");
  const [donorEmail, setDonorEmail] = useState("");
  const [amount, setAmount] = useState("");
  const [fund, setFund] = useState<(typeof GIVING_FUND_OPTIONS)[number]["value"]>("tithe");
  const [method, setMethod] =
    useState<(typeof GIVING_METHOD_OPTIONS)[number]["value"]>("cash");
  const [givenOn, setGivenOn] = useState(todayIso());
  const [campusId, setCampusId] = useState("colorado");
  const [notes, setNotes] = useState("");
  const [savedRecord, setSavedRecord] = useState<GivingRecord | null>(null);
  const [expandedThankYouId, setExpandedThankYouId] = useState<string | null>(null);

  const selectedMember = useMemo(
    () => people.find((person) => person.id === memberId) ?? null,
    [people, memberId],
  );

  useEffect(() => {
    if (selectedMember) {
      setDonorName(selectedMember.name);
      setDonorEmail(selectedMember.email);
      setCampusId(selectedMember.campusId);
    }
  }, [selectedMember]);

  async function loadRecords(options?: { announce?: boolean }) {
    setLoading(true);
    const params = new URLSearchParams();
    if (since) params.set("since", since);
    if (until) params.set("until", until);
    if (fundFilter) params.set("fund", fundFilter);
    if (donorEmailFilter.trim()) params.set("donorEmail", donorEmailFilter.trim());
    if (guestsOnly) params.set("guestsOnly", "1");
    params.set("_", String(Date.now()));

    try {
      const response = await fetch(`/api/admin/giving?${params.toString()}`, {
        cache: "no-store",
      });
      const data = await response.json();

      if (response.ok) {
        setRecords(data.records ?? []);
        setSummary(data.summary ?? null);
        setLastRefreshedAt(new Date());
        if (options?.announce) {
          const count = data.summary?.count ?? 0;
          const total = data.summary?.totalAmount ?? 0;
          setMessage(
            `Refreshed at ${formatRefreshTime(new Date())} — ${count} gift${count === 1 ? "" : "s"} (${formatMoney(total)}) in this range.`,
          );
        }
      } else {
        setMessage(data.error ?? "Could not load giving records.");
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (initialMemberId) {
      setMemberId(initialMemberId);
    }
  }, [initialMemberId]);

  useEffect(() => {
    fetch("/api/admin/people")
      .then((response) => response.json())
      .then((data) => setPeople(data.people ?? []));
  }, []);

  useEffect(() => {
    loadRecords();
  }, [since, until, fundFilter, donorEmailFilter, guestsOnly]);

  async function addRecord() {
    setMessage(null);
    setSavedRecord(null);
    const response = await fetch("/api/admin/giving", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId: memberId || undefined,
        donorName,
        donorEmail: donorEmail || undefined,
        amount: Number(amount),
        fund,
        method,
        givenOn,
        campusId,
        notes: notes || undefined,
      }),
    });
    const data = await response.json();

    if (response.ok) {
      setSavedRecord(data.record);
      setExpandedThankYouId(data.record.id);
      setMessage(
        `Recorded ${formatMoney(data.record.amount)} from ${data.record.donorName}. Review the thank-you below, then click Send.`,
      );
      setAmount("");
      setNotes("");
      if (!memberId) {
        setDonorName("");
        setDonorEmail("");
      }
      loadRecords();
    } else {
      setMessage(data.error ?? "Could not save giving record.");
    }
  }

  async function removeRecord(id: string) {
    const response = await fetch("/api/admin/giving", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });

    if (response.ok) {
      loadRecords();
    } else {
      const data = await response.json();
      setMessage(data.error ?? "Could not delete record.");
    }
  }

  function applyThisWeek() {
    const { since: weekSince, until: weekUntil } = getDenverWeekRange();
    setSince(weekSince);
    setUntil(weekUntil);
  }

  function applyThisMonth() {
    setSince(monthStartIso());
    setUntil(todayIso());
  }

  function exportCsv() {
    const params = new URLSearchParams();
    if (since) params.set("since", since);
    if (until) params.set("until", until);
    if (fundFilter) params.set("fund", fundFilter);
    if (donorEmailFilter.trim()) params.set("donorEmail", donorEmailFilter.trim());
    if (guestsOnly) params.set("guestsOnly", "1");
    params.set("format", "csv");
    window.location.href = `/api/admin/giving?${params.toString()}`;
  }

  async function emailGuestStatement() {
    if (!donorEmailFilter.trim()) {
      setMessage("Enter a donor email above to email a guest statement.");
      return;
    }

    setSendingStatement(true);
    setMessage(null);

    const response = await fetch("/api/admin/giving/guest-statement", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        donorEmail: donorEmailFilter.trim(),
        since: since || undefined,
        until: until || undefined,
      }),
    });
    const data = await response.json();
    setSendingStatement(false);

    if (response.ok) {
      setMessage(
        `Emailed giving statement to ${donorEmailFilter.trim()} (${data.giftCount} gift${data.giftCount === 1 ? "" : "s"}, ${formatMoney(data.totalAmount)}).`,
      );
    } else {
      setMessage(data.error ?? "Could not email guest statement.");
    }
  }

  return (
    <>
      <AdminSubNav />

      <Card className="mb-6">
        <h2 className="font-display text-xl font-semibold text-night-900">Record a gift</h2>
        <p className="mt-1 text-sm text-night-600">
          Log cash, check, Zelle, Venmo, PayPal, Cash App, Zeffy, and other gifts. Link a
          member profile when the donor
          has an account, or enter a guest name.
        </p>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <label className="text-sm text-night-700 sm:col-span-2">
            <span className="font-semibold">Link to member (optional)</span>
            <select
              value={memberId}
              onChange={(event) => setMemberId(event.target.value)}
              className="mt-1 w-full rounded-xl border border-night-900/10 bg-sand-50 px-3 py-2.5 text-sm outline-none ring-night-900/5 focus:ring-2"
            >
              <option value="">Guest / not in directory</option>
              {people.map((person) => (
                <option key={person.id} value={person.id}>
                  {person.name} · {person.email}
                </option>
              ))}
            </select>
          </label>
          <input
            value={donorName}
            onChange={(event) => setDonorName(event.target.value)}
            placeholder="Donor name"
            className="rounded-xl border border-night-900/10 bg-sand-50 px-3 py-2.5 text-sm outline-none ring-night-900/5 focus:ring-2"
          />
          <input
            value={donorEmail}
            onChange={(event) => setDonorEmail(event.target.value)}
            placeholder="Donor email (optional — used for guest reports & thank-yous)"
            className="rounded-xl border border-night-900/10 bg-sand-50 px-3 py-2.5 text-sm outline-none ring-night-900/5 focus:ring-2"
          />
          <input
            type="number"
            min="0"
            step="0.01"
            value={amount}
            onChange={(event) => setAmount(event.target.value)}
            placeholder="Amount (USD)"
            className="rounded-xl border border-night-900/10 bg-sand-50 px-3 py-2.5 text-sm outline-none ring-night-900/5 focus:ring-2"
          />
          <input
            type="date"
            value={givenOn}
            onChange={(event) => setGivenOn(event.target.value)}
            className="rounded-xl border border-night-900/10 bg-sand-50 px-3 py-2.5 text-sm outline-none ring-night-900/5 focus:ring-2"
          />
          <select
            value={fund}
            onChange={(event) => setFund(event.target.value as typeof fund)}
            className="rounded-xl border border-night-900/10 bg-sand-50 px-3 py-2.5 text-sm outline-none ring-night-900/5 focus:ring-2"
          >
            {GIVING_FUND_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <select
            value={method}
            onChange={(event) => setMethod(event.target.value as typeof method)}
            className="rounded-xl border border-night-900/10 bg-sand-50 px-3 py-2.5 text-sm outline-none ring-night-900/5 focus:ring-2"
          >
            {GIVING_METHOD_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <select
            value={campusId}
            onChange={(event) => setCampusId(event.target.value)}
            className="rounded-xl border border-night-900/10 bg-sand-50 px-3 py-2.5 text-sm outline-none ring-night-900/5 focus:ring-2"
          >
            {campuses.map((campus) => (
              <option key={campus.id} value={campus.id}>
                {campus.name}
              </option>
            ))}
            <option value="online">Online</option>
          </select>
          <input
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            placeholder="Notes (optional)"
            className="rounded-xl border border-night-900/10 bg-sand-50 px-3 py-2.5 text-sm outline-none ring-night-900/5 focus:ring-2 sm:col-span-2"
          />
        </div>

        <Button className="mt-4" onClick={addRecord}>
          Save giving record
        </Button>

        {savedRecord && (
          <GivingThankYouComposer
            record={savedRecord}
            onSent={(record) => {
              setRecords((current) =>
                current.map((entry) => (entry.id === record.id ? record : entry)),
              );
              setSavedRecord(record);
            }}
          />
        )}
      </Card>

      <Card className="mb-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="font-display text-xl font-semibold text-night-900">Report</h2>
            <p className="mt-1 text-sm text-night-600">
              Filter by date range, fund, or guest donor email. Export CSV or email a guest
              statement when an email is entered.
            </p>
            {lastRefreshedAt && (
              <p className="mt-1 text-xs text-night-500">
                Last updated {formatRefreshTime(lastRefreshedAt)}
                {loading ? " · refreshing…" : ""}
              </p>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" onClick={applyThisWeek}>
              This week
            </Button>
            <Button variant="secondary" onClick={applyThisMonth}>
              This month
            </Button>
            <Button variant="secondary" onClick={() => loadRecords({ announce: true })} disabled={loading}>
              {loading ? "Refreshing…" : "Refresh"}
            </Button>
            <Button variant="secondary" onClick={exportCsv}>
              Export CSV
            </Button>
            <Button
              variant="secondary"
              onClick={emailGuestStatement}
              disabled={sendingStatement || !donorEmailFilter.trim()}
            >
              {sendingStatement ? "Sending…" : "Email guest statement"}
            </Button>
          </div>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <input
            type="date"
            value={since}
            onChange={(event) => setSince(event.target.value)}
            aria-label="From date"
            className="rounded-xl border border-night-900/10 bg-sand-50 px-3 py-2.5 text-sm outline-none ring-night-900/5 focus:ring-2"
          />
          <input
            type="date"
            value={until}
            onChange={(event) => setUntil(event.target.value)}
            aria-label="To date"
            className="rounded-xl border border-night-900/10 bg-sand-50 px-3 py-2.5 text-sm outline-none ring-night-900/5 focus:ring-2"
          />
          <select
            value={fundFilter}
            onChange={(event) => setFundFilter(event.target.value)}
            className="rounded-xl border border-night-900/10 bg-sand-50 px-3 py-2.5 text-sm outline-none ring-night-900/5 focus:ring-2"
          >
            <option value="">All funds</option>
            {GIVING_FUND_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <input
            type="email"
            value={donorEmailFilter}
            onChange={(event) => setDonorEmailFilter(event.target.value)}
            placeholder="Guest donor email"
            className="rounded-xl border border-night-900/10 bg-sand-50 px-3 py-2.5 text-sm outline-none ring-night-900/5 focus:ring-2"
          />
          <label className="flex items-center gap-2 rounded-xl border border-night-900/10 bg-sand-50 px-3 py-2.5 text-sm text-night-700">
            <input
              type="checkbox"
              checked={guestsOnly}
              onChange={(event) => setGuestsOnly(event.target.checked)}
            />
            Guests only
          </label>
        </div>

        {summary && summary.count === 0 && !loading ? (
          <p className="mt-4 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-900">
            No gifts in this date range. If you just tested Stripe, widen the &ldquo;To&rdquo; date
            (evening gifts use Denver time) or click Refresh.
          </p>
        ) : null}

        {summary && (
          <div
            className={`mt-6 grid gap-4 md:grid-cols-3 transition-opacity ${loading ? "opacity-50" : "opacity-100"}`}
          >
            <div className="rounded-xl bg-sand-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-night-500">
                Total
              </p>
              <p className="mt-1 font-display text-2xl font-semibold text-night-900">
                {formatMoney(summary.totalAmount)}
              </p>
              <p className="text-sm text-night-600">{summary.count} gifts</p>
            </div>
            <div className="rounded-xl bg-sand-50 p-4 md:col-span-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-night-500">
                By fund
              </p>
              <ul className="mt-2 space-y-1 text-sm text-night-700">
                {Object.keys(summary.byFund).length === 0 ? (
                  <li>No gifts in this range.</li>
                ) : (
                  Object.entries(summary.byFund).map(([key, value]) => (
                    <li key={key} className="flex justify-between gap-3">
                      <span>{fundLabel(key)}</span>
                      <span className="font-semibold">{formatMoney(value)}</span>
                    </li>
                  ))
                )}
              </ul>
            </div>
          </div>
        )}
      </Card>

      {message && (
        <p className="mb-4 rounded-xl bg-sand-100 px-4 py-3 text-sm text-night-700">{message}</p>
      )}

      <Card className={loading ? "opacity-60 transition-opacity" : "transition-opacity"}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-display text-xl font-semibold text-night-900">Recorded gifts</h2>
          {lastRefreshedAt && (
            <p className="text-xs text-night-500">
              {loading ? "Refreshing…" : `Updated ${formatRefreshTime(lastRefreshedAt)}`}
            </p>
          )}
        </div>
        {loading && records.length > 0 ? (
          <p className="mt-4 text-sm text-night-500">Refreshing records…</p>
        ) : loading ? (
          <p className="mt-4 text-sm text-night-500">Loading records…</p>
        ) : records.length === 0 ? (
          <p className="mt-4 text-sm text-night-500">No giving records in this date range.</p>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="text-xs uppercase tracking-wide text-night-500">
                <tr>
                  <th className="py-2 pr-4">Date</th>
                  <th className="py-2 pr-4">Donor</th>
                  <th className="py-2 pr-4">Amount</th>
                  <th className="py-2 pr-4">Fund</th>
                  <th className="py-2 pr-4">Method</th>
                  <th className="py-2 pr-4">Notes</th>
                  <th className="py-2 pr-4">Thank-you</th>
                  <th className="py-2 pr-4"></th>
                </tr>
              </thead>
              <tbody>
                {records.map((record) => (
                  <tr key={record.id} className="border-t border-night-900/5">
                    <td className="py-3 pr-4 text-night-600">{record.givenOn}</td>
                    <td className="py-3 pr-4">
                      <p className="font-medium text-night-900">{record.donorName}</p>
                      {record.donorEmail && (
                        <p className="text-xs text-night-500">{record.donorEmail}</p>
                      )}
                      {!record.userId && (
                        <p className="text-xs font-semibold text-amber-700">Guest</p>
                      )}
                    </td>
                    <td className="py-3 pr-4 font-semibold text-night-900">
                      {formatMoney(record.amount)}
                    </td>
                    <td className="py-3 pr-4 text-night-600">{fundLabel(record.fund)}</td>
                    <td className="py-3 pr-4 text-night-600">{methodLabel(record.method)}</td>
                    <td className="py-3 pr-4 text-night-600">{record.notes ?? "—"}</td>
                    <td className="py-3 pr-4">
                      {record.thankYouSentAt ? (
                        <span className="text-xs font-semibold text-emerald-700">Sent</span>
                      ) : (
                        <span className="text-xs font-semibold text-amber-700">Pending</span>
                      )}
                      <button
                        type="button"
                        onClick={() =>
                          setExpandedThankYouId((current) =>
                            current === record.id ? null : record.id,
                          )
                        }
                        className="mt-1 block text-sm text-night-900 hover:underline"
                      >
                        {expandedThankYouId === record.id ? "Hide" : "Send"}
                      </button>
                      {expandedThankYouId === record.id && (
                        <div className="mt-3 min-w-[20rem]">
                          <GivingThankYouComposer
                            compact
                            record={record}
                            onSent={(updated) =>
                              setRecords((current) =>
                                current.map((entry) =>
                                  entry.id === updated.id ? updated : entry,
                                ),
                              )
                            }
                          />
                        </div>
                      )}
                    </td>
                    <td className="py-3 pr-4">
                      <button
                        type="button"
                        onClick={() => removeRecord(record.id)}
                        className="text-sm text-red-600 hover:underline"
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </>
  );
}
