"use client";
import {useEffect,useState} from "react";
export function GuestReturnVisit({guestId}:{guestId:string}){
 const [visits,setVisits]=useState<{id:string;visitDate:string}[]>([]);
 const [date,setDate]=useState(new Date().toLocaleDateString("en-CA"));
 const [error,setError]=useState("");
 const [saving,setSaving]=useState(false);
 useEffect(()=>{let active=true;void fetch("/api/follow-up/return-visits?guestId="+encodeURIComponent(guestId)).then(async r=>{if(!r.ok)throw Error("Return visits unavailable");return r.json()}).then(d=>{if(active)setVisits(d.visits??[])}).catch(e=>{if(active)setError(e.message)});return()=>{active=false}},[guestId]);
 async function save(){setSaving(true);setError("");try{const r=await fetch("/api/follow-up/return-visits",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({guestId,visitDate:date})});const d=await r.json();if(!r.ok)throw Error(d.error||"Could not save");setVisits(old=>old.some(v=>v.visitDate===date)?old:[d.visit,...old]);}catch(e){setError(e instanceof Error?e.message:"Could not save")}finally{setSaving(false)}}
 return <section className="space-y-2 rounded-xl border p-3"><h4 className="text-sm font-semibold">Returning guest recognition</h4><p className="text-xs text-night-600">Record a return visit on this existing guest profile. Duplicate dates are prevented.</p><div className="flex flex-wrap items-end gap-2"><label className="text-xs">Visit date<input aria-label="Return visit date" type="date" value={date} max={new Date().toLocaleDateString("en-CA")} onChange={e=>setDate(e.target.value)} className="mt-1 block min-h-11 rounded-lg border p-2"/></label><button type="button" disabled={saving} onClick={()=>void save()} className="min-h-11 rounded-xl bg-blue-700 px-4 text-sm font-semibold text-white disabled:opacity-50">Mark returned</button></div>{visits.length>0&&<p className="text-xs text-night-600">{visits.length} recorded return visit{visits.length===1?"":"s"} · Most recent: {visits[0].visitDate}</p>}{error&&<p role="alert" className="text-xs text-red-700">{error}</p>}</section>;
}
