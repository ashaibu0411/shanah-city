"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";

type Assignment = {
  id: string; userId: string; status: string; deadline?: string | null;
  acknowledgedAt?: string | null; capacity?: string | null;
  proposal?: string | null; supportNeeds?: string | null; submittedAt?: string | null;
};
type Comment = { id: string; authorName: string; kind: string; sectionKey: string; body: string; createdAt: string };
type Plan = { id: string; title: string; ministryKey: string; summary: string; content: string; status: string; version: number; assignments: Assignment[]; comments?: Comment[]; _count?: { comments: number } };
type Ministry = { key: string; title: string };
type Result = { error?: string; plan?: Plan; plans?: Plan[]; ministries?: Ministry[]; isOwner?: boolean };

const field = "w-full rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100";
const button = "rounded-xl bg-blue-700 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50";
const secondary = "rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-800";
const panel = "rounded-2xl border border-slate-200 bg-white p-5 shadow-sm";

async function request(method: string, data: Record<string, unknown>): Promise<Result> {
  const response = await fetch("/api/vision/plans", { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
  const json = (await response.json().catch(() => ({}))) as Result;
  if (!response.ok) throw new Error(json.error || "Could not save changes.");
  return json;
}

export function VisionCenterHub({ owner }: { owner: boolean }) {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [ministries, setMinistries] = useState<Ministry[]>([]);
  const [selected, setSelected] = useState<Plan | null>(null);
  const [ministryKey, setMinistryKey] = useState("churchwide");
  const [summary, setSummary] = useState("");
  const [content, setContent] = useState("");
  const [assignUserId, setAssignUserId] = useState("");
  const [deadline, setDeadline] = useState("");
  const [capacity, setCapacity] = useState("with_support");
  const [proposal, setProposal] = useState("");
  const [supportNeeds, setSupportNeeds] = useState("");
  const [commentKind, setCommentKind] = useState("question");
  const [commentText, setCommentText] = useState("");
  const [sectionKey, setSectionKey] = useState("general");
  const [feedbackNote, setFeedbackNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  const refresh = useCallback(async (id?: string) => {
    const response = await fetch("/api/vision/plans", { cache: "no-store" });
    if (!response.ok) throw new Error("Cannot load private vision plans.");
    const data = (await response.json()) as Result;
    setPlans(data.plans || []);
    setMinistries(data.ministries || []);
    if (id) {
      const detail = await fetch("/api/vision/plans?planId=" + encodeURIComponent(id), { cache: "no-store" });
      if (!detail.ok) throw new Error("Unable to open this assignment.");
      const plan = ((await detail.json()) as Result).plan || null;
      setSelected(plan);
      if (plan) {
        setSummary(plan.summary); setContent(plan.content);
        const own = plan.assignments[0];
        setCapacity(own?.capacity || "with_support");
        setProposal(own?.proposal || "");
        setSupportNeeds(own?.supportNeeds || "");
      }
    }
  }, []);

  useEffect(() => { void refresh().catch(e => setError(String(e))); }, [refresh]);

  async function run(method: string, data: Record<string, unknown>, reloadId?: string) {
    setBusy(true); setError(""); setNotice("");
    try {
      await request(method, data);
      await refresh(reloadId);
      setNotice("Saved.");
    } catch (e) { setError(e instanceof Error ? e.message : "Could not save."); }
    finally { setBusy(false); }
  }

  async function open(id: string) {
    setError(""); setNotice("");
    await refresh(id).catch(e => setError(String(e)));
  }

  const myAssignment = selected?.assignments?.[0];
  return (
    <div className="mx-auto max-w-5xl space-y-6 pb-24 text-slate-900">
      <header className="rounded-3xl bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950 p-6 text-white shadow-xl sm:p-8">
        <p className="text-xs font-bold uppercase tracking-[.2em] text-blue-200">Shanah City · Private leadership</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight">2027 Vision Center</h1>
        <p className="mt-2 max-w-xl text-sm text-slate-200">Expansion · Establishment · Excellence · Community Impact</p>
        <p className="mt-3 text-xs text-blue-100">{owner ? "Senior Pastor workspace" : "My assigned ministry visions"}</p>
      </header>
      {error && <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800">{error}</div>}
      {notice && <p role="status" className="rounded-xl border border-blue-200 bg-blue-50 p-3 text-sm text-blue-900">{notice}</p>}
      <div className="grid gap-5 lg:grid-cols-[280px_1fr]">
        <aside className={panel + " space-y-3 self-start"}>
          <h2 className="text-lg font-semibold">Ministry visions</h2>
          <p className="text-xs text-slate-500">{plans.length} accessible plans</p>
          {plans.length === 0 && <p className="text-sm text-slate-600">No visions assigned yet.</p>}
          {plans.map(plan => (
            <button type="button" key={plan.id} onClick={() => void open(plan.id)}
              className={"w-full rounded-xl border p-3 text-left text-sm transition " + (selected?.id === plan.id ? "border-blue-500 bg-blue-50" : "border-slate-200 hover:bg-slate-50")}>
              <span className="block font-semibold">{plan.title}</span>
              <span className="mt-1 block text-xs capitalize text-slate-500">{plan.status.replaceAll("_", " ")} · v{plan.version}</span>
            </button>
          ))}
          {owner && <p className="border-t pt-3 text-xs text-slate-500">New plans are private drafts, never public calendar events.</p>}
        </aside>
        <div className="space-y-5">
          {owner && !selected && (
            <form className={panel + " space-y-4"} onSubmit={(event: FormEvent) => { event.preventDefault(); void run("POST", { action: "create", ministryKey, summary, content }); }}>
              <h2 className="text-lg font-semibold">Create ministry vision</h2>
              <select className={field} value={ministryKey} onChange={e => setMinistryKey(e.target.value)}>
                {ministries.map(m => <option value={m.key} key={m.key}>{m.title}</option>)}
              </select>
              <label className="block text-sm font-medium">Vision summary<input className={field + " mt-2"} value={summary} onChange={e => setSummary(e.target.value)} maxLength={1000}/></label>
              <label className="block text-sm font-medium">Pastoral direction<textarea className={field + " mt-2 min-h-48"} value={content} onChange={e => setContent(e.target.value)} required maxLength={20000}/></label>
              <button className={button} disabled={busy}>Create private draft</button>
            </form>
          )}
          {selected && (
            <>
              <section className={panel + " space-y-4"}>
                <button type="button" className="text-xs font-semibold text-blue-700" onClick={() => setSelected(null)}>← All visions</button>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <h2 className="text-xl font-bold">{selected.title}</h2>
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium capitalize">{selected.status.replaceAll("_", " ")}</span>
                </div>
                <p className="text-sm text-slate-600">{selected.summary}</p>
                {owner && selected.status !== "approved" ? (
                  <form className="space-y-3" onSubmit={e => { e.preventDefault(); void run("PATCH", { action: "update-plan", planId: selected.id, summary, content }, selected.id); }}>
                    <label className="block text-sm font-semibold">Summary<input className={field + " mt-1"} value={summary} onChange={e => setSummary(e.target.value)}/></label>
                    <label className="block text-sm font-semibold">Detailed direction<textarea className={field + " mt-1 min-h-48"} value={content} onChange={e => setContent(e.target.value)}/></label>
                    <button className={secondary} disabled={busy}>Save vision revision</button>
                  </form>
                ) : <div className="whitespace-pre-wrap rounded-xl bg-slate-50 p-4 text-sm leading-relaxed">{selected.content}</div>}
                <p className="text-xs text-slate-500">Version {selected.version} · Internal leadership material</p>
              </section>
              {owner ? (
                <section className={panel + " space-y-4"}>
                  <h3 className="text-lg font-semibold">Assigned leaders</h3>
                  {selected.assignments.length === 0 && <p className="text-sm text-slate-500">No leaders assigned yet.</p>}
                  {selected.assignments.map(a => (
                    <div key={a.id} className="space-y-1 rounded-xl border border-slate-200 p-3 text-sm">
                      <p className="font-semibold">Member ID: {a.userId}</p>
                      <p className="text-xs capitalize text-slate-500">{a.status.replaceAll("_"," ")} · {a.deadline ? "Due " + new Date(a.deadline).toLocaleDateString() : "No deadline"}</p>
                      {a.proposal && <p className="whitespace-pre-wrap pt-2"><strong>Proposal: </strong>{a.proposal}</p>}
                      {a.capacity && <p><strong>Capacity: </strong>{a.capacity}</p>}
                      {a.supportNeeds && <p><strong>Support needed: </strong>{a.supportNeeds}</p>}
                    </div>
                  ))}
                  {selected.status !== "approved" && <form className="space-y-3" onSubmit={e => { e.preventDefault(); void run("POST", { action: "assign", planId: selected.id, userId: assignUserId, deadline }, selected.id); }}>
                    <label className="block text-sm font-medium">Existing member user ID<input className={field + " mt-1"} value={assignUserId} onChange={e => setAssignUserId(e.target.value)} required placeholder="Use an existing member's account ID"/></label>
                    <label className="block text-sm font-medium">Review deadline<input type="date" className={field + " mt-1"} value={deadline} onChange={e => setDeadline(e.target.value)}/></label>
                    <button className={button} disabled={busy}>Assign privately</button>
                  </form>}
                  <div className="border-t pt-4">
                    <label className="block text-sm font-medium">Pastoral review note<textarea className={field + " mt-2"} value={feedbackNote} onChange={e => setFeedbackNote(e.target.value)} maxLength={1000}/></label>
                    {selected.status !== "approved" && <div className="mt-3 flex flex-wrap gap-2">
                      <button className={secondary} type="button" disabled={busy} onClick={() => void run("PATCH", { action: "request-revision", planId: selected.id, note: feedbackNote }, selected.id)}>Request revision</button>
                      <button className={button} type="button" disabled={busy} onClick={() => void run("PATCH", { action: "approve", planId: selected.id, note: feedbackNote }, selected.id)}>Approve plan</button>
                    </div>}
                  </div>
                </section>
              ) : myAssignment && selected.status !== "approved" ? (
                <section className={panel + " space-y-4"}>
                  <h3 className="text-lg font-semibold">My response</h3>
                  <p className="text-xs capitalize text-slate-600">{myAssignment.status.replaceAll("_", " ")}</p>
                  {!myAssignment.acknowledgedAt && <button type="button" className={secondary} disabled={busy} onClick={() => void run("PATCH", { action: "acknowledge", planId: selected.id }, selected.id)}>I have read the vision</button>}
                  <label className="block text-sm font-medium">Delivery capacity<select className={field + " mt-2"} value={capacity} onChange={e => setCapacity(e.target.value)}><option value="full">Can deliver</option><option value="with_support">Can deliver with support</option><option value="revised">Recommend revised approach</option></select></label>
                  <label className="block text-sm font-medium">My proposal and creative ideas<textarea className={field + " mt-2 min-h-40"} value={proposal} onChange={e => setProposal(e.target.value)} maxLength={12000}/></label>
                  <label className="block text-sm font-medium">Resources or help needed<textarea className={field + " mt-2"} value={supportNeeds} onChange={e => setSupportNeeds(e.target.value)} maxLength={5000}/></label>
                  <div className="flex flex-wrap gap-2">
                    <button type="button" className={secondary} disabled={busy} onClick={() => void run("PATCH", { action: "save-response", planId: selected.id, capacity, proposal, supportNeeds }, selected.id)}>Save draft</button>
                    <button type="button" className={button} disabled={busy || !proposal.trim()} onClick={() => void run("PATCH", { action: "submit", planId: selected.id, capacity, proposal, supportNeeds }, selected.id)}>Submit for pastoral review</button>
                  </div>
                </section>
              ) : null}
              <section className={panel + " space-y-4"}>
                <h3 className="text-lg font-semibold">Questions & ideas</h3>
                {selected.comments?.length === 0 && <p className="text-sm text-slate-500">No discussion yet.</p>}
                {selected.comments?.map(c => <article key={c.id} className="rounded-xl bg-slate-50 p-3"><p className="text-xs font-semibold text-slate-600">{c.authorName} · {c.kind} · {c.sectionKey}</p><p className="mt-2 whitespace-pre-wrap text-sm">{c.body}</p></article>)}
                {selected.status !== "approved" && <form className="space-y-3" onSubmit={e => { e.preventDefault(); void run("POST", { action: "comment", planId: selected.id, body: commentText, kind: commentKind, sectionKey }, selected.id).then(() => setCommentText("")); }}>
                  <div className="grid gap-2 sm:grid-cols-2">
                    <select className={field} value={commentKind} onChange={e => setCommentKind(e.target.value)}><option value="question">Question</option><option value="idea">Suggestion / creative idea</option></select>
                    <input className={field} value={sectionKey} onChange={e => setSectionKey(e.target.value)} maxLength={100} placeholder="Section name"/>
                  </div>
                  <textarea className={field} value={commentText} onChange={e => setCommentText(e.target.value)} placeholder="Ask a question or suggest a change..." required maxLength={3000}/>
                  <button className={button} disabled={busy}>Post to vision discussion</button>
                </form>}
              </section>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
