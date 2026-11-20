"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type Assignment = { id: string; status: string; acknowledgedAt?: string | null; submittedAt?: string | null; deadline?: string | null };
type Plan = { id: string; title: string; ministryKey: string; status: string; assignments: Assignment[] };
type Milestone = { id: string; planId: string; title: string; dueOn: string; status: string; plan?: { title: string } };
type Group = { id: string; name: string };
type Report = { id: string; groupId: string; reportMonth: string; status: "draft" | "submitted" | "reviewed" | "returned"; reviewerNotes?: string | null; actionSteps?: string | null };
type MilestoneResponse = { milestones?: Milestone[]; error?: string };
type ReportResponse = { reports?: Report[]; leaderGroups?: Group[]; error?: string };

function denverDay() {
  const tokens = new Intl.DateTimeFormat("en-US", { timeZone: "America/Denver", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(new Date());
  const item = (type: string) => tokens.find(token => token.type === type)?.value ?? "";
  return item("year") + "-" + item("month") + "-" + item("day");
}
function niceDate(day: string) {
  const parsed = new Date(day.slice(0, 10) + "T12:00:00Z");
  return Number.isNaN(parsed.getTime()) ? day : parsed.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" });
}
const statusColors: Record<string, string> = {
  draft: "bg-slate-100 text-slate-900",
  submitted: "bg-amber-100 text-amber-950",
  reviewed: "bg-emerald-100 text-emerald-950",
  returned: "bg-orange-100 text-orange-950",
  missing: "bg-rose-100 text-rose-950",
};
const button = "inline-flex min-h-11 items-center justify-center rounded-xl border border-blue-200 bg-white px-4 py-2 text-sm font-bold text-blue-800 hover:bg-blue-50";
const card = "min-w-0 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7";

export function MyLeadershipDashboard({ plans }: { plans: Plan[] }) {
  const [tasks, setTasks] = useState<Milestone[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [tasksError, setTasksError] = useState("");
  const [reportsError, setReportsError] = useState("");
  const [loadingTasks, setLoadingTasks] = useState(true);
  const [loadingReports, setLoadingReports] = useState(true);
  const [month] = useState(() => denverDay().slice(0, 7));

  useEffect(() => {
    let active = true;
    async function loadTasks() {
      try {
        const response = await fetch("/api/vision/milestones", { cache: "no-store" });
        const json = await response.json() as MilestoneResponse;
        if (!response.ok) throw new Error(json.error || "Tasks are unavailable.");
        if (active) setTasks(json.milestones ?? []);
      } catch (e) {
        if (active) setTasksError(e instanceof Error ? e.message : "Unable to load responsibilities.");
      } finally { if (active) setLoadingTasks(false); }
    }
    async function loadReports() {
      try {
        const response = await fetch("/api/ministry-reports?reportMonth=" + encodeURIComponent(month), { cache: "no-store" });
        const json = await response.json() as ReportResponse;
        // Vision reviewers may have no separate monthly-report role.
        // Treat the reporting API's explicit 403 as no reporting access,
        // without revealing other groups' private reports.
        if (response.status === 403) {
          if (active) { setReports([]); setGroups([]); }
          return;
        }
        if (!response.ok) throw new Error(json.error || "Reports are unavailable.");
        if (active) { setReports(json.reports ?? []); setGroups(json.leaderGroups ?? []); }
      } catch (e) {
        if (active) setReportsError(e instanceof Error ? e.message : "Unable to load monthly reporting.");
      } finally { if (active) setLoadingReports(false); }
    }
    void loadTasks();
    void loadReports();
    return () => { active = false; };
  }, [month]);

  const today = denverDay();
  const openTasks = useMemo(() => tasks.filter(task => task.status !== "complete").sort((a, b) => a.dueOn.localeCompare(b.dueOn)), [tasks]);
  const overdue = openTasks.filter(task => task.dueOn < today);
  const finished = tasks.filter(task => task.status === "complete").length;
  const completePercent = tasks.length ? Math.round(finished / tasks.length * 100) : 0;
  const reviewPending = plans.filter(plan => plan.assignments.some(a => !a.submittedAt));
  const unread = plans.filter(plan => plan.assignments.some(a => !a.acknowledgedAt));
  const byGroup = new Map(reports.map(report => [report.groupId, report]));
  const waitingReports = groups.filter(group => !byGroup.get(group.id) || byGroup.get(group.id)?.status === "draft" || byGroup.get(group.id)?.status === "returned");
  const withFeedback = reports.filter(report => (report.reviewerNotes?.trim() || report.actionSteps?.trim()) && (report.status === "reviewed" || report.status === "returned"));
  const monthLabel = new Intl.DateTimeFormat("en-US", { month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(month + "-01T12:00:00Z"));

  return <section aria-label="My leadership dashboard" className="min-w-0 space-y-5">
    <div className="space-y-2">
      <p className="text-sm font-extrabold uppercase tracking-wide text-blue-800">2027 Expansion · My leadership</p>
      <h2 className="text-2xl font-extrabold leading-snug text-slate-950 sm:text-3xl">My Leadership Dashboard</h2>
      <p className="max-w-3xl text-base leading-relaxed text-slate-700">Your assigned visions, responsibilities, monthly reports, and pastoral direction together. All information remains private to your authorized ministry role.</p>
    </div>
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      <div className="rounded-xl border border-blue-100 bg-blue-50 p-4"><p className="text-sm font-semibold text-blue-900">My visions</p><p className="mt-1 text-3xl font-extrabold text-blue-950">{plans.length}</p></div>
      <div className="rounded-xl border border-amber-100 bg-amber-50 p-4"><p className="text-sm font-semibold text-amber-950">Vision responses due</p><p className="mt-1 text-3xl font-extrabold text-amber-950">{reviewPending.length}</p></div>
      <div className="rounded-xl border border-slate-200 bg-slate-50 p-4"><p className="text-sm font-semibold text-slate-700">Open responsibilities</p><p className="mt-1 text-3xl font-extrabold text-slate-950">{loadingTasks ? "—" : tasksError ? "!" : openTasks.length}</p></div>
      <div className="rounded-xl border border-rose-100 bg-rose-50 p-4"><p className="text-sm font-semibold text-rose-950">Overdue tasks</p><p className="mt-1 text-3xl font-extrabold text-rose-950">{loadingTasks ? "—" : tasksError ? "!" : overdue.length}</p></div>
    </div>
    <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
      <section className={card + " space-y-4"} aria-label="My next actions">
        <h3 className="text-xl font-extrabold text-slate-950">My next actions</h3>
        <p className="text-sm text-slate-600">Start with the items needing your attention.</p>
        <div className="space-y-2">
          {unread.slice(0, 4).map(plan => <Link key={"read-" + plan.id} href={"/leadership/vision/" + encodeURIComponent(plan.id) + "#vision-response"} className="block rounded-xl border border-blue-100 bg-blue-50 p-3">
            <p className="text-sm font-bold text-blue-900">Read and acknowledge vision</p><p className="mt-1 break-words text-base font-semibold text-slate-950">{plan.title}</p>
          </Link>)}
          {reviewPending.slice(0, 4).map(plan => <Link key={"respond-" + plan.id} href={"/leadership/vision/" + encodeURIComponent(plan.id) + "#vision-response"} className="block rounded-xl border border-slate-200 p-3">
            <p className="text-sm font-bold text-amber-900">Complete leadership response</p><p className="mt-1 break-words text-base font-semibold text-slate-950">{plan.title}</p>
          </Link>)}
          {openTasks.slice(0, 5).map(task => <Link key={task.id} href={"/leadership/vision/" + encodeURIComponent(task.planId) + "#vision-accountability"} className="block rounded-xl border border-slate-200 p-3">
            <p className={"text-sm font-bold " + (task.dueOn < today ? "text-rose-800" : "text-blue-800")}>{task.dueOn < today ? "Overdue" : "Due"} · {niceDate(task.dueOn)}</p>
            <p className="mt-1 break-words text-base font-semibold text-slate-950">{task.title}</p><p className="text-sm text-slate-600">{task.plan?.title}</p>
          </Link>)}
          {!loadingReports && !reportsError && waitingReports.slice(0, 4).map(group => <Link key={"report-" + group.id} href={"/groups/" + encodeURIComponent(group.id) + "?report=1"} className="block rounded-xl border border-amber-100 bg-amber-50 p-3">
            <p className="text-sm font-bold text-amber-950">{byGroup.get(group.id)?.status === "returned" ? "Make requested corrections" : byGroup.get(group.id)?.status === "draft" ? "Finish monthly report" : "Start monthly report"} · {monthLabel}</p>
            <p className="mt-1 break-words text-base font-semibold text-slate-950">{group.name}</p>
          </Link>)}
          {!loadingTasks && !loadingReports && unread.length === 0 && reviewPending.length === 0 && openTasks.length === 0 && waitingReports.length === 0 && !tasksError && !reportsError && <p className="rounded-xl bg-emerald-50 p-4 text-base font-semibold text-emerald-900">No outstanding actions in the current dashboard.</p>}
        </div>
        {(loadingTasks || loadingReports) && <p role="status" className="text-sm text-slate-600">Checking responsibilities and reports…</p>}
        {tasksError && <p role="alert" className="text-sm font-semibold text-rose-900">Responsibilities: {tasksError}</p>}
        {reportsError && <p role="alert" className="text-sm font-semibold text-rose-900">Monthly reports: {reportsError}</p>}
      </section>
      <section className={card + " space-y-4"} aria-label="My vision plan progress">
        <h3 className="text-xl font-extrabold text-slate-950">My 2027 ministry visions</h3>
        {plans.length === 0 && <p className="text-base text-slate-700">No 2027 ministry visions have been assigned to you yet.</p>}
        {plans.map(plan => {
          const assignment = plan.assignments[0];
          return <Link href={"/leadership/vision/" + encodeURIComponent(plan.id)} key={plan.id} className="block min-w-0 space-y-2 rounded-xl border border-slate-200 bg-slate-50 p-4 hover:border-blue-300">
            <p className="break-words text-lg font-extrabold leading-snug text-slate-950">{plan.title}</p>
            <div className="flex flex-wrap gap-2">
              <span className="rounded-full bg-white px-3 py-1 text-xs font-bold capitalize text-slate-800">{plan.status}</span>
              <span className={"rounded-full px-3 py-1 text-xs font-bold " + (assignment?.submittedAt ? "bg-emerald-100 text-emerald-900" : "bg-amber-100 text-amber-950")}>{assignment?.submittedAt ? "Response submitted" : "Response pending"}</span>
            </div>
            <p className="text-sm text-slate-700">{assignment?.acknowledgedAt ? "Vision acknowledged" : "Awaiting acknowledgement"}{assignment?.deadline ? " · Response deadline " + niceDate(assignment.deadline) : ""}</p>
          </Link>;
        })}
        <div className="flex flex-wrap gap-2 border-t border-slate-100 pt-4">
          <Link href="#vision-directory" className={button}>Browse my visions</Link>
          <Link href="#vision-reporting" className={button}>Monthly reports</Link>
        </div>
      </section>
      <section className={card + " space-y-4"} aria-label="Responsibility progress">
        <h3 className="text-xl font-extrabold text-slate-950">Responsibility progress</h3>
        <div className="flex items-end justify-between gap-2"><p className="text-base font-semibold text-slate-700">2027 assigned tasks</p><p className="text-xl font-extrabold text-blue-900">{loadingTasks ? "—" : tasksError ? "Unavailable" : completePercent + "%"}</p></div>
        <div className="h-3 w-full overflow-hidden rounded-full bg-slate-200" role="progressbar" aria-label="Completed ministry responsibilities" aria-valuenow={tasksError ? 0 : completePercent} aria-valuemin={0} aria-valuemax={100}><div className="h-full rounded-full bg-blue-700" style={{ width: completePercent + "%" }} /></div>
        <p className="text-base text-slate-700">{loadingTasks ? "Loading progress…" : tasksError ? "Progress unavailable." : finished + " completed of " + tasks.length + " assigned responsibilities"}</p>
        <p className="text-sm text-slate-600">Tasks appear after their ministry vision is approved. Use the related vision page to mark a responsibility complete.</p>
      </section>
      <section className={card + " space-y-4"} aria-label="Monthly reports and pastoral feedback">
        <h3 className="text-xl font-extrabold text-slate-950">Reports & pastoral feedback</h3>
        <p className="text-sm font-semibold text-slate-700">{monthLabel} reporting</p>
        {!loadingReports && !reportsError && groups.length === 0 && <p className="text-base text-slate-700">No ministry report role is assigned to your account. Vision review access alone does not grant access to private ministry reports.</p>}
        {groups.map(group => {
          const report = byGroup.get(group.id);
          return <div key={group.id} className="space-y-2 rounded-xl border border-slate-200 p-4">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <p className="min-w-0 break-words text-base font-bold text-slate-950">{group.name}</p>
              <span className={"rounded-full px-3 py-1 text-xs font-bold capitalize " + (statusColors[report?.status ?? "missing"] ?? statusColors.missing)}>{report?.status ?? "Not started"}</span>
            </div>
            {report?.reviewerNotes && <p className="whitespace-pre-wrap break-words text-sm text-slate-800"><strong>Pastoral feedback:</strong> {report.reviewerNotes}</p>}
            {report?.actionSteps && <p className="whitespace-pre-wrap break-words text-sm text-slate-800"><strong>Next actions:</strong> {report.actionSteps}</p>}
            <Link href={"/groups/" + encodeURIComponent(group.id) + "?report=1"} className={button}>{!report ? "Start report" : report.status === "returned" ? "Address corrections" : report.status === "draft" ? "Continue draft" : "Open monthly report"}</Link>
          </div>;
        })}
        {withFeedback.length > 0 && <p className="text-sm font-semibold text-blue-900">{withFeedback.length} {withFeedback.length === 1 ? "report contains" : "reports contain"} pastoral feedback or action steps.</p>}
        <Link href="#vision-reporting" className={button}>See full reporting history</Link>
      </section>
    </div>
  </section>;
}
