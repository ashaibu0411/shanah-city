"use client";

import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { Button, Card } from "@/components/ui";
import { FormTextarea } from "@/components/ui/form-fields";
import {
  formatReportMonth,
  currentReportMonth,
  previousReportMonth,
  type MinistryLeaderReport,
  type MinistryReportSummary,
  type MinistryReportTemplate,
} from "@/lib/ministry-report-types";

function statusBadge(status: MinistryLeaderReport["status"] | "missing") {
  switch (status) {
    case "submitted":
      return "bg-blue-100 text-blue-800";
    case "reviewed":
      return "bg-emerald-100 text-emerald-800";
    case "returned":
      return "bg-amber-100 text-amber-800";
    case "missing":
      return "bg-red-100 text-red-800";
    default:
      return "bg-night-100 text-night-700";
  }
}

function statusText(status: MinistryLeaderReport["status"] | "missing") {
  switch (status) {
    case "submitted":
      return "Awaiting review";
    case "reviewed":
      return "Reviewed";
    case "returned":
      return "Returned";
    case "missing":
      return "Not submitted";
    default:
      return "Draft";
  }
}

export function AdminMinistryReportsPanel() {
  const { permissions } = useAuth();
  const [reportMonth, setReportMonth] = useState(previousReportMonth());
  const [summary, setSummary] = useState<MinistryReportSummary | null>(null);
  const [reports, setReports] = useState<MinistryLeaderReport[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState("");
  const [selectedReport, setSelectedReport] = useState<MinistryLeaderReport | null>(null);
  const [template, setTemplate] = useState<MinistryReportTemplate | null>(null);
  const [reviewerNotes, setReviewerNotes] = useState("");
  const [actionSteps, setActionSteps] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const selectedRow = useMemo(
    () => summary?.groups.find((group) => group.groupId === selectedGroupId),
    [summary, selectedGroupId],
  );

  async function loadOverview() {
    setLoading(true);
    const [summaryResponse, reportsResponse] = await Promise.all([
      fetch(`/api/ministry-reports?summaryMonth=${encodeURIComponent(reportMonth)}`),
      fetch(`/api/ministry-reports?reportMonth=${encodeURIComponent(reportMonth)}`),
    ]);
    const summaryData = await summaryResponse.json();
    const reportsData = await reportsResponse.json();
    setLoading(false);

    if (!summaryResponse.ok) {
      setMessage(summaryData.error ?? "Could not load summary.");
      return;
    }

    setSummary(summaryData.summary ?? null);
    setReports(reportsData.reports ?? []);
    setMessage(null);

    if (!selectedGroupId && summaryData.summary?.groups?.[0]) {
      setSelectedGroupId(summaryData.summary.groups[0].groupId);
    }
  }

  async function loadReport(groupId: string) {
    if (!groupId) return;
    setLoading(true);
    const params = new URLSearchParams({ reportMonth, groupId });
    const response = await fetch(`/api/ministry-reports?${params.toString()}`);
    const data = await response.json();
    setLoading(false);

    if (!response.ok) {
      setMessage(data.error ?? "Could not load report.");
      return;
    }

    setSelectedReport(data.report ?? null);
    setTemplate(data.template ?? null);
    setReviewerNotes(data.report?.reviewerNotes ?? "");
    setActionSteps(data.report?.actionSteps ?? "");
  }

  useEffect(() => {
    if (!permissions.canReviewMinistryReports) return;
    void loadOverview();
  }, [permissions.canReviewMinistryReports, reportMonth]);

  useEffect(() => {
    if (!selectedGroupId || !permissions.canReviewMinistryReports) return;
    void loadReport(selectedGroupId);
  }, [selectedGroupId, reportMonth, permissions.canReviewMinistryReports]);

  async function review(action: "review" | "return") {
    if (!selectedGroupId) return;
    setSaving(true);
    setMessage(null);

    const response = await fetch("/api/ministry-reports", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action,
        reportMonth,
        groupId: selectedGroupId,
        reviewerNotes,
        actionSteps,
      }),
    });
    const data = await response.json();
    setSaving(false);

    if (!response.ok) {
      setMessage(data.error ?? "Could not update report.");
      return;
    }

    setSelectedReport(data.report);
    setMessage(action === "review" ? "Marked as reviewed." : "Returned to leader for updates.");
    void loadOverview();
  }

  if (!permissions.canReviewMinistryReports) {
    return (
      <Card className="p-6">
        <p className="text-night-700">
          Ministry accountability reports are visible to pastoral staff and administrators.
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <p className="text-sm text-night-700">
          Leader reports appear here after they click <strong>Submit report</strong> (not Save draft).
          Open <strong>Admin → Ministry Reports</strong> and match the same report month the leader chose
          (usually the prior month, e.g. July for an August submission).
        </p>
        <div className="mt-4 flex flex-wrap items-end gap-4">
          <label className="block text-sm">
            <span className="font-semibold text-night-800">Report month</span>
            <input
              type="month"
              value={reportMonth}
              onChange={(event) => setReportMonth(event.target.value)}
              className="mt-1 block rounded-xl border border-night-900/10 bg-white px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-night-900/10"
            />
          </label>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setReportMonth(previousReportMonth())}
              className="rounded-full bg-sand-100 px-3 py-1.5 text-xs font-semibold text-night-700 hover:bg-sand-200"
            >
              Prior month
            </button>
            <button
              type="button"
              onClick={() => setReportMonth(currentReportMonth())}
              className="rounded-full bg-sand-100 px-3 py-1.5 text-xs font-semibold text-night-700 hover:bg-sand-200"
            >
              Current month
            </button>
          </div>
          {summary && (
            <div className="flex flex-wrap gap-3 text-sm text-night-700">
              <span>{formatReportMonth(reportMonth)}</span>
              <span>{summary.submitted}/{summary.total} submitted</span>
              <span>{summary.reviewed} reviewed</span>
              <span className="text-red-700">{summary.missing} missing</span>
            </div>
          )}
        </div>
      </Card>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)]">
        <Card className="overflow-hidden">
          <div className="border-b border-night-900/10 px-4 py-3">
            <h2 className="font-semibold text-night-900">Ministry teams</h2>
          </div>
          <div className="max-h-[520px] overflow-y-auto">
            {(summary?.groups ?? []).map((group) => {
              const active = group.groupId === selectedGroupId;
              return (
                <button
                  key={group.groupId}
                  type="button"
                  onClick={() => setSelectedGroupId(group.groupId)}
                  className={`flex w-full items-start justify-between gap-3 border-b border-night-900/5 px-4 py-3 text-left transition ${
                    active ? "bg-sand-100" : "hover:bg-sand-50"
                  }`}
                >
                  <div>
                    <p className="font-medium text-night-900">{group.groupName}</p>
                    {group.submittedByName && (
                      <p className="mt-1 text-xs text-night-500">By {group.submittedByName}</p>
                    )}
                  </div>
                  <span
                    className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${statusBadge(group.status)}`}
                  >
                    {statusText(group.status)}
                  </span>
                </button>
              );
            })}
          </div>
        </Card>

        <div className="space-y-6">
          {!selectedReport ? (
            <Card className="p-6">
              <h2 className="text-lg font-semibold text-night-900">
                {selectedRow?.groupName ?? "Select a ministry"}
              </h2>
              <p className="mt-2 text-sm text-night-600">
                {selectedRow?.status === "missing"
                  ? "No report submitted for this month yet. Follow up with the ministry leader."
                  : selectedRow?.status === "draft"
                    ? "A draft was saved but not submitted. Ask the leader to open their group → Monthly report tab and click Submit report."
                    : loading
                      ? "Loading…"
                      : "This team has not submitted a report for the selected month."}
              </p>
            </Card>
          ) : (
            <>
              <Card className="p-6">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-semibold text-night-900">{selectedReport.groupName}</h2>
                    <p className="mt-1 text-sm text-night-600">
                      {selectedReport.status === "draft"
                        ? `Draft saved by ${selectedReport.submittedByName ?? selectedReport.createdByName ?? "leader"} · not submitted yet`
                        : `Submitted by ${selectedReport.submittedByName ?? "Unknown"} · ${
                            selectedReport.submittedAt
                              ? new Date(selectedReport.submittedAt).toLocaleString()
                              : "Not submitted"
                          }`}
                    </p>
                  </div>
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${statusBadge(selectedReport.status)}`}
                  >
                    {statusText(selectedReport.status)}
                  </span>
                </div>
              </Card>

              <Card className="space-y-5 p-6">
                {template?.questions.map((question) => {
                  const value = selectedReport.responses[question.id];
                  if (value === undefined || value === "") return null;
                  return (
                    <div key={question.id}>
                      <p className="text-xs font-semibold uppercase tracking-wide text-night-500">
                        {question.label}
                      </p>
                      <p className="mt-1 whitespace-pre-wrap text-sm text-night-900">{String(value)}</p>
                    </div>
                  );
                })}
                {selectedReport.leaderNotes && (
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-night-500">
                      Leader notes
                    </p>
                    <p className="mt-1 whitespace-pre-wrap text-sm text-night-900">
                      {selectedReport.leaderNotes}
                    </p>
                  </div>
                )}
              </Card>

              <Card className="space-y-4 p-6">
                <h3 className="font-semibold text-night-900">Pastoral follow-up</h3>
                {selectedReport.status === "draft" ? (
                  <p className="text-sm text-night-600">
                    This report is still a draft. Review fields below, then ask the leader to submit it.
                  </p>
                ) : null}
                <label className="block text-sm">
                  <span className="font-semibold text-night-800">Action steps & expectations</span>
                  <FormTextarea
                    value={actionSteps}
                    onValueChange={setActionSteps}
                    rows={4}
                    placeholder="Clear next steps for this leader — who to call, what to schedule, deadlines…"
                  />
                </label>
                <label className="block text-sm">
                  <span className="font-semibold text-night-800">Private notes to leader</span>
                  <FormTextarea
                    value={reviewerNotes}
                    onValueChange={setReviewerNotes}
                    rows={3}
                    placeholder="Encouragement, coaching, or concerns they should see."
                  />
                </label>
                <div className="flex flex-wrap gap-3">
                  <Button
                    type="button"
                    disabled={saving || selectedReport.status === "draft"}
                    onClick={() => review("review")}
                  >
                    Mark reviewed
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    disabled={saving || selectedReport.status === "draft"}
                    onClick={() => review("return")}
                  >
                    Return for edits
                  </Button>
                </div>
              </Card>
            </>
          )}
        </div>
      </div>

      {reports.length > 0 && (
        <Card className="p-6">
          <h3 className="font-semibold text-night-900">Recent reports</h3>
          <div className="mt-4 space-y-2">
            {reports.slice(0, 12).map((report) => (
              <button
                key={report.id}
                type="button"
                onClick={() => {
                  setReportMonth(report.reportMonth);
                  setSelectedGroupId(report.groupId);
                }}
                className="flex w-full items-center justify-between rounded-xl px-3 py-2 text-left hover:bg-sand-50"
              >
                <span className="text-sm text-night-800">
                  {report.groupName} · {formatReportMonth(report.reportMonth)}
                </span>
                <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${statusBadge(report.status)}`}>
                  {statusText(report.status)}
                </span>
              </button>
            ))}
          </div>
        </Card>
      )}

      {message && <p className="text-sm text-night-700">{message}</p>}
    </div>
  );
}
