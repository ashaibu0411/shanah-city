"use client";

import { useCallback, useEffect, useRef, useState, type ChangeEvent, type FormEvent, type TextareaHTMLAttributes } from "react";
import { VisionDocument } from "@/components/vision/VisionDocument";
import { VisionAccountabilityOverview, VisionMilestonePanel } from "@/components/vision/VisionMilestonePanel";
import { MyLeadershipDashboard } from "@/components/vision/MyLeadershipDashboard";
import { MenLegacyScorecard } from "@/components/vision/MenLegacyScorecard";
import { TransformedWomenScorecard } from "@/components/vision/TransformedWomenScorecard";
import { MinistryGrowthScorecard } from "@/components/vision/MinistryGrowthScorecard";
import Link from "next/link";
import { VisionShareButton } from "@/components/vision/VisionShareButton";
import { VisionMinistryReporting } from "@/components/vision/VisionMinistryReporting";

type Assignment = {
  id: string; userId: string; status: string; deadline?: string | null;
  acknowledgedAt?: string | null; capacity?: string | null;
  proposal?: string | null; supportNeeds?: string | null; submittedAt?: string | null;
};
type Comment = { id: string; authorName: string; kind: string; sectionKey: string; body: string; referenceUrl?: string | null; decision: string; decisionNote?: string | null; createdAt: string };
type AuditEvent = { id: string; actorId: string; action: string; detail?: string | null; createdAt: string };
type Plan = { id: string; title: string; ministryKey: string; summary: string; content: string; status: string; version: number; assignments: Assignment[]; comments?: Comment[]; audits?: AuditEvent[]; _count?: { comments: number } };
type Ministry = { key: string; title: string };
type Leader = { id: string; name: string };
type SearchMember = Leader & { email: string };
type Result = { error?: string; plan?: Plan; plans?: Plan[]; ministries?: Ministry[]; isOwner?: boolean; leaders?: Leader[]; pastoralReviewers?: Leader[]; memberResults?: SearchMember[]; assignedCount?: number };

function GrowingVisionTextarea({ value, className = "", ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const ref = useRef<HTMLTextAreaElement>(null);
  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    element.style.height = "auto";
    element.style.height = Math.max(360, element.scrollHeight + 2) + "px";
  }, [value]);
  return <textarea {...props} ref={ref} value={value} rows={10} className={className + " resize-y overflow-hidden"} style={{ ...props.style, overflowY: "hidden", minHeight: "360px" }}/>;
}

const field = "w-full min-w-0 rounded-xl border border-slate-300 bg-white px-4 py-3.5 text-base font-medium leading-relaxed text-slate-900 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100";
const button = "rounded-xl bg-blue-700 px-5 py-3 text-base font-bold leading-snug text-white shadow-sm disabled:opacity-50";
const secondary = "rounded-xl border border-slate-300 bg-white px-5 py-3 text-base font-bold leading-snug text-slate-900 disabled:opacity-50";
const panel = "min-w-0 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-8 lg:p-10";

function ApprovalHistoryPanel({ audits, leaders }: { audits: AuditEvent[]; leaders: Leader[] }) {
  const labelFor = (actorId: string) => leaders.find(l => l.id === actorId)?.name ?? "Leadership";
  return (
    <div className="border-t border-slate-200 pt-7">
      <h4 className="text-xl font-extrabold text-slate-950">Approval & review history</h4>
      <ul className="mt-5 space-y-4">
        {audits.map(entry => (
          <li key={entry.id} className="min-w-0 break-words rounded-xl border border-slate-200 bg-slate-50 p-5 text-base leading-relaxed text-slate-800">
            <p className="font-semibold capitalize text-slate-900">{entry.action.replaceAll("_", " ")}</p>
            <p className="mt-2 text-sm font-medium text-slate-600">{labelFor(entry.actorId)} · {new Date(entry.createdAt).toLocaleString()}</p>
            {entry.detail ? <p className="mt-3 break-words text-slate-800">{entry.detail}</p> : null}
          </li>
        ))}
      </ul>
    </div>
  );
}

