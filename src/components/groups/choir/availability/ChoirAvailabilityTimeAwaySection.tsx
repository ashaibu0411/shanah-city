"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { choirAvailabilityTimeAwayHref } from "@/lib/choir-availability-links";
import type { UnavailabilityRequest } from "@/lib/member-types";
import {
  TIME_AWAY_REASON_OPTIONS,
  formatAmericanDateRange,
  formatTimeAwayReason,
  getDenverTodayDateKey,
  isIsoDateInRange,
  personNamesMatch,
  type TimeAwayReasonId,
} from "@/lib/unavailability-dates";

type ChoirAvailabilityTimeAwaySectionProps = {
  groupId: string;
  /** Summary on Availability home; full form on Time Away tab. */
  compact?: boolean;
};

function statusBadgeClass(status: UnavailabilityRequest["status"]) {
  if (status === "approved") return "choir-avail-status-available";
  if (status === "rejected") return "choir-avail-status-unavailable";
  return "choir-avail-status-pending";
}

function statusLabel(status: UnavailabilityRequest["status"]) {
  if (status === "approved") return "Approved";
  if (status === "rejected") return "Not approved";
  return "Pending review";
}

export function ChoirAvailabilityTimeAwaySection({
  groupId,
  compact = false,
}: ChoirAvailabilityTimeAwaySectionProps) {
  const { user } = useAuth();
  const [requests, setRequests] = useState<UnavailabilityRequest[]>([]);
  const [canReview, setCanReview] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [reasonType, setReasonType] = useState<TimeAwayReasonId>("vacation");
  const [reasonDetails, setReasonDetails] = useState("");
  const [submitBusy, setSubmitBusy] = useState(false);
  const [formMessage, setFormMessage] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    setLoadError(null);
    fetch("/api/unavailability?group=choir", { credentials: "include" })
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) {
          setLoadError(data.error ?? "Could not load time away requests.");
          setRequests([]);
          setCanReview(false);
        } else {
          setRequests(data.requests ?? []);
          setCanReview(Boolean(data.canReview));
        }
        setLoading(false);
      })
      .catch(() => {
        setLoadError("Could not load time away requests.");
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const todayKey = getDenverTodayDateKey();

  const myRequests = useMemo(() => {
    if (!user) return [];
    return requests
      .filter((item) => personNamesMatch(item.personName, user.name))
      .sort((a, b) => b.startDate.localeCompare(a.startDate));
  }, [requests, user]);

  const activeAway = useMemo(() => {
    return myRequests.find(
      (item) =>
        (item.status === "approved" || item.status === "pending") &&
        isIsoDateInRange(todayKey, item.startDate, item.endDate),
    );
  }, [myRequests, todayKey]);

  const teamApproved = useMemo(() => {
    return requests
      .filter(
        (item) =>
          item.status === "approved" &&
          (!user || !personNamesMatch(item.personName, user.name)),
      )
      .sort((a, b) => a.startDate.localeCompare(b.startDate));
  }, [requests, user]);

  const pendingForReview = useMemo(
    () => requests.filter((item) => item.status === "pending"),
    [requests],
  );

  async function submit() {
    if (!user) return;
    setSubmitBusy(true);
    setFormMessage(null);
    const reason = formatTimeAwayReason(reasonType, reasonDetails);
    const response = await fetch("/api/unavailability", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        startDate,
        endDate,
        reason,
        group: "choir",
      }),
    });
    const data = await response.json();
    setSubmitBusy(false);
    if (!response.ok) {
      setFormMessage(data.error ?? "Could not submit request.");
      return;
    }
    setFormMessage("Request submitted. Worship leadership will review it.");
    setStartDate("");
    setEndDate("");
    setReasonDetails("");
    setReasonType("vacation");
    load();
  }

  async function review(id: string, status: "approved" | "rejected") {
    await fetch("/api/unavailability", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ action: "review", id, status }),
    });
    load();
  }

  const signInNext = choirAvailabilityTimeAwayHref(groupId);
  const showForm = !compact || !loading;

  return (
    <section
      id="choir-avail-time-away"
      className="choir-card p-4 scroll-mt-24"
      aria-labelledby="choir-avail-time-away-heading"
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h2 id="choir-avail-time-away-heading" className="choir-song-section-title">
            {compact ? "Time away" : "Request time off"}
          </h2>
          <p className="mt-1 text-sm text-[var(--choir-muted)]">
            Dates use the U.S. calendar in <strong>Mountain Time</strong>. This is for vacation, sick leave, or travel —
            not the same as marking a single service &quot;unavailable&quot; above.
          </p>
        </div>
        {compact ? (
          <Link href={signInNext} className="choir-song-see-all shrink-0">
            Open form
          </Link>
        ) : null}
      </div>

      {activeAway ? (
        <div className="choir-avail-away-banner mt-3">
          <p className="text-sm font-bold text-[var(--choir-heading)]">You are marked away today</p>
          <p className="text-xs text-[var(--choir-body)]">
            {formatAmericanDateRange(activeAway.startDate, activeAway.endDate)} · {activeAway.reason}
            {activeAway.status === "pending" ? " (pending approval)" : ""}
          </p>
        </div>
      ) : null}

      {loading ? <p className="mt-3 text-sm text-[var(--choir-muted)]">Loading…</p> : null}
      {loadError ? (
        <div className="mt-3">
          <p className="text-sm text-red-700">{loadError}</p>
          <button type="button" className="choir-setlist-manage-link mt-2" onClick={load}>
            Retry
          </button>
        </div>
      ) : null}

      {!loading && !user ? (
        <p className="mt-3 text-sm text-[var(--choir-body)]">
          Sign in to request time away.{" "}
          <a href={`/sign-in?next=${encodeURIComponent(signInNext)}`} className="font-semibold underline">
            Sign in
          </a>
        </p>
      ) : null}

      {user && !loading && !loadError && showForm && !compact ? (
        <form
          className="choir-avail-time-away-form mt-4"
          onSubmit={(event) => {
            event.preventDefault();
            submit();
          }}
        >
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label htmlFor="choir-away-start" className="choir-avail-field-label">
                First day away
              </label>
              <input
                id="choir-away-start"
                type="date"
                className="choir-setlist-search w-full"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                required
              />
            </div>
            <div>
              <label htmlFor="choir-away-end" className="choir-avail-field-label">
                Last day away
              </label>
              <input
                id="choir-away-end"
                type="date"
                className="choir-setlist-search w-full"
                value={endDate}
                min={startDate || undefined}
                onChange={(e) => setEndDate(e.target.value)}
                required
              />
            </div>
          </div>
          <div className="mt-3">
            <label htmlFor="choir-away-type" className="choir-avail-field-label">
              Type of time off
            </label>
            <select
              id="choir-away-type"
              className="choir-setlist-search w-full"
              value={reasonType}
              onChange={(e) => setReasonType(e.target.value as TimeAwayReasonId)}
            >
              {TIME_AWAY_REASON_OPTIONS.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          <div className="mt-3">
            <label htmlFor="choir-away-details" className="choir-avail-field-label">
              Notes for leadership (optional)
            </label>
            <textarea
              id="choir-away-details"
              className="choir-announcement-textarea w-full min-h-[72px]"
              placeholder="Example: Out of state Wed–Sun; back for rehearsal Monday."
              value={reasonDetails}
              onChange={(e) => setReasonDetails(e.target.value)}
            />
          </div>
          {formMessage ? <p className="mt-3 text-sm text-[var(--choir-body)]">{formMessage}</p> : null}
          <button
            type="submit"
            className="choir-btn-primary mt-4 w-full"
            disabled={submitBusy || !startDate || !endDate}
          >
            Submit for leader approval
          </button>
        </form>
      ) : null}

      {user && !loading && !loadError && compact && myRequests[0] ? (
        <p className="mt-3 text-sm text-[var(--choir-body)]">
          Latest: {formatAmericanDateRange(myRequests[0].startDate, myRequests[0].endDate)} —{" "}
          {statusLabel(myRequests[0].status)}
        </p>
      ) : null}

      {user && !loading && !loadError && myRequests.length > 0 ? (
        <div className="mt-5 border-t border-[var(--choir-border)] pt-4">
          <h3 className="text-sm font-bold text-[var(--choir-heading)]">Your time away</h3>
          <ul className="mt-2 space-y-2">
            {myRequests.map((item) => (
              <li key={item.id} className="choir-avail-assignment-card flex-col !items-start gap-2">
                <div className="flex w-full items-start justify-between gap-2">
                  <p className="text-sm font-semibold text-[var(--choir-heading)]">
                    {formatAmericanDateRange(item.startDate, item.endDate)}
                  </p>
                  <span className={`choir-avail-status-badge ${statusBadgeClass(item.status)}`}>
                    {statusLabel(item.status)}
                  </span>
                </div>
                <p className="text-xs text-[var(--choir-muted)]">{item.reason}</p>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {!compact && user && !loading && !loadError && myRequests.length === 0 ? (
        <p className="mt-4 text-sm text-[var(--choir-muted)]">You have no time-away requests on file.</p>
      ) : null}

      {!compact && canReview && pendingForReview.length > 0 ? (
        <div className="mt-5 border-t border-[var(--choir-border)] pt-4">
          <h3 className="text-sm font-bold text-[var(--choir-heading)]">Pending approvals</h3>
          <ul className="mt-2 space-y-3">
            {pendingForReview.map((item) => (
              <li
                key={item.id}
                className="rounded-xl border border-[var(--choir-border)] bg-[var(--choir-surface-soft)] p-3"
              >
                <p className="text-sm font-semibold text-[var(--choir-heading)]">{item.personName}</p>
                <p className="text-xs text-[var(--choir-muted)]">
                  {formatAmericanDateRange(item.startDate, item.endDate)}
                </p>
                <p className="mt-1 text-xs text-[var(--choir-body)]">{item.reason}</p>
                <div className="mt-3 flex gap-2">
                  <button
                    type="button"
                    className="choir-btn-primary flex-1 !min-h-[40px] !py-2 text-xs"
                    onClick={() => review(item.id, "approved")}
                  >
                    Approve
                  </button>
                  <button
                    type="button"
                    className="choir-btn-secondary flex-1 !min-h-[40px] !py-2 text-xs"
                    onClick={() => review(item.id, "rejected")}
                  >
                    Decline
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {teamApproved.length > 0 ? (
        <div className="mt-5 border-t border-[var(--choir-border)] pt-4">
          <h3 className="text-sm font-bold text-[var(--choir-heading)]">Who is away (approved)</h3>
          <ul className="mt-2 space-y-2">
            {(compact ? teamApproved.slice(0, 4) : teamApproved).map((item) => (
              <li key={item.id} className="text-xs text-[var(--choir-body)]">
                <span className="font-semibold text-[var(--choir-heading)]">{item.personName}</span>{" "}
                {formatAmericanDateRange(item.startDate, item.endDate)}
                <span className="block text-[var(--choir-muted)]">{item.reason}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  );
}
