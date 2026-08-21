"use client";

import { useEffect, useMemo, useState } from "react";
import {
  GIVING_FUND_OPTIONS,
  GIVING_METHOD_OPTIONS,
  fundLabel,
  methodLabel,
  type GivingRecord,
} from "@/lib/giving-types";
import type { AdminPeopleEntry } from "@/lib/member-types";
import { getDenverWeekRange } from "@/lib/denver-time";
import { campuses } from "@/lib/site";
import { GivingThankYouComposer } from "@/components/admin/GivingThankYouComposer";
import { Button, Card } from "@/components/ui";

function todayIso() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
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

const FINANCE_METHODS = GIVING_METHOD_OPTIONS.filter((option) =>
  ["zelle", "venmo", "cashapp", "paypal", "zeffy", "cash", "check", "in-person", "other"].includes(
    option.value,
  ),
);

export function FinanceGivingEntryPanel() {
  const [people, setPeople] = useState<AdminPeopleEntry[]>([]);
  const [records, setRecords] = useState<GivingRecord[]>([]);
  const [loadingRecords, setLoadingRecords] = useState(true);
  const [lastRefreshedAt, setLastRefreshedAt] = useState<Date | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [savedRecord, setSavedRecord] = useState<GivingRecord | null>(null);
  const [expandedRecordId, setExpandedRecordId] = useState<string | null>(null);

  const [memberId, setMemberId] = useState("");
  const [donorName, setDonorName] = useState("");
  const [donorEmail, setDonorEmail] = useState("");
  const [amount, setAmount] = useState("");
  const [fund, setFund] =
    useState<(typeof GIVING_FUND_OPTIONS)[number]["value"]>("tithe");
  const [method, setMethod] =
    useState<(typeof FINANCE_METHODS)[number]["value"]>("zelle");
  const [givenOn, setGivenOn] = useState(todayIso());
  const [campusId, setCampusId] = useState("colorado");
  const [notes, setNotes] = useState("");

  const weekRange = useMemo(() => getDenverWeekRange(), []);
  const selectedMember = useMemo(
    () => people.find((person) => person.id === memberId) ?? null,
    [people, memberId],
  );

  useEffect(() => {
    fetch("/api/admin/people")
      .then((response) => response.json())
      .then((data) => setPeople(data.people ?? []));
  }, []);

  useEffect(() => {
    if (selectedMember) {
      setDonorName(selectedMember.name);
      setDonorEmail(selectedMember.email);
      setCampusId(selectedMember.campusId);
    }
  }, [selectedMember]);

  async function loadRecentRecords(options?: { announce?: boolean }) {
    setLoadingRecords(true);
    const params = new URLSearchParams({
      since: weekRange.since,
      until: weekRange.until,
      _: String(Date.now()),
    });

    try {
      const response = await fetch(`/api/admin/giving?${params.toString()}`, {
        cache: "no-store",
      });
      const data = await response.json();

      if (response.ok) {
        const manualRecords = (data.records ?? []).filter(
          (record: GivingRecord) => record.source === "manual",
        );
        setRecords(manualRecords);
        setLastRefreshedAt(new Date());
        if (options?.announce) {
          setMessage(
            `Refreshed at ${formatRefreshTime(new Date())} — ${manualRecords.length} manual gift${manualRecords.length === 1 ? "" : "s"} this week.`,
          );
        }
      }
    } finally {
      setLoadingRecords(false);
    }
  }

  useEffect(() => {
    loadRecentRecords();
  }, [weekRange.since, weekRange.until]);

  async function saveGift() {
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

    if (!response.ok) {
      setMessage(data.error ?? "Could not save giving record.");
      return;
    }

    setSavedRecord(data.record);
    setExpandedRecordId(data.record.id);
    setMessage(`Saved ${formatMoney(data.record.amount)} for ${data.record.donorName}. Review the thank-you below, then click Send.`);
    setAmount("");
    setNotes("");
    if (!memberId) {
      setDonorName("");
      setDonorEmail("");
    }
    loadRecentRecords();
  }

  function updateRecordInList(record: GivingRecord) {
    setRecords((current) => current.map((entry) => (entry.id === record.id ? record : entry)));
    if (savedRecord?.id === record.id) {
      setSavedRecord(record);
    }
  }

  return (
    <Card className="mb-6">
      <h2 className="font-display text-xl font-semibold text-night-900">Per-person gifts</h2>
      <p className="mt-1 text-sm text-night-600">
        Zelle, Cash App, Venmo, cash, and check gifts are entered here and matched to each member.
        Stripe card giving still records automatically. After saving, review the personalized
        thank-you and click Send when ready.
      </p>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <label className="text-sm text-night-700 sm:col-span-2">
          <span className="font-semibold">Member profile</span>
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
          type="email"
          value={donorEmail}
          onChange={(event) => setDonorEmail(event.target.value)}
          placeholder="Donor email"
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
          {FINANCE_METHODS.map((option) => (
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

      <Button className="mt-4" onClick={saveGift}>
        Save gift
      </Button>

      {message && (
        <p className="mt-4 rounded-xl bg-sand-100 px-4 py-3 text-sm text-night-700">{message}</p>
      )}

      {savedRecord && (
        <GivingThankYouComposer
          record={savedRecord}
          onSent={updateRecordInList}
        />
      )}

      <div className="mt-8">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h3 className="font-display text-lg font-semibold text-night-900">
              This week&apos;s manual gifts
            </h3>
            <p className="mt-1 text-xs text-night-500">
              {weekRange.since} – {weekRange.until} (Denver)
              {lastRefreshedAt
                ? ` · Updated ${formatRefreshTime(lastRefreshedAt)}${loadingRecords ? " · refreshing…" : ""}`
                : ""}
            </p>
          </div>
          <Button
            variant="secondary"
            onClick={() => loadRecentRecords({ announce: true })}
            disabled={loadingRecords}
          >
            {loadingRecords ? "Refreshing…" : "Refresh"}
          </Button>
        </div>

        {loadingRecords ? (
          <p className="mt-4 text-sm text-night-500">Loading gifts…</p>
        ) : records.length === 0 ? (
          <p className="mt-4 text-sm text-night-500">No manual gifts recorded this week yet.</p>
        ) : (
          <div className="mt-4 space-y-3">
            {records.map((record) => (
              <div
                key={record.id}
                className="rounded-xl border border-night-900/10 bg-white p-4"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-night-900">
                      {record.donorName} · {formatMoney(record.amount)}
                    </p>
                    <p className="mt-1 text-sm text-night-600">
                      {record.givenOn} · {fundLabel(record.fund)} · {methodLabel(record.method)}
                    </p>
                    {record.thankYouSentAt ? (
                      <p className="mt-1 text-xs font-semibold text-emerald-700">
                        Thank-you sent
                      </p>
                    ) : (
                      <p className="mt-1 text-xs font-semibold text-amber-700">
                        Thank-you not sent yet
                      </p>
                    )}
                  </div>
                  <Button
                    variant="secondary"
                    onClick={() =>
                      setExpandedRecordId((current) =>
                        current === record.id ? null : record.id,
                      )
                    }
                  >
                    {expandedRecordId === record.id ? "Hide thank-you" : "Send thank-you"}
                  </Button>
                </div>

                {expandedRecordId === record.id && (
                  <GivingThankYouComposer
                    compact
                    record={record}
                    onSent={updateRecordInList}
                  />
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </Card>
  );
}
