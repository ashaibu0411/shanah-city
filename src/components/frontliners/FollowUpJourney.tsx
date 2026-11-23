"use client";
import { useEffect, useState } from "react";
type Task={guestId:string;workerName:string;journeyStage:string;nextContactAt:string|null;dueAt:string;completedAt:string|null};
type Guest={id:string;name:string};
const stages=[["first_visit","First visit"],["contacted","Contacted"],["second_visit","Second visit"],["regular_attendee","Regular attendee"],["membership_interest","Membership interest"],["connected_member","Connected member"]];
export function FollowUpJourney({guests}:{guests:Guest[]}) {
 const [tasks,setTasks]=useState<Task[]>([]);
 const [summary,setSummary]=useState<{open:number;overdue:number;callbacks:number;connected:number}|null>(null);
 const [message,setMessage]=useState("");
 const [busy,setBusy]=useState("");
 async function load(){
  try {const res=await fetch("/api/follow-up/journey");const data=await res.json();if(!res.ok)throw new Error(data.error||"Unable to load");setTasks(data.assignments||[]);setSummary(data.summary);}
  catch(e){setMessage(e instanceof Error?e.message:"Unable to load");}
 }
 useEffect(()=>{void load()},[]);
 async function update(guestId:string,change:Record<string,unknown>){
  setBusy(guestId);setMessage("");
  try {const res=await fetch("/api/follow-up/journey",{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({guestId,...change})});const data=await res.json();if(!res.ok)throw new Error(data.error||"Unable to save");await load();setMessage("Saved.");}
  catch(e){setMessage(e instanceof Error?e.message:"Unable to save");}finally{setBusy("");}
 }
 return <section className="space-y-3 rounded-2xl border bg-white p-4 text-night-900">
  <h3 className="font-display text-lg font-semibold">Guest journey & next steps</h3>
  {summary && <p className="text-sm text-night-600">{summary.open} open · {summary.callbacks} callbacks due · {summary.connected} connected members</p>}
  {tasks.length===0 && <p className="text-sm text-night-600">Assign a guest to a worker to begin their connection journey.</p>}
  {tasks.map(t=><div key={t.guestId} className="space-y-3 rounded-xl border p-3">
   <div><p className="font-semibold">{guests.find(g=>g.id===t.guestId)?.name||"Guest"}</p><p className="text-xs text-night-600">Assigned to {t.workerName}</p></div>
   <label className="block text-sm font-semibold">Connection stage
    <select disabled={busy===t.guestId} value={t.journeyStage} onChange={e=>void update(t.guestId,{journeyStage:e.target.value})} className="mt-1 min-h-11 w-full rounded-lg border bg-white p-2 text-night-900">{stages.map(([value,label])=><option key={value} value={value}>{label}</option>)}</select>
   </label>
   <label className="block text-sm font-semibold">Next follow-up date
    <input type="datetime-local" disabled={busy===t.guestId} defaultValue={t.nextContactAt?new Date(new Date(t.nextContactAt).getTime()-new Date(t.nextContactAt).getTimezoneOffset()*60000).toISOString().slice(0,16):""} key={t.guestId+String(t.nextContactAt)} onChange={e=>{if(e.target.value)void update(t.guestId,{nextContactAt:new Date(e.target.value).toISOString()})}} className="mt-1 min-h-11 w-full rounded-lg border bg-white p-2 text-night-900"/>
   </label>
   {t.nextContactAt && <p className="text-xs text-night-600">Scheduled {new Date(t.nextContactAt).toLocaleString()}</p>}
  </div>)}
  {message && <p role="status" className="text-sm">{message}</p>}
 </section>;
}
