"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { marriagePremium } from "@/components/marriage/marriage-counseling-premium";
import type {
  MarriageCounselorCommandCenterAction,
  MarriageCounselorCommandCenterCouple,
  MarriageCounselorCommandCenterView,
} from "@/lib/marriage-counselor-command-center-types";
import { formatMarriageSessionScheduledAt } from "@/lib/marriage-session-scheduling";
import { readJsonResponse } from "@/lib/read-json-response";
import { useEffect } from "react";

type FilterKey = "all" | "active" | "appointments" | "homework" | "paused" | "completed";

function statusBadge(status: MarriageCounselorCommandCenterCouple["cardStatus"]) {
  const base = "rounded-full px-2.5 py-0.5 text-xs font-bold capitalize";
  switch (status) {
    case "paused":
      return `${base} bg-amber-100 text-amber-950 dark:bg-amber-900/40 dark:text-amber-100`;
    case "completed":
      return `${base} bg-emerald-100 text-emerald-900 dark:bg-emerald-900/40 dark:text-emerald-100`;
    case "approaching_review":
      return `${base} bg-violet-100 text-violet-950 dark:bg-violet-900/40 dark:text-violet-100`;
    default:
      return `${base} bg-stone-100 text-stone-800 dark:bg-white/10 dark:text-sand-100`;
  }
}

function actionLabel(action: MarriageCounselorCommandCenterAction) {
  switch (action.kind) {
    case "homework_review":
      return "Homework review";
    case "attendance_missing":
      return "Attendance";
    case "assignment_overdue":
      return "Follow-up";
    case "session_preparation":
      return "Session prep";
    case "revision_pending":
      return "Revision";
    case "pastoral_readiness_pending":
      return "Pastoral review";
    default:
      return "Task";
  }
}

function OverviewStat({
  label,
  value,
  hint,
}: {
  label: string;
  value: number;
  hint?: string;
}) {
  return (
    <div className="marriage-c3m-summary-card min-h-[88px]">
      <p className="marriage-c3m-summary-label">{label}</p>
      <p className="marriage-c3m-summary-value">{value}</p>
      {hint ? <p className="marriage-c3m-summary-hint">{hint}</p> : null}
    </div>
  );
}

