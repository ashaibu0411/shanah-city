"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";

type Milestone = {
  id: string; planId: string; assigneeId: string; kind: string; period: string;
  title: string; description: string; dueOn: string; status: string;
  completedAt?: string | null; plan?: { title: string; status: string };
};
type Leader = { id: string; name: string };
const field = "w-full min-w-0 rounded-xl border border-slate-300 bg-white px-4 py-3 text-base font-medium text-slate-900";
const action = "rounded-xl bg-blue-700 px-5 py-3 text-base font-bold text-white disabled:opacity-50";

function denverToday() {
  const parts = new Intl.DateTimeFormat("en-US", { timeZone: "America/Denver", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(new Date());
  const part = (kind: string) => parts.find(p => p.type === kind)?.value ?? "";
  return part("year") + "-" + part("month") + "-" + part("day");
}

export function VisionMilestonePanel({ planId, owner, leaders, assignedLeaderIds }: {
  planId: string; owner: boolean; leaders: Leader[]; assignedLeaderIds: string[];
}) {
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const [assigneeId, setAssigneeId] = useState("");
  const [title, setTitle] = useState("");
  const [dueOn, setDueOn] = useState("");
  const [description, setDescription] = useState("");
  const [taskView, setTaskView] = useState<"open" | "all" | "completed">("open");
  const [month, setMonth] = useState(() => {
    const today = denverToday().slice(0, 7);
    return today < "2027-01" ? "2027-01" : today > "2027-12" ? "2027-12" : today;
  });
  const reload = useCallback(async () => {
    const response = await fetch("/api/vision/milestones?planId=" + encodeURIComponent(planId), { cache: "no-store" });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Unable to open leadership milestones.");
    setMilestones(data.milestones ?? []);
  }, [planId]);
  useEffect(() => { void reload().catch(e => setError(String(e))); }, [reload]);

  const shown = useMemo(() => milestones
    .filter(task =>
      (task.dueOn.slice(0, 7) === month || (task.status !== "complete" && task.dueOn < denverToday())) &&
      (taskView === "all" || (taskView === "completed" ? task.status === "complete" : task.status !== "complete"))
    )
    .sort((a, b) => a.dueOn.localeCompare(b.dueOn)), [milestones, month, taskView]);
  const done = milestones.filter(t => t.status === "complete").length;
  const overdue = milestones.filter(t => t.status !== "complete" && t.dueOn < denverToday()).length;
  const pending = milestones.length - done;
  const percent = milestones.length ? Math.round(done / milestones.length * 100) : 0;

  async function submit(payload: Record<string, unknown>) {
    setBusy(true); setError(""); setNotice("");
    try {
      const response = await fetch("/api/vision/milestones", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId, ...payload }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Update failed.");
      await reload();
      setNotice("Milestone updated.");
      if (payload.action === "create") { setTitle(""); setDescription(""); setDueOn(""); }
    } catch (e) { setError(e instanceof Error ? e.message : "Update failed."); }
    finally { setBusy(false); }
  }

  return (
    <section className="min-w-0 space-y-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-8 lg:p-10">
      <div className="space-y-2">
        <p className="text-sm font-extrabold uppercase tracking-wide text-blue-800">2027 leadership accountability</p>
        <h2 className="text-2xl font-extrabold text-slate-950 sm:text-3xl">Monthly responsibilities & reminders</h2>
        <p className="text-base leading-relaxed text-slate-700">Private leadership deadlines. These are not public calendar events. Confirm actual event dates in the existing church Calendar.</p>
      </div>
      {error && <p role="alert" className="rounded-xl bg-red-50 p-4 font-semibold text-red-800">{error}</p>}
      {notice && <p role="status" className="rounded-xl bg-blue-50 p-4 font-semibold text-blue-800">{notice}</p>}
      <div className="grid grid-cols-2 gap-3 text-base font-bold sm:grid-cols-4" aria-label="Leadership task summary">
        <div className="rounded-xl bg-slate-50 p-4"><p className="text-sm text-slate-600">Total tasks</p><p className="mt-1 text-2xl font-extrabold text-slate-950">{milestones.length}</p></div>
        <div className="rounded-xl bg-emerald-50 p-4"><p className="text-sm text-emerald-800">Completed</p><p className="mt-1 text-2xl font-extrabold text-emerald-950">{done}</p></div>
        <div className="rounded-xl bg-blue-50 p-4"><p className="text-sm text-blue-800">Still to do</p><p className="mt-1 text-2xl font-extrabold text-blue-950">{pending}</p></div>
        <div className="rounded-xl bg-amber-50 p-4"><p className="text-sm text-amber-900">Overdue</p><p className="mt-1 text-2xl font-extrabold text-amber-950">{overdue}</p></div>
      </div>
      <div className="space-y-2" aria-label={"Annual task completion " + percent + " percent"}>
        <div className="flex items-center justify-between gap-3 text-sm font-semibold text-slate-700"><span>2027 accountability progress</span><span>{percent}% completed</span></div>
        <div className="h-3 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-blue-700 transition-all" style={{ width: percent + "%" }} /></div>
      </div>
      <div className="flex flex-wrap gap-2" role="group" aria-label="Filter leadership tasks">
        {([["open", "To do"], ["all", "All tasks"], ["completed", "Completed"]] as const).map(([key, label]) =>
          <button type="button" key={key} aria-pressed={taskView === key} onClick={() => setTaskView(key)} className={"min-h-[44px] rounded-full px-5 py-2 text-sm font-bold " + (taskView === key ? "bg-blue-700 text-white" : "border border-slate-200 bg-white text-slate-800")}>{label}</button>
        )}
      </div>
      <label className="block max-w-xs space-y-2 text-base font-bold text-slate-900">
        Review month
        <select className={field} value={month} onChange={e => setMonth(e.target.value)}>
          {Array.from({ length: 12 }, (_, i) => {
            const val = "2027-" + String(i + 1).padStart(2, "0");
            const label = new Intl.DateTimeFormat("en-US", { month: "long", timeZone: "UTC" }).format(new Date(Date.UTC(2027, i, 1)));
            return <option key={val} value={val}>{label} 2027</option>;
          })}
        </select>
      </label>
      {milestones.length === 0 && <p className="text-base font-medium text-slate-600">No implementation tasks have been assigned yet. The Senior Pastor can add objectives and deadlines below.</p>}
      {milestones.length > 0 && shown.length === 0 && <p role="status" className="rounded-xl bg-slate-50 p-5 text-base font-medium text-slate-600">No matching tasks for this month. Try All tasks or choose another month.</p>}
      <div className="grid min-w-0 grid-cols-1 gap-4 lg:grid-cols-2">
        {shown.map(task => <article key={task.id} className="min-w-0 space-y-3 break-words rounded-2xl border border-slate-200 bg-slate-50 p-5 sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-sm font-extrabold text-blue-800">Due {task.dueOn}</span>
            <span className="rounded-full bg-white px-3 py-1 text-sm font-bold capitalize text-slate-700">{task.status === "complete" ? "Completed" : task.dueOn < denverToday() ? "Overdue" : "Pending"}</span>
          </div>
          <h3 className="text-lg font-extrabold leading-snug text-slate-950">{task.title}</h3>
          <p className="text-xs font-bold uppercase tracking-wide text-slate-500">{task.kind.replaceAll("-", " ")}</p>
          <p className="text-base leading-relaxed text-slate-700">{task.description}</p>
          {owner && <p className="text-sm font-semibold text-slate-600">Assigned to: {leaders.find(l => l.id === task.assigneeId)?.name ?? "Assigned ministry leader"}</p>}
          <button type="button" className={action} disabled={busy} onClick={() => void submit({ action: task.status === "complete" ? "reopen" : "complete", id: task.id })}>
            {task.status === "complete" ? "Reopen task" : "Mark complete"}
          </button>
        </article>)}
      </div>
      {owner && <form className="space-y-4 border-t border-slate-200 pt-7" onSubmit={e => { e.preventDefault(); void submit({ action: "create", assigneeId, title, description, dueOn }); }}>
        <h3 className="text-xl font-extrabold text-slate-950">Schedule a specific leadership deadline</h3>
        <p className="text-base text-slate-600">Choose any leader assigned to this approved vision, including newly appointed leaders. Create clear implementation objectives with specific deadlines. This does not publish a church event.</p>
        <div className="grid min-w-0 grid-cols-1 gap-4 md:grid-cols-2">
          <label className="block space-y-2 text-base font-bold">Assigned leader
            <select className={field} required value={assigneeId} onChange={e => setAssigneeId(e.target.value)}>
              <option value="">Choose assigned leader</option>
              {assignedLeaderIds.map(id => <option value={id} key={id}>{leaders.find(l => l.id === id)?.name ?? "Assigned leader (" + id.slice(0, 8) + "…)"} </option>)}
            </select>
          </label>
          <label className="block space-y-2 text-base font-bold">Due date
            <input className={field} type="date" required value={dueOn} onChange={e => setDueOn(e.target.value)}/>
          </label>
        </div>
        <input className={field} value={title} onChange={e => setTitle(e.target.value)} placeholder="Leadership milestone title" maxLength={180} required />
        <textarea className={field + " min-h-28"} value={description} onChange={e => setDescription(e.target.value)} placeholder="What needs to be prepared or delivered?" maxLength={1600}/>
        <button className={action} disabled={busy}>Add leadership deadline</button>
      </form>}
      <p className="border-t border-slate-200 pt-5 text-sm leading-relaxed text-slate-600">
        Monthly summaries and 7-day/1-day reminders use the app's existing notification preferences and device registration. Progress reports remain in the existing <Link href="/groups" className="font-bold text-blue-800 underline">Ministries</Link> area.
      </p>
    </section>
  );
}

export function VisionAccountabilityOverview() {
  const [plans, setPlans] = useState<Array<{ id: string; title: string; status: string; assignments: Array<{userId:string;status:string;acknowledgedAt:string|null;submittedAt:string|null}>; milestones: Array<{status:string;dueOn:string}>; latestReport?: { month: string; status: string } | null; submittedReports?: number; reportIntegrated?: boolean }>>([]);
  const [error, setError] = useState("");
  const [overviewFilter, setOverviewFilter] = useState<"all" | "needs-review" | "overdue">("all");
  const [search, setSearch] = useState("");
  useEffect(() => {
    fetch("/api/vision/milestones?overview=1", { cache: "no-store" })
      .then(async r => { const j = await r.json(); if (!r.ok) throw new Error(j.error || "Unable to load overview"); return j; })
      .then(j => setPlans(j.plans || []))
      .catch(e => setError(String(e)));
  }, []);
  const totalAssigned = plans.reduce((sum, p) => sum + p.assignments.length, 0);
  const responded = plans.reduce((sum, p) => sum + p.assignments.filter(a => a.submittedAt).length, 0);
  const overdueTotal = plans.reduce((sum, p) => sum + p.milestones.filter(t => t.status !== "complete" && t.dueOn < denverToday()).length, 0);
  const shownPlans = plans.filter(p => {
    if (search && !p.title.toLowerCase().includes(search.trim().toLowerCase())) return false;
    if (overviewFilter === "needs-review") return p.assignments.some(a => !a.submittedAt);
    if (overviewFilter === "overdue") return p.milestones.some(t => t.status !== "complete" && t.dueOn < denverToday());
    return true;
  });
  return <section className="space-y-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-8 lg:p-10">
    <h2 className="text-2xl font-extrabold text-slate-950 sm:text-3xl">Pastoral accountability overview</h2>
    <p className="text-base text-slate-700">Track assigned leaders, acknowledgement, submitted vision proposals and outstanding responsibilities across the ministry plans.</p>
    {error && <p role="alert" className="text-red-800">{error}</p>}
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4" aria-label="Churchwide leadership progress">
      <div className="rounded-xl bg-blue-50 p-4"><p className="text-sm font-semibold text-blue-800">Ministry plans</p><p className="mt-1 text-2xl font-extrabold text-blue-950">{plans.length}</p></div>
      <div className="rounded-xl bg-slate-100 p-4"><p className="text-sm font-semibold text-slate-700">Leader assignments</p><p className="mt-1 text-2xl font-extrabold text-slate-950">{totalAssigned}</p></div>
      <div className="rounded-xl bg-emerald-50 p-4"><p className="text-sm font-semibold text-emerald-800">Submitted reviews</p><p className="mt-1 text-2xl font-extrabold text-emerald-950">{responded}</p></div>
      <div className="rounded-xl bg-amber-50 p-4"><p className="text-sm font-semibold text-amber-900">Overdue tasks</p><p className="mt-1 text-2xl font-extrabold text-amber-950">{overdueTotal}</p></div>
    </div>
    <div className="flex flex-col gap-3 md:flex-row md:items-end">
      <label className="min-w-0 flex-1 text-sm font-bold text-slate-800">Find a ministry
        <input type="search" className={field + " mt-2"} value={search} onChange={e => setSearch(e.target.value)} placeholder="Search ministry names…" />
      </label>
      <label className="min-w-0 text-sm font-bold text-slate-800 md:w-60">Show plans
        <select className={field + " mt-2"} value={overviewFilter} onChange={e => setOverviewFilter(e.target.value as typeof overviewFilter)}>
          <option value="all">All ministries</option>
          <option value="needs-review">Awaiting leader response</option>
          <option value="overdue">With overdue tasks</option>
        </select>
      </label>
    </div>
    {plans.length > 0 && shownPlans.length === 0 && <p role="status" className="rounded-xl bg-slate-50 p-4 text-sm font-medium text-slate-700">No ministries match your filters.</p>}
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      {shownPlans.map(plan => {
        const late = plan.milestones.filter(t => t.status !== "complete" && t.dueOn < denverToday()).length;
        const done = plan.milestones.filter(t => t.status === "complete").length;
        return <Link href={"/leadership/vision/" + encodeURIComponent(plan.id)} key={plan.id} className="min-w-0 space-y-3 rounded-2xl border border-slate-200 bg-slate-50 p-5 hover:border-blue-400">
          <h3 className="text-lg font-extrabold leading-snug text-slate-950">{plan.title}</h3>
          <p className="text-base font-semibold capitalize text-slate-600">{plan.status.replaceAll("_"," ")} · {plan.assignments.length} assigned leaders</p>
          <p className="text-base text-slate-700">{plan.assignments.filter(a => a.acknowledgedAt).length} acknowledged · {plan.assignments.filter(a => a.submittedAt).length} proposals submitted</p>
          <p className="text-base font-bold text-slate-800">{done} tasks complete · {late} overdue · {plan.milestones.length} total</p>
          {plan.milestones.length > 0 && <div className="h-2.5 overflow-hidden rounded-full bg-slate-200" aria-label={Math.round(done / plan.milestones.length * 100) + "% of ministry tasks complete"}>
            <div className="h-full rounded-full bg-blue-700" style={{ width: Math.round(done / plan.milestones.length * 100) + "%" }} />
          </div>}
          <p className="text-sm font-bold text-blue-800">Review ministry direction and tasks →</p>
          {plan.reportIntegrated && <p className="text-sm font-semibold text-slate-700">Monthly ministry reports: {plan.submittedReports ?? 0} submitted/reviewed in 2027 · Latest: {plan.latestReport ? plan.latestReport.month + " (" + plan.latestReport.status + ")" : "Not yet reported"}</p>}
        </Link>;
      })}
    </div>
  </section>;
}

export function VisionMyUpcoming() {
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  useEffect(() => { fetch("/api/vision/milestones", { cache: "no-store" })
    .then(async r => r.ok ? r.json() : null)
    .then(j => setMilestones(j?.milestones || [])).catch(() => undefined); }, []);
  const pending = milestones.filter(m => m.status !== "complete").sort((a, b) => a.dueOn.localeCompare(b.dueOn)).slice(0, 8);
  const overdue = pending.filter(m => m.dueOn < denverToday()).length;
  if (!pending.length) return null;
  return <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 sm:p-8">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <h2 className="text-2xl font-extrabold text-slate-950">My upcoming ministry responsibilities</h2>
      {overdue > 0 && <span className="rounded-full bg-amber-100 px-4 py-2 text-sm font-extrabold text-amber-950">{overdue} overdue in this list</span>}
    </div>
    <p className="text-sm font-medium text-slate-600">Your next eight incomplete responsibilities, sorted by due date. Open a ministry to update progress.</p>
    {pending.map(task => <Link key={task.id} href={"/leadership/vision/" + encodeURIComponent(task.planId)} className="block min-w-0 space-y-1 break-words border-b border-slate-100 py-3">
      <p className={"text-sm font-bold " + (task.dueOn < denverToday() ? "text-amber-900" : "text-blue-800")}>{task.dueOn < denverToday() ? "Overdue · " : "Due · "}{task.dueOn}</p><p className="text-base font-extrabold text-slate-900">{task.title}</p>
      {task.plan && <p className="text-sm text-slate-600">{task.plan.title}</p>}
    </Link>)}
  </section>;
}
