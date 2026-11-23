"use client";
import { useEffect, useState } from "react";

type Assignment = { guestId: string; workerId: string; workerName: string; dueAt: string; completedAt: string | null };
type Worker = { id: string; name: string };
export function FollowUpAssignments({ guests, onChanged }: { guests: { id: string; name: string; status: string }[]; onChanged: () => void }) {
 const [assignments, setAssignments] = useState<Assignment[]>([]);
 const [workers, setWorkers] = useState<Worker[]>([]);
 const [isLeader, setIsLeader] = useState(false);
 const [viewerId, setViewerId] = useState("");
 const [message, setMessage] = useState("");
 const [busy, setBusy] = useState("");
 async function load() {
  try {
   const res = await fetch("/api/follow-up/assignments");
   const data = await res.json();
   if (!res.ok) throw new Error(data.error || "Unable to load assignments");
   setAssignments(data.assignments ?? []);setWorkers(data.workers ?? []);setIsLeader(Boolean(data.isLeader));setViewerId(data.viewerId ?? "");
  } catch(e) { setMessage(e instanceof Error ? e.message : "Unable to load assignments"); }
 }
 useEffect(() => { void load(); }, []);
 async function assign(guestId: string, workerId: string) {
  if (!workerId) return;
  setBusy(guestId);setMessage("");
  try {
   const res = await fetch("/api/follow-up/assignments", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({guestId,workerId}) });
   const data = await res.json();
   if (!res.ok) throw new Error(data.error || "Unable to assign");
   setMessage("Assignment saved.");await load();onChanged();
  } catch(e) {setMessage(e instanceof Error ? e.message : "Unable to assign");}
  finally {setBusy("");}
 }
 const pending = assignments.filter(a => !a.completedAt);
 const overdue = pending.filter(a => new Date(a.dueAt).getTime() < Date.now());
 return <section className="space-y-3 rounded-2xl border border-night-900/10 bg-white p-4">
  <div className="flex flex-wrap items-center justify-between gap-2">
   <div><h3 className="font-display text-lg font-semibold text-night-900">{isLeader ? "Worker assignments" : "My follow-up assignments"}</h3><p className="text-sm text-night-600">{pending.length} open · {overdue.length} overdue</p></div>
   <button type="button" onClick={() => void load()} className="rounded-lg border px-3 py-2 text-sm font-semibold">Refresh</button>
  </div>
  {isLeader && workers.length === 0 && <p className="rounded-xl bg-amber-50 p-3 text-sm text-amber-900">No active follow-up workers yet. Open Follow-Up Ministry → Manage to add team members and assign a leader. Assignments will become available after their access is approved.</p>}
  {isLeader && workers.length > 0 && <div className="space-y-2">
   <p className="text-sm font-semibold text-night-800">Assign a guest to an active follow-up worker</p>
   {guests.filter(g => g.status === "new").map(g => {
    const current = assignments.find(a => a.guestId === g.id);
    return <div key={g.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-sand-100 p-3">
     <span className="text-sm font-semibold text-night-900">{g.name}{current ? " · " + current.workerName : " · Unassigned"}</span>
     <select aria-label={"Assign " + g.name} disabled={busy === g.id} value={current?.workerId ?? ""} onChange={e => void assign(g.id,e.target.value)} className="min-h-11 w-full max-w-full rounded-lg border bg-white p-2 text-sm text-night-900">
      <option value="">Select worker</option>{workers.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
     </select>
    </div>;
   })}
  </div>}
  <div className="space-y-2">
   <p className="text-sm font-semibold text-night-900">{isLeader ? "Open team tasks" : "My open tasks"}</p>
   {pending.length === 0 && <p className="text-sm text-night-600">No open assignments.</p>}
   {pending.map(a => <div key={a.guestId} className="rounded-lg border border-night-900/10 p-3 text-sm">
    <p className="font-semibold text-night-900">{guests.find(g => g.id === a.guestId)?.name ?? "Guest"} · {a.workerName}</p>
    <p className={new Date(a.dueAt).getTime() < Date.now() ? "font-semibold text-red-700" : "text-night-600"}>Due {new Date(a.dueAt).toLocaleString()}{new Date(a.dueAt).getTime() < Date.now() ? " · OVERDUE" : ""}</p>
   </div>)}
  </div>
  {message && <p role="status" className="text-sm text-night-700">{message}</p>}
 </section>;
}
