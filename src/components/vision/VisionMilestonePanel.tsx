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

export function VisionMilestonePanel({ planId, owner, leaders }: {
  planId: string; owner: boolean; leaders: Leader[];
}) {
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const [assigneeId, setAssigneeId] = useState("");
  const [title, setTitle] = useState("");
  const [dueOn, setDueOn] = useState("");
  const [description, setDescription] = useState("");
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

  const shown = useMemo(() =>
    milestones.filter(task => task.dueOn.slice(0, 7) === month ||
      (task.status !== "complete" && task.dueOn < denverToday())), [milestones, month]);
  const done = milestones.filter(t => t.status === "complete").length;
  const overdue = milestones.filter(t => t.status !== "complete" && t.dueOn < denverToday()).length;

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
      <div className="flex flex-wrap gap-3 text-base font-bold text-slate-700">
        <span className="rounded-xl bg-slate-100 px-4 py-2">{milestones.length} tasks</span>
        <span className="rounded-xl bg-slate-100 px-4 py-2">{done} complete</span>
        <span className="rounded-xl bg-slate-100 px-4 py-2">{overdue} overdue</span>
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
      {milestones.length === 0 && <p className="text-base font-medium text-slate-600">Accountability tasks appear when a leader is assigned and the annual vision is approved.</p>}
      {milestones.length > 0 && shown.length === 0 && <p className="text-base font-medium text-slate-600">No tasks due this month or overdue.</p>}
      <div className="grid min-w-0 grid-cols-1 gap-4 lg:grid-cols-2">
        {shown.map(task => <article key={task.id} className="min-w-0 space-y-3 break-words rounded-2xl border border-slate-200 bg-slate-50 p-5 sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-sm font-extrabold text-blue-800">Due {task.dueOn}</span>
            <span className="rounded-full bg-white px-3 py-1 text-sm font-bold capitalize text-slate-700">{task.status === "complete" ? "Completed" : task.dueOn < denverToday() ? "Overdue" : "Pending"}</span>
          </div>
          <h3 className="text-lg font-extrabold leading-snug text-slate-950">{task.title}</h3>
          <p className="text-base leading-relaxed text-slate-700">{task.description}</p>
          {owner && <p className="text-sm font-semibold text-slate-600">Assigned to: {leaders.find(l => l.id === task.assigneeId)?.name ?? "Assigned ministry leader"}</p>}
          <button type="button" className={action} disabled={busy} onClick={() => void submit({ action: task.status === "complete" ? "reopen" : "complete", id: task.id })}>
            {task.status === "complete" ? "Reopen task" : "Mark complete"}
          </button>
        </article>)}
      </div>
      {owner && <form className="space-y-4 border-t border-slate-200 pt-7" onSubmit={e => { e.preventDefault(); void submit({ action: "create", assigneeId, title, description, dueOn }); }}>
        <h3 className="text-xl font-extrabold text-slate-950">Schedule a specific leadership deadline</h3>
        <p className="text-base text-slate-600">Use this for confirmed planning milestones; it does not create or publish a church event.</p>
        <div className="grid min-w-0 grid-cols-1 gap-4 md:grid-cols-2">
          <label className="block space-y-2 text-base font-bold">Assigned leader
            <select className={field} required value={assigneeId} onChange={e => setAssigneeId(e.target.value)}>
              <option value="">Choose assigned leader</option>
              {leaders.filter(l => milestones.some(m => m.assigneeId === l.id)).map(l => <option value={l.id} key={l.id}>{l.name}</option>)}
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
  useEffect(() => {
    fetch("/api/vision/milestones?overview=1", { cache: "no-store" })
      .then(async r => { const j = await r.json(); if (!r.ok) throw new Error(j.error || "Unable to load overview"); return j; })
      .then(j => setPlans(j.plans || []))
      .catch(e => setError(String(e)));
  }, []);
  return <section className="space-y-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-8 lg:p-10">
    <h2 className="text-2xl font-extrabold text-slate-950 sm:text-3xl">Pastoral accountability overview</h2>
    <p className="text-base text-slate-700">Track assigned leaders, acknowledgement, submitted vision proposals and outstanding responsibilities across the ministry plans.</p>
    {error && <p role="alert" className="text-red-800">{error}</p>}
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      {plans.map(plan => {
        const late = plan.milestones.filter(t => t.status !== "complete" && t.dueOn < denverToday()).length;
        const done = plan.milestones.filter(t => t.status === "complete").length;
        return <Link href={"/leadership/vision/" + encodeURIComponent(plan.id)} key={plan.id} className="min-w-0 space-y-3 rounded-2xl border border-slate-200 bg-slate-50 p-5 hover:border-blue-400">
          <h3 className="text-lg font-extrabold leading-snug text-slate-950">{plan.title}</h3>
          <p className="text-base font-semibold capitalize text-slate-600">{plan.status.replaceAll("_"," ")} · {plan.assignments.length} assigned leaders</p>
          <p className="text-base text-slate-700">{plan.assignments.filter(a => a.acknowledgedAt).length} acknowledged · {plan.assignments.filter(a => a.submittedAt).length} proposals submitted</p>
          <p className="text-base font-bold text-slate-800">{done} tasks complete · {late} overdue · {plan.milestones.length} total</p>
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
  const pending = milestones.filter(m => m.status !== "complete").slice(0, 8);
  if (!pending.length) return null;
  return <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 sm:p-8">
    <h2 className="text-2xl font-extrabold text-slate-950">My upcoming ministry responsibilities</h2>
    {pending.map(task => <Link key={task.id} href={"/leadership/vision/" + encodeURIComponent(task.planId)} className="block min-w-0 space-y-1 break-words border-b border-slate-100 py-3">
      <p className="text-sm font-bold text-blue-800">{task.dueOn}</p><p className="text-base font-extrabold text-slate-900">{task.title}</p>
      {task.plan && <p className="text-sm text-slate-600">{task.plan.title}</p>}
    </Link>)}
  </section>;
}