async function request(method: string, data: Record<string, unknown>): Promise<Result> {
  const response = await fetch("/api/vision/plans", { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
  const json = (await response.json().catch(() => ({}))) as Result;
  if (!response.ok) throw new Error(json.error || "Could not save changes.");
  return json;
}

export function VisionCenterHub({ owner, planId }: { owner: boolean; planId?: string }) {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [visionSearch, setVisionSearch] = useState("");
  const [visionStatus, setVisionStatus] = useState("all");
  const [ministries, setMinistries] = useState<Ministry[]>([]);
  const [leaders, setLeaders] = useState<Leader[]>([]);
  const [pastoralReviewers, setPastoralReviewers] = useState<Leader[]>([]);
  const [selected, setSelected] = useState<Plan | null>(null);
  const [ministryKey, setMinistryKey] = useState("churchwide");
  const [summary, setSummary] = useState("");
  const [content, setContent] = useState("");
  const [assignUserId, setAssignUserId] = useState("");
  const [memberQuery, setMemberQuery] = useState("");
  const [memberResults, setMemberResults] = useState<SearchMember[]>([]);
  const [selectedMember, setSelectedMember] = useState<SearchMember | null>(null);
  const [memberSearchError, setMemberSearchError] = useState("");
  const [memberSearching, setMemberSearching] = useState(false);
  const [deadline, setDeadline] = useState("");
  const [capacity, setCapacity] = useState("with_support");
  const [proposal, setProposal] = useState("");
  const [supportNeeds, setSupportNeeds] = useState("");
  const [commentKind, setCommentKind] = useState("question");
  const [commentText, setCommentText] = useState("");
  const commentFormRef = useRef<HTMLFormElement>(null);
  const [designLink, setDesignLink] = useState("");
  const [sectionKey, setSectionKey] = useState("general");
  const [feedbackNote, setFeedbackNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [editingVision, setEditingVision] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  const refresh = useCallback(async (id?: string) => {
    const response = await fetch("/api/vision/plans", { cache: "no-store" });
    if (!response.ok) throw new Error("Cannot load private vision plans.");
    const data = (await response.json()) as Result;
    setPlans(data.plans || []);
    setMinistries(data.ministries || []);
    setLeaders(data.leaders || []);
    setPastoralReviewers(data.pastoralReviewers || []);
    if (id) {
      const detail = await fetch("/api/vision/plans?planId=" + encodeURIComponent(id), { cache: "no-store" });
      if (!detail.ok) throw new Error("Unable to open this assignment.");
      const plan = ((await detail.json()) as Result).plan || null;
      setSelected(plan);
      if (plan) {
        setEditingVision(false);
        setSummary(plan.summary); setContent(plan.content);
        const own = plan.assignments[0];
        setCapacity(own?.capacity || "with_support");
        setProposal(own?.proposal || "");
        setSupportNeeds(own?.supportNeeds || "");
      }
    }
  }, []);

  useEffect(() => { void refresh(planId).catch(e => setError(e instanceof Error ? e.message : String(e))); }, [refresh, planId]);

  useEffect(() => {
    if (!owner || !planId || memberQuery.trim().length < 2 || selectedMember) {
      setMemberResults([]);
      setMemberSearching(false);
      return;
    }
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setMemberSearching(true);
      setMemberSearchError("");
      try {
        const response = await fetch("/api/vision/plans?memberSearch=" + encodeURIComponent(memberQuery.trim()), {
          signal: controller.signal, cache: "no-store",
        });
        if (!response.ok) throw new Error("Member directory search is unavailable.");
        const data = (await response.json()) as Result;
        if (!controller.signal.aborted) setMemberResults(data.memberResults || []);
      } catch (e) {
        if (!controller.signal.aborted) setMemberSearchError(e instanceof Error ? e.message : "Search failed.");
      } finally {
        if (!controller.signal.aborted) setMemberSearching(false);
      }
    }, 250);
    return () => { window.clearTimeout(timer); controller.abort(); };
  }, [owner, planId, memberQuery, selectedMember]);

  async function run(method: string, data: Record<string, unknown>, reloadId?: string): Promise<boolean> {
    setBusy(true); setError(""); setNotice("");
    try {
      await request(method, data);
      await refresh(reloadId);
      setNotice("Saved.");
      return true;
    } catch (e) { setError(e instanceof Error ? e.message : "Could not save."); return false; }
    finally { setBusy(false); }
  }

  const myAssignment = selected?.assignments?.[0];
  const visiblePlans = plans.filter(plan =>
    (visionStatus === "all" || plan.status === visionStatus) &&
    `${plan.title} ${plan.summary} ${plan.ministryKey}`.toLowerCase().includes(visionSearch.trim().toLowerCase())
  );
  const awaitingResponse = plans.filter(plan => plan.status !== "approved" && plan.assignments.some(a => !a.submittedAt)).length;
  const approvedPlans = plans.filter(plan => plan.status === "approved").length;
  const selectedSubmitted = selected?.assignments.filter(a => Boolean(a.submittedAt)).length ?? 0;
  const selectedPending = (selected?.assignments.length ?? 0) - selectedSubmitted;
  const selectedFeedback = selected?.comments?.filter(c => c.kind === "idea" && c.decision === "pending").length ?? 0;
  const formatDeadline = (value?: string | null) => value
    ? new Date(value).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })
    : "Not set";
  function suggestFor(section: string) {
    setSectionKey(section.slice(0, 100));
    setCommentKind("idea");
    // Keep a pastor's unfinished note intact when jumping between sections.
    commentFormRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }
  return (
    <div className="vision-center-readable mx-auto w-full max-w-[1440px] min-w-0 space-y-8 px-1 pb-24 text-slate-900 sm:px-3 lg:px-6">
      <header className="rounded-3xl bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950 p-7 text-white shadow-lg sm:p-10 lg:p-12">
        <p className="text-sm font-extrabold uppercase tracking-[.1em] text-blue-100">Shanah City · Private leadership</p>
        <h1 className="mt-3 text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl">{planId ? "Ministry Vision" : "2027 Vision Center"}</h1>
        <p className="mt-4 max-w-3xl text-lg font-medium leading-relaxed text-slate-100">Expansion · Establishment · Excellence · Community Impact</p>
        <p className="mt-4 text-base font-semibold text-blue-100">{owner ? "Senior Pastor workspace" : "My assigned ministry visions"}</p>
        <div className="mt-7 flex flex-wrap gap-3">
          <span className="rounded-full border border-white/30 bg-white/10 px-4 py-2 text-sm font-semibold text-white">Private leadership workspace</span>
          <span className="rounded-full border border-white/30 bg-white/10 px-4 py-2 text-sm font-semibold text-white">2027 · Year of Expansion</span>
        </div>
      </header>
      {error && <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800">{error}</div>}
      {notice && <p role="status" className="rounded-xl border border-blue-200 bg-blue-50 p-3 text-sm text-blue-900">{notice}</p>}
      <div className="space-y-8">
        {!planId && (owner ? <VisionAccountabilityOverview /> : <MyLeadershipDashboard plans={plans} />)}
        {!planId && <div id="vision-reporting" className="scroll-mt-24"><VisionMinistryReporting owner={owner} /></div>}
        {!planId && <section id="vision-directory" aria-label="Ministry vision directory" className={panel + " scroll-mt-24 space-y-5"}>
          <h2 className="text-2xl font-extrabold tracking-tight text-slate-950 sm:text-3xl">Ministry visions</h2>
          <p className="text-base font-medium text-slate-600">Open a ministry to review its vision, submit feedback, and see next steps. Your work stays private to authorized leadership.</p>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3" aria-label="Vision center overview">
            <div className="rounded-xl bg-blue-50 p-4"><p className="text-sm font-semibold text-blue-800">Available visions</p><p className="mt-1 text-2xl font-extrabold text-blue-950">{plans.length}</p></div>
            <div className="rounded-xl bg-emerald-50 p-4"><p className="text-sm font-semibold text-emerald-800">Approved</p><p className="mt-1 text-2xl font-extrabold text-emerald-950">{approvedPlans}</p></div>
            <div className="col-span-2 rounded-xl bg-amber-50 p-4 sm:col-span-1"><p className="text-sm font-semibold text-amber-900">With pending leader responses</p><p className="mt-1 text-2xl font-extrabold text-amber-950">{awaitingResponse}</p></div>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <label className="flex-1 text-sm font-bold text-slate-700">Find a ministry
              <input type="search" className={field + " mt-2"} placeholder="Search visions or ministries" value={visionSearch} onChange={e => setVisionSearch(e.target.value)} />
            </label>
            <label className="text-sm font-bold text-slate-700 sm:w-52">Filter by status
              <select className={field + " mt-2"} value={visionStatus} onChange={e => setVisionStatus(e.target.value)}>
                <option value="all">All statuses</option>
                <option value="draft">Draft</option>
                <option value="assigned">Assigned</option>
                <option value="submitted">Submitted</option>
                <option value="approved">Approved</option>
              </select>
            </label>
          </div>
          {visiblePlans.length === 0 && plans.length > 0 && <p role="status" className="rounded-xl bg-slate-50 p-5 text-base font-semibold text-slate-700">No visions match your search. Clear the search or select All statuses.</p>}
          {plans.length === 0 && <p className="text-base font-medium text-slate-600">No visions assigned yet.</p>}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {visiblePlans.map(plan => (
            <Link href={"/leadership/vision/" + encodeURIComponent(plan.id)} key={plan.id}
              className={"min-w-0 w-full rounded-2xl border-2 p-5 text-left transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-200 " + (selected?.id === plan.id ? "border-blue-700 bg-blue-50" : "border-slate-200 bg-white hover:border-blue-300 hover:bg-slate-50")}>
              <span className="block break-words text-lg font-extrabold leading-snug text-slate-950">{plan.title}</span>
              <span className="mt-3 inline-block rounded-full bg-blue-50 px-3 py-1.5 text-sm font-bold capitalize text-blue-800">{plan.status.replaceAll("_", " ")}</span>
              <span className="mt-3 block text-sm leading-relaxed text-slate-600">{plan.summary.length > 145 ? plan.summary.slice(0, 142) + "…" : plan.summary}</span>
              <span className="mt-3 block text-sm font-semibold text-slate-700">{plan.assignments.length} leader {plan.assignments.length === 1 ? "assignment" : "assignments"} · {plan.assignments.filter(a => a.submittedAt).length} responses submitted</span>
              <span className="mt-4 inline-flex items-center text-sm font-extrabold text-blue-700">Open vision and next steps →</span>
            </Link>
          ))}
          </div>
          {owner && <p className="border-t pt-4 text-sm font-medium text-slate-600">New plans are private drafts, never public calendar events.</p>}
        </section>}
        <div className="min-w-0 space-y-8">
          {planId && !selected && !error && <div role="status" className={panel + " text-lg font-semibold text-slate-700"}>Opening ministry vision…</div>}
          {owner && !planId && !selected && plans.length === 0 && <button type="button" className={button} disabled={busy} onClick={() => void run("POST", { action: "initialize-2027" })}>Load nine private 2027 working drafts</button>}
          {owner && !planId && !selected && (
            <form className={panel + " space-y-4"} onSubmit={(event: FormEvent) => { event.preventDefault(); void run("POST", { action: "create", ministryKey, summary, content }); }}>
              <h2 className="text-2xl font-extrabold text-slate-950">Create ministry vision</h2>
              <select className={field} value={ministryKey} onChange={e => setMinistryKey(e.target.value)}>
                {ministries.map(m => <option value={m.key} key={m.key}>{m.title}</option>)}
              </select>
              <label className="block text-base font-bold">Vision summary<input className={field + " mt-2"} value={summary} onChange={e => setSummary(e.target.value)} maxLength={1000}/></label>
              <label className="block text-base font-bold">Pastoral direction<textarea className={field + " mt-2 min-h-[320px] font-normal leading-[1.8]"} value={content} onChange={e => setContent(e.target.value)} required maxLength={20000}/></label>
              <button className={button} disabled={busy}>Create private draft</button>
            </form>
          )}
          {planId && selected && (
            <>
              <section className={panel + " space-y-7"}>
                <Link href="/leadership/vision" className="inline-flex items-center gap-2 text-base font-bold text-blue-700 underline-offset-4 hover:underline">← Back to all ministry visions</Link>
                <div className="flex min-w-0 flex-wrap items-start justify-between gap-5">
                  <h2 className="min-w-0 break-words text-3xl font-extrabold leading-tight tracking-tight text-slate-950 sm:text-4xl">{selected.title}</h2>
                  <span className="rounded-full bg-slate-100 px-4 py-2 text-sm font-bold capitalize text-slate-700">{selected.status.replaceAll("_", " ")}</span>
                </div>
                <p className="max-w-5xl text-lg font-semibold leading-relaxed text-slate-700 sm:text-xl">{selected.summary}</p>
                <div className="grid grid-cols-2 gap-3 border-t border-slate-100 pt-6 sm:grid-cols-3" aria-label="This vision at a glance">
                  <div className="rounded-2xl bg-blue-50 p-4">
                    <p className="text-sm font-bold text-blue-900">Assigned reviewers</p>
                    <p className="mt-1 text-2xl font-extrabold text-blue-950">{selected.assignments.length}</p>
                  </div>
                  <div className="rounded-2xl bg-emerald-50 p-4">
                    <p className="text-sm font-bold text-emerald-900">Submitted responses</p>
                    <p className="mt-1 text-2xl font-extrabold text-emerald-950">{selectedSubmitted}</p>
                  </div>
                  <div className="col-span-2 rounded-2xl bg-amber-50 p-4 sm:col-span-1">
                    <p className="text-sm font-bold text-amber-900">{owner ? "Pending responses" : "Pending suggestions"}</p>
                    <p className="mt-1 text-2xl font-extrabold text-amber-950">{owner ? selectedPending : selectedFeedback}</p>
                  </div>
                </div>
                <nav aria-label="On this vision page" className="flex flex-wrap gap-2 border-t border-slate-100 pt-5">
                  <a href="#vision-direction" className="inline-flex min-h-[44px] items-center rounded-full border border-blue-200 bg-blue-50 px-4 text-sm font-bold text-blue-800 hover:bg-blue-100">Read vision</a>
                  {selected.status === "approved" && <a href="#vision-response" className="inline-flex min-h-[44px] items-center rounded-full border border-blue-200 bg-blue-50 px-4 text-sm font-bold text-blue-800">Acknowledge vision</a>}
                  {selected.status === "approved" && <a href="#vision-accountability" className="inline-flex min-h-[44px] items-center rounded-full border border-slate-200 px-4 text-sm font-bold text-slate-800 hover:bg-slate-50">2027 tasks</a>}
                  <a href="#vision-reporting" className="inline-flex min-h-[44px] items-center rounded-full border border-slate-200 px-4 text-sm font-bold text-slate-800 hover:bg-slate-50">Monthly reports</a>
                  <a href="#vision-response" className="inline-flex min-h-[44px] items-center rounded-full border border-slate-200 px-4 text-sm font-bold text-slate-800 hover:bg-slate-50">{owner ? "Leader submissions" : "My response"}</a>
                  <a href="#vision-feedback" className="inline-flex min-h-[44px] items-center rounded-full border border-slate-200 px-4 text-sm font-bold text-slate-800 hover:bg-slate-50">Questions & feedback</a>
                </nav>
                <VisionShareButton
                  planId={selected.id}
                  planTitle={selected.title}
                  onNotice={setNotice}
                  onError={setError}
                />
                {owner && selected.status !== "approved" && !editingVision ? <button type="button" className={secondary} onClick={() => setEditingVision(true)}>Edit pastoral direction</button> : null}
                {owner && selected.status !== "approved" && editingVision ? (
                  <form className="space-y-5 rounded-2xl border border-blue-100 bg-blue-50/40 p-5 sm:p-7" onSubmit={e => { e.preventDefault(); void run("PATCH", { action: "update-plan", planId: selected.id, summary, content }, selected.id); }}>
                    <label className="block text-base font-bold">Summary<input className={field + " mt-1"} value={summary} onChange={e => setSummary(e.target.value)}/></label>
                    <label className="block text-base font-bold">Detailed direction<GrowingVisionTextarea className={field + " mt-2 font-normal leading-[1.8]"} value={content} onChange={e => setContent(e.target.value)} maxLength={20000}/></label>
                    <div className="flex flex-wrap gap-3"><button className={button} disabled={busy}>Save vision revision</button><button type="button" className={secondary} onClick={() => setEditingVision(false)}>Cancel editing</button></div>
                  </form>
                ) : <div id="vision-direction" className="w-full min-w-0 scroll-mt-24 border-t border-slate-200 pt-8"><VisionDocument content={selected.content} onSuggest={suggestFor} /></div>}
                <p className="border-t border-slate-100 pt-5 text-sm font-semibold text-slate-500">Version {selected.version} · Private leadership material</p>
              </section>
              {selected.ministryKey === "men" && <MenLegacyScorecard />}
              {selected.ministryKey === "women" && <TransformedWomenScorecard />}
              {(["worship", "young-adults", "kids"] as const).includes(selected.ministryKey as "worship" | "young-adults" | "kids") && <MinistryGrowthScorecard ministry={selected.ministryKey as "worship" | "young-adults" | "kids"} />}
              {selected.status === "approved" && <div id="vision-accountability" className="scroll-mt-24"><VisionMilestonePanel planId={selected.id} owner={owner} leaders={leaders} /></div>}
              <div id="vision-reporting" className="scroll-mt-24"><VisionMinistryReporting owner={owner} ministryKey={selected.ministryKey} /></div>
              {owner ? (
                <section id="vision-response" className={panel + " scroll-mt-24 space-y-4"}>
                  <h3 className="text-2xl font-extrabold text-slate-950">{selected.ministryKey === "churchwide" ? "Pastoral review invitations" : "Assigned leaders"}</h3>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                    <div className="rounded-xl bg-slate-50 p-4"><p className="text-sm font-semibold text-slate-600">Assigned</p><p className="text-2xl font-extrabold text-slate-950">{selected.assignments.length}</p></div>
                    <div className="rounded-xl bg-emerald-50 p-4"><p className="text-sm font-semibold text-emerald-800">Responded</p><p className="text-2xl font-extrabold text-emerald-950">{selectedSubmitted}</p></div>
                    <div className="rounded-xl bg-amber-50 p-4"><p className="text-sm font-semibold text-amber-900">Awaiting response</p><p className="text-2xl font-extrabold text-amber-950">{selectedPending}</p></div>
                  </div>
                  {selected.ministryKey === "churchwide" && selected.status !== "approved" && (
                    <div className="space-y-3 rounded-xl border border-blue-200 bg-blue-50 p-5">
                      <p className="text-base leading-relaxed text-slate-800">Invite every pastor registered in Shanah City's pastoral-role directory to review this proposal privately, submit corrections and comment on specific calendar months. You can also assign additional pastors individually below if they aren't in that directory.</p>
                      <p className="text-sm font-semibold text-slate-700">Registered pastoral reviewers: {pastoralReviewers.length ? pastoralReviewers.map(p => p.name).join(", ") : "No additional pastoral reviewers found in the role directory."}</p>
                      <button type="button" className={button} disabled={busy || !pastoralReviewers.length} onClick={() => void run("POST", { action: "assign-pastoral-team", planId: selected.id }, selected.id)}>Share privately with registered pastoral team</button>
                      <button type="button" className={secondary} disabled={busy || selected.assignments.length === 0} onClick={async () => {
                        if (!window.confirm("Send another 2027 Master Vision push notification to all currently assigned reviewers?")) return;
                        setBusy(true); setError(""); setNotice("");
                        try {
                          const result = await request("POST", { action: "resend-master-pastoral-notification", planId: selected.id }) as Result & {
                            targeted?: number; acceptedByPushProviders?: number; deliveredUsers?: number;
                            nativeSent?: number; webSent?: number; skippedNoDeviceUsers?: number;
                            skippedPrefUsers?: number; failedUsers?: number; configured?: boolean; errors?: string[];
                          };
                          const summary = `Targeted ${result.targeted ?? 0} reviewers · Push-service accepted ${result.acceptedByPushProviders ?? 0} sends (${result.nativeSent ?? 0} phone, ${result.webSent ?? 0} browser) · No device: ${result.skippedNoDeviceUsers ?? 0} · Notifications off: ${result.skippedPrefUsers ?? 0} · Failed: ${result.failedUsers ?? 0}.`;
                          if (!result.configured || !(result.acceptedByPushProviders ?? 0)) {
                            setError(summary + (result.errors?.length ? " " + result.errors.join(" · ") : " Check Push notifications in each reviewer's Profile."));
                          } else {
                            setNotice(summary + " Provider acceptance does not guarantee a visible phone alert.");
                          }
                        } catch (e) { setError(e instanceof Error ? e.message : "Could not resend reminders."); }
                        finally { setBusy(false); }
                      }}>Resend Master Vision notification to pastors</button>
                      <p className="text-sm font-semibold text-slate-700">Use <strong>Share Vision</strong> above to send the canonical review link after pastors are assigned.</p>
                    </div>
                  )}
                  {selected.assignments.length === 0 && <p className="text-base font-medium text-slate-600">No leaders assigned yet.</p>}
                  {selected.assignments.map(a => (
                    <div key={a.id} className="min-w-0 space-y-3 break-words rounded-2xl border border-slate-200 bg-slate-50 p-5 text-base leading-relaxed">
                      <p className="text-lg font-extrabold text-slate-950">{leaders.find(l => l.id === a.userId)?.name || "Assigned member"}</p>
                      <p className="text-sm font-semibold capitalize text-slate-600">{a.status.replaceAll("_"," ")} · {a.deadline ? "Due " + formatDeadline(a.deadline) : "No deadline set"}</p>
                      <div className="flex flex-wrap gap-2">
                        <span className={"rounded-full px-3 py-1 text-xs font-bold " + (a.acknowledgedAt ? "bg-blue-100 text-blue-900" : "bg-slate-200 text-slate-800")}>{a.acknowledgedAt ? "Vision read" : "Awaiting acknowledgement"}</span>
                        <span className={"rounded-full px-3 py-1 text-xs font-bold " + (a.submittedAt ? "bg-emerald-100 text-emerald-900" : "bg-amber-100 text-amber-950")}>{a.submittedAt ? "Review submitted" : "Awaiting proposal"}</span>
                      </div>
                      {a.proposal && <p className="whitespace-pre-wrap break-words pt-2 leading-[1.8]"><strong>Proposal: </strong>{a.proposal}</p>}
                      {a.capacity && <p><strong>Capacity: </strong>{a.capacity}</p>}
                      {a.supportNeeds && <p><strong>Support needed: </strong>{a.supportNeeds}</p>}
                    </div>
                  ))}
                  <form className="space-y-5" onSubmit={async e => {
                    e.preventDefault();
                    if (!assignUserId) return;
                    const saved = await run("POST", { action: "assign", planId: selected.id, userId: assignUserId, deadline }, selected.id);
                    if (saved) { setAssignUserId(""); setSelectedMember(null); setMemberQuery(""); setMemberResults([]); }
                  }}>
                    <div className="space-y-2">
                      <label htmlFor="vision-member-search" className="block text-base font-bold text-slate-900">Search all registered church members</label>
                      <p className="text-sm leading-relaxed text-slate-600">Find any pastor or ministry leader by name or email. Review access is private and given only to people you invite.</p>
                      <input id="vision-member-search" type="search" autoComplete="off" className={field} value={memberQuery}
                        onChange={e => { setMemberQuery(e.target.value); setAssignUserId(""); setSelectedMember(null); setMemberResults([]); }}
                        placeholder="Type at least 2 letters of a name or email…" />
                      {memberSearching && <p role="status" className="text-sm text-slate-600">Searching registered members…</p>}
                      {memberSearchError && <p role="alert" className="text-sm font-semibold text-red-700">{memberSearchError}</p>}
                      {selectedMember ? <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-blue-300 bg-blue-50 p-4">
                        <p className="min-w-0 break-words font-bold text-blue-950">Selected: {selectedMember.name} <span className="block text-sm font-normal">{selectedMember.email}</span></p>
                        <button type="button" className={secondary} onClick={() => { setAssignUserId(""); setSelectedMember(null); setMemberQuery(""); }}>Change</button>
                      </div> : memberQuery.trim().length >= 2 && !memberSearching && !memberSearchError && memberResults.length === 0
                        ? <p className="text-sm text-slate-600">No matching registered members. Try another name or email.</p> : null}
                      {!selectedMember && memberResults.length > 0 && <div role="listbox" aria-label="Matching church members" className="max-h-80 overflow-y-auto rounded-xl border border-slate-200 bg-white p-1">
                        {memberResults.map(member => <button key={member.id} type="button" role="option" aria-selected={false}
                          className="flex w-full min-w-0 flex-col gap-1 rounded-lg px-4 py-3 text-left hover:bg-blue-50 focus-visible:bg-blue-50"
                          onClick={() => { setSelectedMember(member); setAssignUserId(member.id); setMemberQuery(member.name); setMemberResults([]); }}>
                          <span className="break-words text-base font-bold text-slate-950">{member.name}</span>
                          <span className="break-all text-sm text-slate-600">{member.email}</span>
                        </button>)}
                      </div>}
                    </div>
                    <label className="block text-base font-bold text-slate-900">{selected.status === "approved" ? "Implementation check-in deadline (optional)" : "Review deadline"}<input type="date" className={field + " mt-1"} value={deadline} onChange={e => setDeadline(e.target.value)}/></label>
                    <p className="text-sm leading-relaxed text-slate-600">{selected.status === "approved" ? "Assign an implementation leader without reopening the approved plan. Then assign specific tasks and deadlines in Monthly responsibilities & reminders." : "Invite this leader to review the working vision and submit their proposed contribution."}</p>
                    <button className={button} disabled={busy || !assignUserId}>{selected.status === "approved" ? "Assign implementation leader" : "Invite selected member privately"}</button>
                  </form>}
                  <div className="border-t border-slate-200 pt-7">
                    <label className="block text-base font-bold text-slate-900">Pastoral review note<textarea className={field + " mt-2 min-h-[160px] resize-y"} value={feedbackNote} onChange={e => setFeedbackNote(e.target.value)} maxLength={1000}/></label>
                    {selected.status !== "approved" && <div className="mt-3 flex flex-wrap gap-2">
                      <button className={secondary} type="button" disabled={busy} onClick={() => void run("PATCH", { action: "request-revision", planId: selected.id, note: feedbackNote }, selected.id)}>Request revision</button>
                      <button className={button} type="button" disabled={busy} onClick={() => void run("PATCH", { action: "approve", planId: selected.id, note: feedbackNote }, selected.id)}>Approve plan</button>
                    </div>}
                  </div>
                  {(selected.audits?.length ?? 0) > 0 && (
                    <ApprovalHistoryPanel audits={selected.audits ?? []} leaders={leaders} />
                  )}
                </section>
              ) : myAssignment && selected.status === "approved" ? (
                <section id="vision-response" className={panel + " scroll-mt-24 space-y-5"}>
                  <h3 className="text-2xl font-extrabold text-slate-950">My implementation commitment</h3>
                  <p className="text-base leading-relaxed text-slate-700">This annual vision has been approved by pastoral leadership. Read the direction above and acknowledge your responsibility for helping implement it. There is no new proposal required.</p>
                  <p className={"text-base font-bold " + (myAssignment.acknowledgedAt ? "text-emerald-800" : "text-amber-900")}>{myAssignment.acknowledgedAt ? "Vision acknowledged — ready for implementation" : "Awaiting your acknowledgement"}</p>
                  {!myAssignment.acknowledgedAt && <button type="button" className={button} disabled={busy} onClick={() => void run("PATCH", { action: "acknowledge", planId: selected.id }, selected.id)}>I have read and accept this vision</button>}
                  <p className="text-sm text-slate-600">Your assigned implementation tasks appear in Monthly responsibilities & reminders. Submit progress through your ministry monthly report.</p>
                  <a href="#vision-accountability" className={secondary}>View my implementation responsibilities</a>
                </section>
              ) : myAssignment && selected.status !== "approved" ? (
                <section id="vision-response" className={panel + " scroll-mt-24 space-y-5"}>
                  <h3 className="text-2xl font-extrabold text-slate-950">{selected.ministryKey === "churchwide" ? "Your pastoral assessment of this proposal" : "My response"}</h3>
                  <div className="grid gap-3 sm:grid-cols-3" aria-label="Your review progress">
                    <div className="rounded-xl bg-slate-50 p-4">
                      <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Step 1 · Read</p>
                      <p className="mt-1 font-bold text-slate-900">{myAssignment.acknowledgedAt ? "Acknowledged" : "Not yet acknowledged"}</p>
                    </div>
                    <div className="rounded-xl bg-slate-50 p-4">
                      <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Step 2 · Respond</p>
                      <p className="mt-1 font-bold text-slate-900">{myAssignment.proposal?.trim() ? "Draft available" : "Write your response"}</p>
                    </div>
                    <div className="rounded-xl bg-slate-50 p-4">
                      <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Step 3 · Submit</p>
                      <p className="mt-1 font-bold text-slate-900">{myAssignment.submittedAt ? "Submitted" : "Awaiting submission"}</p>
                    </div>
                  </div>
                  <p className="text-sm font-semibold text-slate-600">Review deadline: {formatDeadline(myAssignment.deadline)}. Save your draft as often as needed before submitting.</p>
                  <p className="text-base font-bold capitalize text-slate-700">{myAssignment.status.replaceAll("_", " ")}</p>
                  {!myAssignment.acknowledgedAt && <button type="button" className={secondary} disabled={busy} onClick={() => void run("PATCH", { action: "acknowledge", planId: selected.id }, selected.id)}>I have read the vision</button>}
                  <label className="block text-base font-bold text-slate-900">Delivery capacity<select className={field + " mt-2"} value={capacity} onChange={e => setCapacity(e.target.value)}><option value="full">Can deliver</option><option value="with_support">Can deliver with support</option><option value="revised">Recommend revised approach</option></select></label>
                  <label className="block text-base font-bold text-slate-900">{selected.ministryKey === "churchwide" ? "My full pastoral review, corrections and additions" : "My proposal and creative ideas"}<GrowingVisionTextarea className={field + " mt-2"} value={proposal} onChange={e => setProposal(e.target.value)} placeholder="What do you affirm? What would you change or add? What is achievable? What leadership, budget or preparation would it require?" maxLength={12000}/></label>
                  <label className="block text-base font-bold text-slate-900">Resources, risks or help needed<GrowingVisionTextarea className={field + " mt-2"} value={supportNeeds} onChange={e => setSupportNeeds(e.target.value)} maxLength={5000}/></label>
                  <div className="flex flex-wrap gap-2">
                    <button type="button" className={secondary} disabled={busy} onClick={() => void run("PATCH", { action: "save-response", planId: selected.id, capacity, proposal, supportNeeds }, selected.id)}>Save draft</button>
                    <button type="button" className={button} disabled={busy || !proposal.trim()} onClick={() => void run("PATCH", { action: "submit", planId: selected.id, capacity, proposal, supportNeeds }, selected.id)}>Submit for pastoral review</button>
                  </div>
                </section>
              ) : null}
              <section id="vision-feedback" className={panel + " scroll-mt-24 space-y-4"}>
                <h3 className="text-2xl font-extrabold text-slate-950">{selected.ministryKey === "churchwide" ? "Pastoral corrections, additions & calendar feedback" : "Questions, suggestions & corrections"}</h3>
                <p className="text-base leading-relaxed text-slate-700">Select a specific section or calendar month, explain what should change and why, and submit your recommendation. You can comment as many times as needed. The Senior Pastor reviews every suggestion before revising the vision.</p>
                {selected.comments?.length === 0 && <p className="text-base font-medium text-slate-600">No discussion yet.</p>}
                {selected.comments?.map(c => <article key={c.id} className="min-w-0 space-y-3 break-words rounded-2xl border border-slate-200 bg-slate-50 p-5 sm:p-7">
                  <p className="text-sm font-bold text-slate-600">{c.authorName} · {c.kind} · {c.sectionKey}</p>
                  <p className="mt-3 whitespace-pre-wrap break-words text-[17px] leading-[1.8] text-slate-900">{c.body}</p>
                  {c.referenceUrl && <a href={c.referenceUrl} target="_blank" rel="noopener noreferrer" className="mt-3 block break-all text-base font-bold text-blue-700 underline">Open creative reference</a>}
                  {c.kind === "idea" && <p className="mt-3 break-words text-base font-bold capitalize text-blue-800">Pastoral decision: {c.decision}{c.decisionNote ? " — " + c.decisionNote : ""}</p>}
                  {owner && c.kind === "idea" && <div className="mt-3 flex flex-wrap gap-2">
                    {(["accepted", "deferred", "declined"] as const).map(decision => (
                      <button key={decision} type="button" disabled={busy} className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-bold capitalize"
                        onClick={() => void run("PATCH", { action: "decide-comment", planId: selected.id, commentId: c.id, decision, note: feedbackNote }, selected.id)}>{decision}</button>
                    ))}
                  </div>}
                </article>)}
                <form ref={commentFormRef} className="scroll-mt-28 space-y-5 border-t border-slate-200 pt-7" onSubmit={async e => { e.preventDefault(); const saved = await run("POST", { action: "comment", planId: selected.id, body: commentText, kind: commentKind, sectionKey, referenceUrl: designLink }, selected.id); if (saved) { setCommentText(""); setDesignLink(""); } }}>
                  <div className="grid min-w-0 grid-cols-1 gap-4 md:grid-cols-2">
                    <label className="block space-y-2 text-base font-bold text-slate-900">Type of feedback<select className={field} value={commentKind} onChange={e => setCommentKind(e.target.value)}><option value="question">Question</option><option value="idea">Correction, addition or suggestion</option></select></label>
                    <label className="block space-y-2 text-base font-bold text-slate-900">Which section or month?
                      <select className={field} value={sectionKey} onChange={e => setSectionKey(e.target.value)}>
                        <option value="general">General / whole vision</option>
                        {Array.from(new Set(selected.content.split("\n").map(line => line.trim()).filter(line => /^[A-Z][A-Z0-9 ·—–&:,'()\/\-]+$/.test(line) && line.length < 100))).map(s => <option key={s} value={s}>{s}</option>)}
                        {selected.ministryKey === "churchwide" && ["January","February","March","April","May","June","July","August","September","October","November","December"].map(month => <option key={month} value={"calendar:" + month}>{month} 2027 calendar</option>)}
                        {!selected.content.split("\n").some(line => line.trim() === sectionKey) && sectionKey !== "general" && !sectionKey.startsWith("calendar:") && <option value={sectionKey}>{sectionKey}</option>}
                      </select>
                    </label>
                  </div>
                  <label className="block space-y-2 text-base font-bold text-slate-900">Your detailed feedback<GrowingVisionTextarea className={field + " font-normal leading-[1.8]"} value={commentText} onChange={e => setCommentText(e.target.value)} placeholder="What do you recommend? Why? Is it achievable? Suggest dates, budget, responsible leaders, changes or alternatives here. The text area grows as you write." required maxLength={8000}/></label>
                  <input type="url" className={field} value={designLink} onChange={e => setDesignLink(e.target.value)} placeholder="Optional HTTPS design link (Canva, Figma, mood board...)" maxLength={1000}/>
                  <button className={button} disabled={busy || !commentText.trim()}>Submit feedback to pastoral review</button>
                </form>
              </section>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
