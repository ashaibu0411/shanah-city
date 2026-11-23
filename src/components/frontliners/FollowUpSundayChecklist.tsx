"use client";
import {useEffect,useState} from "react";
const items=[["welcome_team_ready","Welcome team ready"],["qr_code_visible","Visitor QR codes displayed"],["new_visitors_reviewed","New visitor forms reviewed"],["guest_assignments_complete","Follow-up workers assigned"],["follow_up_deadlines_checked","Contact deadlines reviewed"],["pastoral_requests_escalated","Pastoral care requests escalated privately"],["weekly_summary_reviewed","Weekly summary reviewed"]];
function sunday(){const d=new Date();d.setDate(d.getDate()+(7-d.getDay())%7);return d.toLocaleDateString("en-CA");}
export function FollowUpSundayChecklist(){
 const [date,setDate]=useState(sunday);
 const [done,setDone]=useState<string[]>([]);
 const [message,setMessage]=useState("");
 const [loading,setLoading]=useState(false);
 useEffect(()=>{let active=true;void fetch("/api/follow-up/checklist?date="+date).then(r=>r.json()).then(data=>{if(active)setDone(Array.isArray(data.completedSteps)?data.completedSteps:[])}).catch(()=>{if(active)setMessage("Could not load checklist")});return()=>{active=false}},[date]);
 async function toggle(key:string){const next=done.includes(key)?done.filter(s=>s!==key):[...done,key];setLoading(true);setMessage("");try{const r=await fetch("/api/follow-up/checklist",{method:"PUT",headers:{"Content-Type":"application/json"},body:JSON.stringify({date,completedSteps:next})});const data=await r.json();if(!r.ok)throw new Error(data.error||"Could not save");setDone(next);}catch(e){setMessage(e instanceof Error?e.message:"Could not save")}finally{setLoading(false)}}
 return <section className="space-y-3 rounded-2xl border bg-white p-4 text-night-900"><h3 className="font-display text-lg font-semibold">Sunday guest care checklist</h3><label className="block text-sm">Service date<input type="date" value={date} onChange={e=>setDate(e.target.value)} className="mt-1 min-h-11 w-full rounded-lg border bg-white p-2"/></label><p className="text-sm text-night-600">{done.length} of {items.length} completed · Leaders can update</p>{items.map(([key,label])=><label key={key} className="flex min-h-11 items-center gap-3 rounded-lg border p-3 text-sm"><input type="checkbox" checked={done.includes(key)} disabled={loading} onChange={()=>void toggle(key)} className="h-5 w-5"/>{label}</label>)}{message&&<p role="status" className="text-sm text-red-700">{message}</p>}</section>;
}