export function MarriageCounselorCommandCenter() {
  const { permissions } = useAuth();
  const [data, setData] = useState<MarriageCounselorCommandCenterView | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<FilterKey>("all");
  const [section, setSection] = useState<"overview" | "couples" | "schedule" | "actions">("overview");

  useEffect(() => {
    void (async () => {
      setLoading(true);
      setError("");
      const res = await fetch("/api/marriage/counselor", { cache: "no-store" });
      const body = await readJsonResponse<{
        commandCenter?: MarriageCounselorCommandCenterView;
        error?: string;
      }>(res);
      if (!res.ok) {
        setError(body.error ?? "Access denied.");
        setData(null);
      } else {
        setData(body.commandCenter ?? null);
      }
      setLoading(false);
    })();
  }, []);

  const filteredCouples = useMemo(() => {
    const couples = data?.couples ?? [];
    const q = query.trim().toLowerCase();
    return couples.filter((c) => {
      if (q && !c.coupleNames.toLowerCase().includes(q)) return false;
      switch (filter) {
        case "active":
          return c.cardStatus === "active";
        case "appointments":
          return c.hasUpcomingAppointment;
        case "homework":
          return c.homeworkAwaitingReviewCount > 0;
        case "paused":
          return c.cardStatus === "paused";
        case "completed":
          return c.cardStatus === "completed";
        default:
          return true;
      }
    });
  }, [data?.couples, filter, query]);

  const showAssignmentAdmin =
    data?.flags.canOpenAssignmentAdmin || permissions.canAccessMarriageCounselorAssignments;

  if (loading) {
    return (
      <div className={marriagePremium.card} aria-busy="true">
        <p className={marriagePremium.cardMuted} role="status">
          Loading command center…
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={marriagePremium.card}>
        <p className="text-sm text-red-800 dark:text-red-300">{error}</p>
        <Link href="/marriage" className={`${marriagePremium.secondaryCta} mt-4 inline-flex`}>
          Back to Marriage Prep
        </Link>
      </div>
    );
  }

  if (!data) return null;

  if (!data.flags.hasAssignedClinicalCouples) {
    return (
      <div className="space-y-6">
        <header>
          <Link href="/marriage" className="text-sm font-semibold text-clay-700 dark:text-clay-300">
            ← Marriage Prep hub
          </Link>
          <h1 className="marriage-c3m-title mt-2">Counselor command center</h1>
          <p className="marriage-c3m-muted mt-1 max-w-xl text-sm">
            When couples register, link accounts, consent together, and receive an approved counselor assignment, their
            journeys appear here with sessions, homework, and follow-ups.
          </p>
        </header>
        <div className={`${marriagePremium.card} border-dashed`}>
          <p className="font-semibold text-[#292219] dark:text-sand-100">No assigned couples yet</p>
          <p className="mt-2 text-sm text-night-600 dark:text-sand-300">
            You will only see couples you are authorized to counsel after pastoral assignment is complete. Pending
            requests and other couples&apos; data are not shown here.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Link href="/marriage" className={marriagePremium.secondaryCta}>
              Marriage Prep hub
            </Link>
            {showAssignmentAdmin ? (
              <Link href="/marriage/admin/counselor-assignments" className={marriagePremium.primaryCta}>
                Counselor assignments
              </Link>
            ) : null}
          </div>
        </div>
      </div>
    );
  }

  const o = data.overview;

  return (
    <div className="space-y-6 pb-8">
      <header>
        <Link href="/marriage" className="text-sm font-semibold text-clay-700 dark:text-clay-300">
          ← Marriage Prep hub
        </Link>
        <h1 className="marriage-c3m-title mt-2">Counselor command center</h1>
        <p className="marriage-c3m-muted mt-1 text-sm">
          Assigned couples only · Times shown in {data.schedulingTimeZone.replace(/_/g, " ")}
        </p>
      </header>

      <div className="flex flex-wrap gap-2" role="tablist" aria-label="Command center sections">
        {(
          [
            ["overview", "Overview"],
            ["couples", "My couples"],
            ["schedule", "Today & upcoming"],
            ["actions", "Action center"],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            type="button"
            role="tab"
            aria-selected={section === key}
            className={`min-h-[44px] rounded-full px-4 py-2 text-sm font-semibold ${
              section === key
                ? "bg-[#292219] text-white dark:bg-clay-700"
                : "border border-[#E8E2DA] bg-white dark:border-white/10 dark:bg-white/5"
            }`}
            onClick={() => setSection(key)}
          >
            {label}
            {key === "actions" && data.actions.length > 0 ? (
              <span className="ml-1.5 rounded-full bg-clay-600 px-1.5 text-xs text-white">{data.actions.length}</span>
            ) : null}
          </button>
        ))}
      </div>

      {section === "overview" && (
        <div className="space-y-6">
          <div className="marriage-c3m-summary-grid">
            <OverviewStat label="Active couples" value={o.activeAssignedCouples} />
            <OverviewStat label="Upcoming appointments" value={o.upcomingAppointments} />
            <OverviewStat label="Homework to review" value={o.homeworkAwaitingReview} />
            <OverviewStat label="Attendance needed" value={o.sessionsNeedingAttendance} />
            <OverviewStat label="Approaching final review" value={o.approachingFinalReview} />
            <OverviewStat label="Paused journeys" value={o.pausedJourneys} />
          </div>
          {data.actions.length > 0 && (
            <div className="marriage-c3m-panel">
              <h2 className="marriage-c3m-section-title">Priority actions</h2>
              <ul className="mt-3 space-y-2">
                {data.actions.slice(0, 5).map((action) => (
                  <li key={action.id}>
                    <Link href={action.href} className="flex flex-wrap items-baseline gap-2 rounded-xl border border-[#E8E2DA] p-3 text-sm hover:border-clay-500 dark:border-white/10">
                      <span className="font-semibold">{action.coupleNames}</span>
                      <span className="text-xs font-bold uppercase text-clay-700">{actionLabel(action)}</span>
                      <span className="w-full text-night-600 dark:text-sand-300">{action.title}</span>
                    </Link>
                  </li>
                ))}
              </ul>
              {data.actions.length > 5 ? (
                <button type="button" className="mt-3 text-sm font-bold text-clay-800 underline" onClick={() => setSection("actions")}>
                  View all {data.actions.length} actions
                </button>
              ) : null}
            </div>
          )}
        </div>
      )}

      {section === "couples" && (
        <div className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <label className="min-w-0 flex-1">
              <span className="sr-only">Search couples</span>
              <input
                type="search"
                placeholder="Search by name"
                className="marriage-c3m-input w-full"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </label>
            <select
              className="marriage-c3m-input min-h-[44px] w-full sm:w-auto"
              value={filter}
              onChange={(e) => setFilter(e.target.value as FilterKey)}
              aria-label="Filter couples"
            >
              <option value="all">All assigned</option>
              <option value="active">Active</option>
              <option value="appointments">Upcoming appointments</option>
              <option value="homework">Homework pending review</option>
              <option value="paused">Paused</option>
              <option value="completed">Completed</option>
            </select>
          </div>
          <ul className="space-y-3">
            {filteredCouples.map((c) => (
              <li key={c.journeyId}>
                <Link
                  href={`/marriage/counselor/journey/${c.journeyId}`}
                  className="marriage-c3m-panel block transition hover:border-clay-500 dark:hover:border-clay-600"
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <p className="text-lg font-semibold text-[#292219] dark:text-sand-100">{c.coupleNames}</p>
                      <p className="marriage-c3m-muted mt-0.5 text-xs capitalize">
                        {c.programType.replace(/_/g, " ")} · {c.progressLabel}
                      </p>
                    </div>
                    <span className={statusBadge(c.cardStatus)}>{c.cardStatus.replace(/_/g, " ")}</span>
                  </div>
                  {c.currentSessionTitle ? (
                    <p className="mt-2 text-sm">
                      <span className="font-semibold">Current focus:</span> {c.currentSessionTitle}
                    </p>
                  ) : null}
                  <div className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
                    <p>
                      <span className="font-semibold">Next appointment:</span>{" "}
                      {c.nextAppointmentAt
                        ? formatMarriageSessionScheduledAt(c.nextAppointmentAt, c.nextAppointmentTimeZone)
                        : "None scheduled"}
                    </p>
                    <p>
                      <span className="font-semibold">Homework:</span> {c.homeworkSummary}
                    </p>
                  </div>
                  {c.lastActivityAt ? (
                    <p className="marriage-c3m-muted mt-2 text-xs">
                      Last activity {new Date(c.lastActivityAt).toLocaleString()}
                    </p>
                  ) : null}
                  <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-night-900/10 dark:bg-white/10">
                    <div
                      className="h-full rounded-full bg-clay-600"
                      style={{ width: `${Math.round(c.progressRatio * 100)}%` }}
                    />
                  </div>
                </Link>
              </li>
            ))}
            {filteredCouples.length === 0 ? (
              <p className={marriagePremium.cardMuted}>No couples match this filter.</p>
            ) : null}
          </ul>
        </div>
      )}

      {section === "schedule" && (
        <div className="marriage-c3m-panel">
          <h2 className="marriage-c3m-section-title">Upcoming appointments</h2>
          {data.upcomingAppointments.length === 0 ? (
            <p className="marriage-c3m-muted mt-2 text-sm">No upcoming sessions scheduled.</p>
          ) : (
            <ul className="mt-4 space-y-3">
              {data.upcomingAppointments.map((appt) => (
                <li key={appt.sessionId} className="rounded-xl border border-[#E8E2DA] p-4 dark:border-white/10">
                  <p className="font-semibold">{appt.coupleNames}</p>
                  <p className="mt-1 text-sm font-medium">
                    {formatMarriageSessionScheduledAt(appt.scheduledAt, appt.schedulingTimeZone)}
                    {appt.scheduledEndAt
                      ? ` – ${formatMarriageSessionScheduledAt(appt.scheduledEndAt, appt.schedulingTimeZone)}`
                      : ""}
                  </p>
                  <p className="mt-1 text-sm">{appt.sessionTitle}</p>
                  {appt.meetingMode ? (
                    <p className="marriage-c3m-muted mt-1 text-xs capitalize">{appt.meetingMode.replace(/_/g, " ")}</p>
                  ) : null}
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Link
                      href={`/marriage/counselor/journey/${appt.journeyId}`}
                      className="marriage-c3m-btn-primary min-h-[44px] px-4 text-sm"
                    >
                      Open journey
                    </Link>
                    {appt.premaritalSessionKey ? (
                      <>
                        <Link
                          href={`/marriage/counselor/journey/${appt.journeyId}#premarital-ops-appointments`}
                          className="marriage-c3m-btn-secondary min-h-[44px] px-4 text-sm"
                        >
                          Reschedule
                        </Link>
                        <Link
                          href={`/marriage/counselor/journey/${appt.journeyId}#premarital-ops-attendance`}
                          className="marriage-c3m-btn-secondary min-h-[44px] px-4 text-sm"
                        >
                          Attendance
                        </Link>
                      </>
                    ) : null}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {section === "actions" && (
        <div className="marriage-c3m-panel">
          <h2 className="marriage-c3m-section-title">Action center</h2>
          <p className="marriage-c3m-muted mt-1 text-xs">Tasks are generated from homework submissions, sessions, and assignments in your caseload.</p>
          {data.actions.length === 0 ? (
            <p className="marriage-c3m-muted mt-4 text-sm">You&apos;re caught up — no outstanding tasks.</p>
          ) : (
            <ul className="mt-4 space-y-3">
              {data.actions.map((action) => (
                <li key={action.id}>
                  <Link
                    href={action.href}
                    className="flex flex-col gap-1 rounded-xl border border-[#E8E2DA] p-4 text-sm dark:border-white/10 hover:border-clay-500"
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-bold uppercase tracking-wide text-clay-700">{actionLabel(action)}</span>
                      <span className="font-semibold">{action.coupleNames}</span>
                    </div>
                    <span>{action.title}</span>
                    {action.detail ? <span className="marriage-c3m-muted text-xs">{action.detail}</span> : null}
                    {action.dueAt ? (
                      <span className="text-xs font-medium">
                        Due {formatMarriageSessionScheduledAt(action.dueAt, data.schedulingTimeZone)}
                      </span>
                    ) : null}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
