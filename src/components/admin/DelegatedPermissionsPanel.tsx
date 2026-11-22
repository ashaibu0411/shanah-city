"use client";
import { useEffect, useState } from "react";
const permissions = [
  {key:"announcements.manage",label:"Weekly announcements",description:"Create, edit and publish weekly announcements"},
  {key:"events.manage",label:"Events",description:"Reserved for future event management access"},
  {key:"devotions.manage",label:"Devotions",description:"Reserved for future devotion management access"},
  {key:"media.manage",label:"Media",description:"Reserved for future media management access"},
  {key:"members.view",label:"Member directory",description:"Reserved for future restricted directory access"},
];
type Member={id:string;name:string;email:string};
export function DelegatedPermissionsPanel(){
 const [members,setMembers]=useState<Member[]>([]);
 const [search,setSearch]=useState("");
 const [selected,setSelected]=useState("");
 const [grants,setGrants]=useState<string[]>([]);
 const [busy,setBusy]=useState(false);
 const [message,setMessage]=useState("");
 useEffect(()=>{fetch("/api/admin/delegated-permissions").then(r=>r.json()).then(d=>{if(d.members)setMembers(d.members);else setMessage(d.error||"Could not load members")}).catch(()=>setMessage("Could not load members"))},[]);
 useEffect(()=>{if(!selected){setGrants([]);return;}let cancelled=false;fetch("/api/admin/delegated-permissions?userId="+encodeURIComponent(selected)).then(r=>r.json()).then(d=>{if(!cancelled)setGrants((d.permissions||[]).map((p:{permission:string})=>p.permission))}).catch(()=>{if(!cancelled)setMessage("Could not load permissions")});return()=>{cancelled=true}},[selected]);
 async function toggle(key:string,enabled:boolean){setBusy(true);setMessage("");try{const response=await fetch("/api/admin/delegated-permissions",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({userId:selected,permission:key,enabled})});const data=await response.json();if(!response.ok)throw Error(data.error||"Update failed");setGrants(data.permissions.map((p:{permission:string})=>p.permission));setMessage("Permissions saved.");}catch(e){setMessage(e instanceof Error?e.message:"Update failed")}finally{setBusy(false)}}
 const filtered=members.filter(m=>(m.name+" "+m.email).toLowerCase().includes(search.toLowerCase())).slice(0,40);
 return <section className="space-y-5 rounded-2xl border border-slate-200 bg-white p-5 text-slate-900">
 <div><h2 className="text-lg font-bold">Team permissions</h2><p className="text-sm text-slate-600">Give members only the tools they need. Full admin privileges are never granted here.</p></div>
 <label className="block text-sm font-semibold">Find a member<input className="mt-2 w-full rounded-lg border p-3" placeholder="Search name or email" value={search} onChange={e=>setSearch(e.target.value)}/></label>
 <label className="block text-sm font-semibold">Choose member<select className="mt-2 w-full rounded-lg border p-3" value={selected} onChange={e=>{setSelected(e.target.value);setMessage("")}}><option value="">Select a member</option>{filtered.map(m=><option key={m.id} value={m.id}>{m.name} — {m.email}</option>)}</select></label>
 {selected&&<div className="space-y-3"><h3 className="font-bold">Allowed management tools</h3>{permissions.map(p=><label key={p.key} className="flex items-start gap-3 rounded-xl border p-3"><input type="checkbox" className="mt-1 h-5 w-5" checked={grants.includes(p.key)} disabled={busy||p.key!=="announcements.manage"} onChange={e=>void toggle(p.key,e.target.checked)}/><span><strong className="block">{p.label}</strong><span className="text-sm text-slate-600">{p.description}{p.key!=="announcements.manage"?" (Coming later)":""}</span></span></label>)}</div>}
 {message&&<p role="status" className="text-sm font-medium">{message}</p>}
 </section>
}
