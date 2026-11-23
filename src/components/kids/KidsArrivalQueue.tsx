"use client";
import {useEffect,useState} from "react";
type Child={name:string;age:string;allergies:string;careNotes:string;familyMemberId?:string};
type Arrival={id:string;guardianName:string;phone:string;email:string|null;children:Child[];createdAt:string;status:string};
const rooms=["Nursery (0-2)","Preschool (3-5)","Elementary (6-11)","Youth (12+)"];
const roomFor=(age:string)=>{const n=parseInt(age,10);return Number.isNaN(n)?"Preschool (3-5)":n<=2?rooms[0]:n<=5?rooms[1]:n<=11?rooms[2]:rooms[3]};
export function KidsArrivalQueue({service,onCheckedIn}:{service:string;onCheckedIn?:()=>void}){
 const [rows,setRows]=useState<Arrival[]>([]),[error,setError]=useState(""),[busy,setBusy]=useState(""),[selected,setSelected]=useState(""),[room,setRoom]=useState("Preschool (3-5)"),[pickupName,setPickupName]=useState(""),[pickupPhone,setPickupPhone]=useState(""),[verified,setVerified]=useState(false),[done,setDone]=useState<Record<string,string>>({});
 async function load(){try{const r=await fetch("/api/kids/arrivals",{cache:"no-store"});const d=await r.json();if(!r.ok)throw Error(d.error||"Unable to load arrivals");setRows(d.arrivals||[])}catch(e){setError(e instanceof Error?e.message:"Unable to load arrivals")}}
 useEffect(()=>{void load();const timer=setInterval(()=>void load(),10000);return()=>clearInterval(timer)},[]);
 function select(r:Arrival,c:Child,i:number){const key=r.id+":"+i;setSelected(selected===key?"":key);setRoom(roomFor(c.age));setPickupName(r.guardianName);setPickupPhone(r.phone);setVerified(false);setError("")}
 async function checkin(r:Arrival,c:Child,i:number){const key=r.id+":"+i;if(!verified||!pickupName.trim()||!pickupPhone.trim())return;setBusy(key);setError("");try{
 const response=await fetch("/api/kids/ministry",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({action:"teacher-checkin",childName:c.name,parentName:r.guardianName,ageGroup:room,service,pickupName,pickupPhone,allergies:c.allergies,medicalNotes:c.careNotes,notes:"Express arrival "+r.id.slice(-8).toUpperCase()})});
 const result=await response.json();if(!response.ok)throw Error(result.error||"Check-in failed");
 setDone(old=>({...old,[key]:result.checkin.securityCode}));setSelected("");onCheckedIn?.();
 }catch(e){setError(e instanceof Error?e.message:"Check-in failed")}finally{setBusy("")}}
 async function review(id:string){setBusy(id);setError("");try{const r=await fetch("/api/kids/arrivals",{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({id,status:"reviewed"})});if(!r.ok){const d=await r.json();throw Error(d.error||"Unable to close arrival")}await load()}catch(e){setError(e instanceof Error?e.message:"Unable to update")}finally{setBusy("")}}
 return <section className="space-y-4 rounded-2xl border bg-white p-4"><h2 className="text-xl font-bold">Express arrivals · quick classroom check-in</h2><p className="text-sm text-slate-700">Tap a child, choose the classroom, confirm the authorized pickup adult, and check in. No retyping the child's registration. Pickup codes must be given privately to verified guardians; guest SMS/email is not connected yet.</p>
 {rows.length===0&&<p className="text-sm">No recent QR arrivals.</p>}
 {rows.map(r=><div key={r.id} className="space-y-3 rounded-xl border p-3"><p className="font-bold">{r.guardianName} · Ref {r.id.slice(-8).toUpperCase()}</p><p className="text-xs text-slate-600">{r.status==="pending"?"Awaiting check-in":"Arrival "+r.status}</p>
 {r.children.map((c,i)=>{const key=r.id+":"+i;return <div key={key} className="space-y-2 rounded-xl bg-slate-50 p-3"><p className="font-semibold">{c.name} · {c.age}</p>{c.allergies&&<p className="text-sm font-semibold text-red-800">Allergies: {c.allergies}</p>}{c.careNotes&&<p className="text-sm">Care notes: {c.careNotes}</p>}
 {done[key]?<div role="status" className="rounded-lg border border-green-300 bg-green-50 p-3"><p className="font-semibold">Checked in · {roomFor(c.age)} (confirm actual room on roster)</p><p className="text-sm">Private pickup code: <strong>{done[key]}</strong></p><p className="text-xs">Show only to the verified guardian. This code is not sent by SMS or email.</p></div>:
 <button type="button" onClick={()=>select(r,c,i)} className="min-h-11 rounded-lg bg-blue-700 px-4 font-semibold text-white">{selected===key?"Close":"Check in this child"}</button>}
 {selected===key&&!done[key]&&<div className="space-y-3 rounded-xl border bg-white p-3">
 <label className="block text-sm font-semibold">Classroom<select value={room} onChange={e=>setRoom(e.target.value)} className="mt-1 min-h-12 w-full rounded-lg border p-3">{rooms.map(x=><option key={x}>{x}</option>)}</select></label>
 <label className="block text-sm font-semibold">Authorized pickup adult<input value={pickupName} onChange={e=>setPickupName(e.target.value)} className="mt-1 min-h-12 w-full rounded-lg border p-3"/></label>
 <label className="block text-sm font-semibold">Pickup adult phone<input type="tel" value={pickupPhone} onChange={e=>setPickupPhone(e.target.value)} className="mt-1 min-h-12 w-full rounded-lg border p-3"/></label>
 <label className="flex gap-2 text-sm"><input type="checkbox" checked={verified} onChange={e=>setVerified(e.target.checked)}/><span>I verified the guardian, reviewed the child's safety details, and confirmed this adult is authorized for pickup.</span></label>
 <button type="button" disabled={busy===key||!verified||!pickupName.trim()||!pickupPhone.trim()} onClick={()=>void checkin(r,c,i)} className="min-h-12 w-full rounded-lg bg-green-700 px-4 font-bold text-white disabled:opacity-50">{busy===key?"Checking in…":"Confirm official check-in"}</button>
 </div>}</div>})}
 {r.status==="pending"&&<button type="button" disabled={busy===r.id} onClick={()=>void review(r.id)} className="min-h-11 rounded-lg border px-3 text-sm font-semibold">Finish family arrival (after every child is checked in)</button>}</div>)}
 {error&&<p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-800">{error}</p>}</section>
}
