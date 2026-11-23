"use client";
import {useEffect,useState} from "react";
type Report={month:string;guests:number;firstTime:number;contacted:number;contactRate:number;returned:number;returnRate:number;connectedMembers:number;overdue:number;activities:number};
export function FollowUpReports(){
 const [month,setMonth]=useState(new Date().toISOString().slice(0,7));
 const [report,setReport]=useState<Report|null>(null);
 const [error,setError]=useState("");
 useEffect(()=>{let active=true;void fetch("/api/follow-up/reports?month="+month).then(async r=>{if(!r.ok)throw Error((await r.json()).error||"Unavailable");return r.json()}).then(d=>{if(active){setReport(d);setError("")}}).catch(e=>{if(active){setReport(null);setError(e.message)}});return()=>{active=false}},[month]);
 return <section className="space-y-3 rounded-2xl border bg-white p-4 text-night-900"><h3 className="font-display text-lg font-semibold">Monthly guest growth report</h3><input type="month" aria-label="Report month" value={month} onChange={e=>setMonth(e.target.value)} className="min-h-11 w-full rounded-lg border p-2"/>{error&&<p className="text-sm text-night-600">{error}</p>}{report&&<><div className="grid grid-cols-2 gap-2">{[["First-time guests",report.firstTime],["Guests contacted",report.contacted],["Return visits tracked",report.returned],["Connected members",report.connectedMembers],["Contact rate",report.contactRate+"%"],["Return rate",report.returnRate+"%"],["Contact activities",report.activities],["Overdue tasks (all)",report.overdue]].map(([label,value])=><div key={label} className="rounded-xl bg-slate-50 p-3"><p className="text-xl font-bold">{value}</p><p className="text-xs text-night-600">{label}</p></div>)}</div><p className="text-xs text-night-600">Return and membership figures reflect recorded journey stages, not independently verified attendance or membership-directory enrollment.</p></>}</section>;
}
