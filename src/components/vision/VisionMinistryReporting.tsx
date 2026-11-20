"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

type ReportStatus = "draft" | "submitted" | "reviewed" | "returned";
type Report = {
  id: string;
  groupId: string;
  groupName: string;
  reportMonth: string;
  status: ReportStatus;
  responses: Record<string, string | number>;
  leaderNotes?: string | null;
  reviewerNotes?: string | null;
  actionSteps?: string | null;
  submittedByName?: string | null;
  submittedAt?: string | null;
};
type Group = { id: string; name: string };
type SummaryGroup = { groupId: string; groupName: string; status: ReportStatus | "missing" };
type ReportSummary = { reportMonth: string; total: number; submitted: number; reviewed: number; missing: number; groups: SummaryGroup[] };
type Template = { questions?: Array<{ id: string; label: string }> };
type ReportsResponse = {
  error?: string;
  reports?: Report[];
  report?: Report | null;
  template?: Template | null;
  leaderGroups?: Group[];
  canReview?: boolean;
  summary?: ReportSummary;
};

const planGroups: Record<string, string> = {
  men: "group-men-legacy",
  women: "group-shanah-ladies",
  kids: "group-kids",
  worship: "group-choir",
  "young-adults": "group-young-adults",
};
const inputClass = "w-full min-w-0 rounded-xl border border-slate-300 bg-white px-4 py-3 text-base text-slate-950 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-100";
const months = Array.from({ length: 14 }, (_, i) => {
  const year = i < 2 ? 2026 : 2027;
  const month = i < 2 ? i + 11 : i - 1;
  const value = year + "-" + String(month).padStart(2, "0");
  return { value, label: new Intl.DateTimeFormat("en-US", { month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(Date.UTC(year, month - 1, 1))) };
});
const currentMonth = () => {
  const parts = new Intl.DateTimeFormat("en-US", { timeZone: "America/Denver", year: "numeric", month: "2-digit" }).formatToParts(new Date());
  const year = parts.find(p => p.type === "year")?.value ?? "2027";
  const month = parts.find(p => p.type === "month")?.value ?? "01";
  const value = year + "-" + month;
  return months.some(m => m.value === value) ? value : "2027-01";
};
const statusClass: Record<string, string> = {
  missing: "bg-rose-50 text-rose-900",
  draft: "bg-slate-100 text-slate-800",
  submitted: "bg-amber-100 text-amber-950",
  returned: "bg-orange-100 text-orange-950",
  reviewed: "bg-emerald-100 text-emerald-950",
};

async function getJson(url: string): Promise<ReportsResponse> {
  const response = await fetch(url, { cache: "no-store" });
  const data = await response.json() as ReportsResponse;
  if (!response.ok) throw new Error(data.error || "Could not open ministry reports.");
  return data;
}

export function VisionMinistryReporting({ owner, ministryKey }: { owner: boolean; ministryKey?: string }) {
  const [month, setMonth] = useState(currentMonth);
  const [reports, setReports] = useState<Report[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [canReview, setCanReview] = useState(false);
  const [summary, setSummary] = useState<ReportSummary | null>(null);
  const [selected, setSelected] = useState<Report | null>(null);
  const [template, setTemplate] = useState<Template | null>(null);
  const [reviewNote, setReviewNote] = useState("");
  const [actionSteps, setActionSteps] = useState("");
  const [loading, setLoading] = useState(true);
  const [accessDenied, setAccessDenied] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const scopeGroupId = ministryKey ? planGroups[ministryKey] : undefined;

  const reload = useCallback(async () => {
    setLoading(true);
    setError("");
    setAccessDenied(false);
    try {
      const data = await getJson("/api/ministry-reports?reportMonth=" + encodeURIComponent(month));
      setReports(data.reports ?? []);
      setGroups(data.leaderGroups ?? []);
      setCanReview(Boolean(data.canReview));
      if (owner && data.canReview) {
        const result = await getJson("/api/ministry-reports?summaryMonth=" + encodeURIComponent(month));
        setSummary(result.summary ?? null);
      } else {
        setSummary(null);
      }
    } catch (e) {
      const message = e instanceof Error ? e.message : "Unable to load reports.";
      const denied = message.includes("Ministry leader or pastoral review access required") || message.includes("Sign in required");
      setAccessDenied(denied);
      setError(denied ? "" : message);
      setReports([]); setSummary(null);
    } finally { setLoading(false); }
  }, [month, owner]);

  useEffect(() => { void reload(); }, [reload]);
  useEffect(() => { setSelected(null); setTemplate(null); setNotice(""); }, [month, ministryKey]);

  const scoped = useMemo(() => reports.filter(r => !scopeGroupId || r.groupId === scopeGroupId), [reports, scopeGroupId]);
  const visibleSummary = (summary?.groups ?? []).filter(g => !scopeGroupId || g.groupId === scopeGroupId);
  const knownGroup = groups.find(g => g.id === scopeGroupId);
  const canSubmitHere = Boolean(scopeGroupId && knownGroup);
  const submitted = scoped.filter(r => r.status === "submitted").length;
  const reviewed = scoped.filter(r => r.status === "reviewed").length;
  const returned = scoped.filter(r => r.status === "returned").length;

  async function openReport(report: Report) {
    setBusy(true); setError(""); setNotice("");
    try {
      const data = await getJson("/api/ministry-reports?reportMonth=" + encodeURIComponent(report.reportMonth) + "&groupId=" + encodeURIComponent(report.groupId));
      setSelected(data.report ?? null);
      setTemplate(data.template ?? null);
      setReviewNote(data.report?.reviewerNotes ?? "");
      setActionSteps(data.report?.actionSteps ?? "");
    } catch (e) { setError(e instanceof Error ? e.message : "Unable to open report."); }
    finally { setBusy(false); }
  }

  async function decide(action: "review" | "return") {
    if (!selected || !canReview) return;
    setBusy(true); setError(""); setNotice("");
    try {
      const response = await fetch("/api/ministry-reports", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, reportMonth: selected.reportMonth, groupId: selected.groupId, reviewerNotes: reviewNote, actionSteps }),
      });
      const data = await response.json() as ReportsResponse;
      if (!response.ok || !data.report) throw new Error(data.error || "Could not save pastoral review.");
      setSelected(data.report);
      setNotice(action === "review" ? "Report marked reviewed. Pastoral feedback saved." : "Report returned for corrections. Pastoral feedback saved.");
      await reload();
    } catch (e) { setError(e instanceof Error ? e.message : "Could not save review."); }
    finally { setBusy(false); }
  }

  const heading = ministryKey ? "Ministry monthly reporting" : owner ? "2027 monthly reporting & pastoral review" : "My ministry monthly reports";

  return <section aria-label="Ministry monthly reporting" className="min-w-0 scroll-mt-24 space-y-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-8 lg:p-10">
    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      <div className="min-w-0 space-y-2">
        <p className="text-sm font-extrabold uppercase tracking-wide text-blue-800">Vision → Execution → Reporting</p>
        <h2 className="break-normal text-2xl font-bold leading-snug text-slate-950 sm:text-3xl">{heading}</h2>
        <p className="text-base leading-relaxed text-slate-700">Uses the church's existing private ministry reports. Leaders submit reports in their ministry; pastoral reviewers provide feedback here.</p>
      </div>
      <label className="min-w-0 text-sm font-bold text-slate-800 sm:w-52">Report month
        <select className={inputClass + " mt-2"} value={month} onChange={e => setMonth(e.target.value)}>
          {months.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
        </select>
      </label>
    </div>
    {error && <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-base font-semibold text-rose-900">{error}</p>}
    {notice && <p role="status" className="rounded-xl bg-emerald-50 p-4 text-base font-semibold text-emerald-900">{notice}</p>}
    {loading && <p role="status" className="text-base text-slate-700">Loading ministry reports…</p>}
    {!loading && accessDenied && <p className="rounded-xl bg-slate-50 p-4 text-base leading-relaxed text-slate-700">Monthly report details are available to authorized ministry leaders and pastoral reviewers. You can still review this ministry's vision and submit suggestions using the sections below.</p>}
    {!loading && !error && !accessDenied && <>
      <div className="grid grid-cols-3 gap-2 sm:gap-3" aria-label="Monthly reports overview">
        <div className="rounded-xl bg-amber-50 p-3 sm:p-4"><p className="text-xs font-semibold text-amber-900">Awaiting review</p><p className="mt-1 text-2xl font-extrabold text-amber-950">{submitted}</p></div>
        <div className="rounded-xl bg-emerald-50 p-3 sm:p-4"><p className="text-xs font-semibold text-emerald-900">Reviewed</p><p className="mt-1 text-2xl font-extrabold text-emerald-950">{reviewed}</p></div>
        <div className="rounded-xl bg-orange-50 p-3 sm:p-4"><p className="text-xs font-semibold text-orange-900">Returned</p><p className="mt-1 text-2xl font-extrabold text-orange-950">{returned}</p></div>
      </div>
      {owner && canReview && summary && <p className="rounded-xl bg-slate-50 p-4 text-sm font-semibold text-slate-800">
        Churchwide reporting: {scopeGroupId ? visibleSummary.length : summary.total} eligible {scopeGroupId ? "ministry" : "ministries"} · {visibleSummary.filter(g => g.status === "missing").length} missing · {visibleSummary.filter(g => g.status === "draft").length} draft
      </p>}
      {scopeGroupId && !canSubmitHere && !canReview && <p className="text-sm font-semibold text-slate-600">This ministry's reports are visible only to its authorized leaders and pastoral reviewers.</p>}
      <div className="grid min-w-0 grid-cols-1 gap-3 lg:grid-cols-2">
        {visibleSummary.length > 0 && canReview ? visibleSummary.map(g => {
          const report = scoped.find(r => r.groupId === g.groupId);
          return <article key={g.groupId} className="min-w-0 space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-4 sm:p-5">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <h3 className="min-w-0 break-words text-lg font-bold text-slate-950">{g.groupName}</h3>
              <span className={"rounded-full px-3 py-1 text-xs font-bold capitalize " + (statusClass[g.status] ?? statusClass.draft)}>{g.status}</span>
            </div>
            {report?.submittedByName && <p className="text-sm text-slate-700">Submitted by {report.submittedByName}</p>}
            {report && <button type="button" disabled={busy} className="min-h-11 rounded-xl bg-blue-700 px-4 py-2 text-sm font-bold text-white disabled:opacity-50" onClick={() => void openReport(report)}>Open report & pastoral feedback</button>}
            {!report && <p className="text-sm text-slate-600">No report submitted for this month.</p>}
          </article>;
        }) : scoped.map(report => <article key={report.id} className="min-w-0 space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-4 sm:p-5">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <h3 className="min-w-0 break-words text-lg font-bold text-slate-950">{report.groupName}</h3>
            <span className={"rounded-full px-3 py-1 text-xs font-bold capitalize " + (statusClass[report.status] ?? statusClass.draft)}>{report.status}</span>
          </div>
          {report.reviewerNotes && <p className="whitespace-pre-wrap break-words text-sm text-slate-800"><strong>Pastoral feedback:</strong> {report.reviewerNotes}</p>}
          {report.actionSteps && <p className="whitespace-pre-wrap break-words text-sm text-slate-800"><strong>Next steps:</strong> {report.actionSteps}</p>}
          <div className="flex flex-wrap gap-2">
            <button type="button" disabled={busy} className="min-h-11 rounded-xl border border-blue-200 bg-white px-4 py-2 text-sm font-bold text-blue-800" onClick={() => void openReport(report)}>View report</button>
            {groups.some(g => g.id === report.groupId) && <Link className="inline-flex min-h-11 items-center rounded-xl bg-blue-700 px-4 py-2 text-sm font-bold text-white" href={"/groups/" + encodeURIComponent(report.groupId) + "?report=1"}>Edit monthly report</Link>}
          </div>
        </article>)}
      </div>
      {scoped.length === 0 && visibleSummary.length === 0 && <p className="rounded-xl bg-slate-50 p-4 text-sm font-semibold text-slate-700">No reports found for this month. Choose another month or open your ministry's monthly report tab to begin.</p>}
      {!owner && <div className="flex flex-wrap gap-2">
        {groups.filter(g => !scopeGroupId || g.id === scopeGroupId).map(group => <Link key={group.id} href={"/groups/" + encodeURIComponent(group.id) + "?report=1"} className="inline-flex min-h-11 items-center rounded-xl bg-blue-700 px-4 py-2 text-sm font-bold text-white">Open {group.name} monthly report</Link>)}
      </div>}
    </>}
    {selected && <div className="min-w-0 space-y-5 rounded-2xl border border-blue-200 bg-blue-50/40 p-4 sm:p-6" aria-label="Selected ministry report">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-xl font-bold text-slate-950">{selected.groupName} · {selected.reportMonth}</h3>
        <button type="button" className="min-h-11 rounded-lg border border-slate-300 bg-white px-4 font-bold text-slate-800" onClick={() => { setSelected(null); setTemplate(null); }}>Close report</button>
      </div>
      <p className="text-sm font-semibold capitalize text-slate-700">Status: {selected.status}</p>
      <dl className="space-y-4">
        {Object.entries(selected.responses || {}).map(([key, value]) => <div key={key} className="min-w-0 border-b border-slate-200 pb-3">
          <dt className="text-sm font-bold text-slate-800">{template?.questions?.find(q => q.id === key)?.label ?? key.replaceAll("_", " ")}</dt>
          <dd className="mt-1 whitespace-pre-wrap break-words text-base leading-relaxed text-slate-950">{String(value)}</dd>
        </div>)}
      </dl>
      {selected.leaderNotes && <p className="whitespace-pre-wrap break-words text-base text-slate-800"><strong>Leader notes:</strong> {selected.leaderNotes}</p>}
      {canReview ? <div className="space-y-4 border-t border-slate-200 pt-5">
        <h4 className="text-lg font-bold text-slate-950">Pastoral review & action steps</h4>
        <label className="block space-y-2 text-base font-bold text-slate-900">Pastoral feedback
          <textarea className={inputClass + " min-h-44 resize-y"} value={reviewNote} onChange={e => setReviewNote(e.target.value)} maxLength={6000} placeholder="Affirm progress, give clear corrections and encouragement…" />
        </label>
        <label className="block space-y-2 text-base font-bold text-slate-900">Next actions for the ministry leader
          <textarea className={inputClass + " min-h-36 resize-y"} value={actionSteps} onChange={e => setActionSteps(e.target.value)} maxLength={6000} placeholder="Specific follow-up actions, owners, and deadlines…" />
        </label>
        <div className="flex flex-wrap gap-2">
          <button type="button" disabled={busy || selected.status === "draft"} onClick={() => void decide("review")} className="min-h-11 rounded-xl bg-blue-700 px-5 py-2 font-bold text-white disabled:opacity-50">Approve report review</button>
          <button type="button" disabled={busy || selected.status === "draft" || !reviewNote.trim()} onClick={() => void decide("return")} className="min-h-11 rounded-xl border border-amber-300 bg-white px-5 py-2 font-bold text-amber-950 disabled:opacity-50">Return with corrections</button>
        </div>
        <p className="text-sm text-slate-600">Use Return with corrections when changes are required. The existing report workflow retains the original ministry data.</p>
      </div> : <div className="space-y-2 border-t border-slate-200 pt-4">
        {selected.reviewerNotes && <p className="whitespace-pre-wrap break-words text-base text-slate-800"><strong>Pastoral feedback:</strong> {selected.reviewerNotes}</p>}
        {selected.actionSteps && <p className="whitespace-pre-wrap break-words text-base text-slate-800"><strong>Your next actions:</strong> {selected.actionSteps}</p>}
      </div>}
    </div>}
  </section>;
}
