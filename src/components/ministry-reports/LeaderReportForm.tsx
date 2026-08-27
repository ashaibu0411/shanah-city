"use client";

import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { Button, Card } from "@/components/ui";
import { FormInput, FormTextarea } from "@/components/ui/form-fields";
import {
  currentReportMonth,
  formatReportMonth,
  previousReportMonth,
  type MinistryLeaderReport,
  type MinistryReportQuestion,
  type MinistryReportResponses,
  type MinistryReportTemplate,
} from "@/lib/ministry-report-types";

type LeaderGroup = {
  id: string;
  name: string;
  templateKey: string;
};

function statusLabel(status: MinistryLeaderReport["status"]) {
  switch (status) {
    case "draft":
      return "Draft";
    case "submitted":
      return "Submitted";
    case "reviewed":
      return "Reviewed";
    case "returned":
      return "Returned for edits";
    default:
      return status;
  }
}

function statusClass(status: MinistryLeaderReport["status"]) {
  switch (status) {
    case "submitted":
      return "bg-blue-100 text-blue-800";
    case "reviewed":
      return "bg-emerald-100 text-emerald-800";
    case "returned":
      return "bg-amber-100 text-amber-800";
    default:
      return "bg-night-100 text-night-700";
  }
}

function QuestionField({
  question,
  value,
  onChange,
  readOnly,
}: {
  question: MinistryReportQuestion;
  value: string | number;
  onChange: (value: string | number) => void;
  readOnly?: boolean;
}) {
  const stringValue = value === undefined || value === null ? "" : String(value);

  function PrefillOptions() {
    if (readOnly || !question.prefillOptions?.length) return null;

    return (
      <div className="mt-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-night-500">
          Quick answers
        </p>
        <div className="mt-2 flex flex-wrap gap-2">
          {question.prefillOptions.map((option) => (
            <button
              key={option.id ?? option.label}
              type="button"
              onMouseDown={(event) => event.preventDefault()}
              onClick={(event) => {
                event.preventDefault();
                event.stopPropagation();
                onChange(option.value);
              }}
              className={`rounded-full px-3 py-1.5 text-left text-xs font-semibold transition ${
                stringValue === option.value
                  ? "bg-night-900 text-sand-50"
                  : "bg-sand-100 text-night-700 hover:bg-sand-200"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>
    );
  }

  function NumberPresets() {
    if (readOnly || question.type !== "number" || !question.numberPresets?.length) return null;

    return (
      <div className="mt-2 flex flex-wrap gap-2">
        {question.numberPresets.map((preset) => (
          <button
            key={preset}
            type="button"
            onMouseDown={(event) => event.preventDefault()}
            onClick={(event) => {
              event.preventDefault();
              event.stopPropagation();
              onChange(preset);
            }}
            className={`h-9 min-w-[2.5rem] rounded-full px-3 text-sm font-semibold transition ${
              Number(stringValue) === preset
                ? "bg-night-900 text-sand-50"
                : "bg-sand-100 text-night-700 hover:bg-sand-200"
            }`}
          >
            {preset}
          </button>
        ))}
      </div>
    );
  }

  if (question.type === "textarea") {
    return (
      <>
        <PrefillOptions />
        <FormTextarea
          value={stringValue}
          onValueChange={onChange}
          rows={4}
          disabled={readOnly}
        />
      </>
    );
  }

  if (question.type === "select") {
    return (
      <select
        value={stringValue}
        onChange={(event) => onChange(event.target.value)}
        disabled={readOnly}
        className="mt-1 w-full rounded-xl border border-night-900/10 bg-white px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-night-900/10"
      >
        <option value="">Select…</option>
        {(question.options ?? []).map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    );
  }

  if (question.type === "rating") {
    return (
      <div className="mt-2 flex flex-wrap gap-2">
        {Array.from({ length: (question.max ?? 5) - (question.min ?? 1) + 1 }).map((_, index) => {
          const rating = (question.min ?? 1) + index;
          const active = Number(stringValue) === rating;
          return (
            <button
              key={rating}
              type="button"
              disabled={readOnly}
              onClick={() => onChange(rating)}
              className={`h-10 w-10 rounded-full text-sm font-semibold transition ${
                active
                  ? "bg-night-900 text-sand-50"
                  : "bg-white text-night-700 ring-1 ring-night-900/10 hover:bg-sand-100"
              }`}
            >
              {rating}
            </button>
          );
        })}
      </div>
    );
  }

  if (question.type === "number") {
    return (
      <>
        <NumberPresets />
        <FormInput
          type="number"
          value={stringValue}
          onValueChange={onChange}
          min={question.min}
          max={question.max}
          disabled={readOnly}
        />
      </>
    );
  }

  return (
    <>
      <PrefillOptions />
      <FormInput
        type="text"
        value={stringValue}
        onValueChange={onChange}
        disabled={readOnly}
      />
    </>
  );
}

export function LeaderReportForm({
  groupId: fixedGroupId,
  groupName: fixedGroupName,
  embedded = false,
}: {
  groupId?: string;
  groupName?: string;
  embedded?: boolean;
} = {}) {
  const { permissions } = useAuth();
  const [leaderGroups, setLeaderGroups] = useState<LeaderGroup[]>([]);
  const [reportMonth, setReportMonth] = useState(previousReportMonth());
  const [groupId, setGroupId] = useState(fixedGroupId ?? "");
  const [template, setTemplate] = useState<MinistryReportTemplate | null>(null);
  const [responses, setResponses] = useState<MinistryReportResponses>({});
  const [leaderNotes, setLeaderNotes] = useState("");
  const [report, setReport] = useState<MinistryLeaderReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const canAccess = embedded ? Boolean(fixedGroupId) : permissions.canSubmitMinistryReports;

  const readOnly = useMemo(() => {
    if (!report) return false;
    return report.status === "submitted" || report.status === "reviewed";
  }, [report]);

  async function loadMeta() {
    const response = await fetch("/api/ministry-reports");
    const data = await response.json();
    if (!response.ok) {
      setMessage(data.error ?? "Could not load ministry reports.");
      setLoading(false);
      return;
    }

    const groups = (data.leaderGroups ?? []) as LeaderGroup[];
    setLeaderGroups(groups);
    if (!groupId && groups[0]) {
      setGroupId(groups[0].id);
    }
    setLoading(false);
  }

  async function loadReport(targetGroupId = groupId, targetMonth = reportMonth) {
    if (!targetGroupId) return;
    setLoading(true);
    const params = new URLSearchParams({
      reportMonth: targetMonth,
      groupId: targetGroupId,
    });
    const response = await fetch(`/api/ministry-reports?${params.toString()}`);
    const data = await response.json();
    setLoading(false);

    if (!response.ok) {
      setMessage(data.error ?? "Could not load report.");
      return;
    }

    setTemplate(data.template ?? null);
    if (data.report) {
      setReport(data.report);
      setResponses(data.report.responses ?? {});
      setLeaderNotes(data.report.leaderNotes ?? "");
    } else {
      setReport(null);
      setResponses({});
      setLeaderNotes("");
    }
    setMessage(null);
  }

  useEffect(() => {
    if (fixedGroupId) {
      setGroupId(fixedGroupId);
    }
  }, [fixedGroupId]);

  useEffect(() => {
    if (!canAccess) return;
    if (embedded && fixedGroupId) return;
    void loadMeta();
  }, [canAccess, embedded, fixedGroupId]);

  useEffect(() => {
    if (!groupId || !canAccess) return;
    void loadReport(groupId, reportMonth);
  }, [groupId, reportMonth, canAccess]);

  async function save(action: "save" | "submit") {
    if (!groupId) return;
    setSaving(true);
    setMessage(null);

    const response = await fetch("/api/ministry-reports", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action,
        reportMonth,
        groupId,
        responses,
        leaderNotes,
      }),
    });
    const data = await response.json();
    setSaving(false);

    if (!response.ok) {
      setMessage(data.error ?? "Could not save report.");
      return;
    }

    setReport(data.report);
    setResponses(data.report.responses ?? {});
    setMessage(
      action === "submit"
        ? "Report submitted to pastoral staff. Thank you for leading with accountability."
        : "Draft saved.",
    );
  }

  if (!canAccess) {
    return (
      <Card className="p-6">
        <p className="text-night-700">
          Monthly ministry reports are available to group leaders. Ask an admin to make you a
          leader on your ministry group.
        </p>
      </Card>
    );
  }

  if (loading && !template && !embedded) {
    return <Card className="p-6 text-night-600">Loading…</Card>;
  }

  if (loading && embedded && !template) {
    return <p className="text-sm text-night-500">Loading monthly report…</p>;
  }

  return (
    <div className={embedded ? "mt-4 space-y-6" : "space-y-6"}>
      <Card className="p-6">
        <div className={`grid gap-4 ${embedded ? "" : "md:grid-cols-2"}`}>
          {!embedded ? (
            <label className="block text-sm">
              <span className="font-semibold text-night-800">Ministry team</span>
              <select
                value={groupId}
                onChange={(event) => setGroupId(event.target.value)}
                className="mt-1 w-full rounded-xl border border-night-900/10 bg-white px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-night-900/10"
              >
                {leaderGroups.map((group) => (
                  <option key={group.id} value={group.id}>
                    {group.name}
                  </option>
                ))}
              </select>
            </label>
          ) : fixedGroupName ? (
            <div className="text-sm">
              <span className="font-semibold text-night-800">Ministry team</span>
              <p className="mt-1 text-night-700">{fixedGroupName}</p>
            </div>
          ) : null}

          <label className={`block text-sm ${embedded ? "max-w-sm" : ""}`}>
            <span className="font-semibold text-night-800">Report month</span>
            <input
              type="month"
              value={reportMonth}
              max={currentReportMonth()}
              onChange={(event) => setReportMonth(event.target.value)}
              className="mt-1 w-full rounded-xl border border-night-900/10 bg-white px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-night-900/10"
            />
            <span className="mt-1 block text-xs text-night-500">
              Reporting for {formatReportMonth(reportMonth)}. Submit by the 5th for the prior month.
            </span>
          </label>
        </div>

        {report && (
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusClass(report.status)}`}>
              {statusLabel(report.status)}
            </span>
            {report.submittedAt && (
              <span className="text-xs text-night-500">
                Submitted {new Date(report.submittedAt).toLocaleString()}
              </span>
            )}
          </div>
        )}
      </Card>

      {template && (
        <>
          <Card className="p-6">
            <h2 className="text-lg font-semibold text-night-900">{template.title}</h2>
            <p className="mt-2 text-sm text-night-600">
              These expectations help pastoral staff coach leaders and spot dormant ministry early.
              Tap quick answers where shown, then edit or add names and details in the text boxes.
            </p>
            <ul className="mt-4 list-disc space-y-2 pl-5 text-sm text-night-700">
              {template.expectations.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </Card>

          {report?.status === "reviewed" && (report.reviewerNotes || report.actionSteps) && (
            <Card className="border-emerald-200 bg-emerald-50/70 p-6">
              <h3 className="font-semibold text-emerald-900">Pastoral response</h3>
              {report.actionSteps && (
                <div className="mt-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-emerald-800">
                    Action steps
                  </p>
                  <p className="mt-1 whitespace-pre-wrap text-sm text-emerald-950">{report.actionSteps}</p>
                </div>
              )}
              {report.reviewerNotes && (
                <div className="mt-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-emerald-800">Notes</p>
                  <p className="mt-1 whitespace-pre-wrap text-sm text-emerald-950">{report.reviewerNotes}</p>
                </div>
              )}
            </Card>
          )}

          {report?.status === "returned" && (
            <Card className="border-amber-200 bg-amber-50/70 p-6">
              <h3 className="font-semibold text-amber-900">Returned for updates</h3>
              {report.actionSteps && (
                <p className="mt-2 whitespace-pre-wrap text-sm text-amber-950">{report.actionSteps}</p>
              )}
              {report.reviewerNotes && (
                <p className="mt-2 whitespace-pre-wrap text-sm text-amber-950">{report.reviewerNotes}</p>
              )}
              <p className="mt-3 text-sm text-amber-800">
                Update your answers below and submit again when ready.
              </p>
            </Card>
          )}

          <Card className="space-y-6 p-6">
            {template.questions.map((question) => (
              <div key={question.id} className="block text-sm">
                <span className="block font-semibold text-night-800">
                  {question.label}
                  {question.required ? " *" : ""}
                </span>
                {question.hint && (
                  <span className="mt-1 block text-xs text-night-500">{question.hint}</span>
                )}
                <QuestionField
                  question={question}
                  value={responses[question.id] ?? ""}
                  onChange={(value) =>
                    setResponses((current) => ({ ...current, [question.id]: value }))
                  }
                  readOnly={readOnly && report?.status !== "returned"}
                />
              </div>
            ))}

            <label className="block text-sm">
              <span className="font-semibold text-night-800">Additional notes to pastoral staff</span>
              <FormTextarea
                value={leaderNotes}
                onValueChange={setLeaderNotes}
                rows={3}
                disabled={readOnly && report?.status !== "returned"}
              />
            </label>
          </Card>

          <div className="flex flex-wrap gap-3">
            <Button
              type="button"
              variant="secondary"
              disabled={saving || (readOnly && report?.status !== "returned")}
              onClick={() => save("save")}
            >
              Save draft
            </Button>
            <Button
              type="button"
              disabled={saving || (readOnly && report?.status !== "returned")}
              onClick={() => save("submit")}
            >
              Submit to pastor
            </Button>
          </div>
        </>
      )}

      {message && (
        <p className={`text-sm ${message.includes("submitted") || message.includes("saved") ? "text-emerald-700" : "text-red-700"}`}>
          {message}
        </p>
      )}
    </div>
  );
}
