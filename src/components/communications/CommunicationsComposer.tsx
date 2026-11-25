"use client";
import { useState } from "react";
import { WHATSAPP_TEMPLATES, buildWhatsAppVariables, type WhatsAppTemplateKey } from "@/lib/whatsapp-template-registry";
type Member = { id: string; name: string; role: string };
const field = "w-full rounded-xl border border-slate-300 bg-white p-3 text-slate-900";
export function CommunicationsComposer({ members }: { members: Member[] }) {
  const [channel, setChannel] = useState("whatsapp");
  const [template, setTemplate] = useState<WhatsAppTemplateKey>("service_reminder");
  const [values, setValues] = useState<Record<string,string>>({});
  const [audience, setAudience] = useState("individual");
  const [ids, setIds] = useState<string[]>([]);
  const [search, setSearch] = useState("");
  const [body, setBody] = useState("");
  const [preview, setPreview] = useState(false);
  const recipients = members.filter(m => audience === "all" || (audience === "leaders" ? m.role === "leader" : ids.includes(m.id)));
  const invalidate = () => setPreview(false);
  const fields = WHATSAPP_TEMPLATES[template].fields.filter(f => f !== "name");
  const valid = channel === "whatsapp" ? fields.every(f => values[f]?.trim() && values[f].length <= 500 && !/[\r\n\t]/.test(values[f])) : Boolean(body.trim());
  return <main className="mx-auto max-w-5xl space-y-6 p-4 pb-24">
    <header className="rounded-3xl bg-slate-950 p-7 text-white"><p className="text-sm uppercase tracking-widest">Shanah City · Private leadership</p><h1 className="mt-2 text-3xl font-bold">Communications Center</h1><p className="mt-3">Prepare messages across WhatsApp, SMS and app notifications.</p></header>
    <p role="status" className="rounded-xl border border-amber-400 p-4">Preview mode only. No messages can be sent from this workspace.</p>
    <section className="space-y-4 rounded-2xl border p-5"><h2 className="text-xl font-bold">1. Choose channel</h2><div className="flex flex-wrap gap-2">{["whatsapp","sms","push"].map(c => <button type="button" key={c} aria-pressed={channel===c} onClick={()=>{setChannel(c);invalidate();}} className={"rounded-xl border px-4 py-3 font-bold uppercase "+(channel===c?"bg-blue-700 text-white":"")}>{c}</button>)}</div>
    {channel==="whatsapp" ? <><label className="block">Template<select className={field} value={template} onChange={e=>{setTemplate(e.target.value as WhatsAppTemplateKey);setValues({});invalidate();}}>{Object.keys(WHATSAPP_TEMPLATES).map(k=><option key={k} value={k}>{k.replaceAll("_"," ")}</option>)}</select></label><p className="text-sm">Provider approval not verified. Recipient names are personalized.</p>{fields.map(f=><label key={f} className="block capitalize">{f}<input className={field} maxLength={500} value={values[f]||""} onChange={e=>{setValues(v=>({...v,[f]:e.target.value}));invalidate();}}/></label>)}</> : <label className="block">Message<textarea className={field} rows={6} maxLength={1000} value={body} onChange={e=>{setBody(e.target.value);invalidate();}}/></label>}</section>
    <section className="space-y-4 rounded-2xl border p-5"><h2 className="text-xl font-bold">2. Choose audience</h2><select aria-label="Audience" className={field} value={audience} onChange={e=>{setAudience(e.target.value);invalidate();}}><option value="individual">Selected individuals</option><option value="leaders">Members with leader role</option><option value="all">All registered accounts</option></select>
    {audience==="individual" && <><input aria-label="Find members" className={field} placeholder="Search names" value={search} onChange={e=>setSearch(e.target.value)}/><div className="max-h-72 overflow-y-auto space-y-2">{members.filter(m=>m.name.toLowerCase().includes(search.toLowerCase())).map(m=><label key={m.id} className="flex gap-3 p-2"><input type="checkbox" checked={ids.includes(m.id)} onChange={e=>{setIds(old=>e.target.checked?[...old,m.id]:old.filter(id=>id!==m.id));invalidate();}}/>{m.name}</label>)}</div></>}
    <p className="font-bold">{recipients.length} selected accounts (not verified deliverable or opted in)</p></section>
    <section className="space-y-4 rounded-2xl border p-5"><h2 className="text-xl font-bold">3. Review</h2><button type="button" disabled={!valid||!recipients.length} onClick={()=>setPreview(true)} className="rounded-xl bg-blue-700 px-5 py-3 font-bold text-white disabled:opacity-50">Preview message</button>{preview&&valid&&recipients.length>0&&<div className="space-y-2 rounded-xl border p-4"><p>Preview for {recipients[0].name}</p>{channel==="whatsapp"?<><p className="font-bold">{template.replaceAll("_"," ")}</p>{Object.entries(buildWhatsAppVariables(template,{...values,name:"Sample recipient"})).map(([k,v])=><p key={k}>{k}: {k==="1"?recipients[0].name:v}</p>)}</>:<p className="whitespace-pre-wrap">{body}</p>}<p className="text-sm">Preview only — no delivery or consent verification performed.</p></div>}</section>
  </main>;
}
