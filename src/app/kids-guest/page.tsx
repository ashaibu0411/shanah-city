"use client";
import {useState} from "react";
import {useAuth} from "@/components/auth/AuthProvider";
type Child={name:string;age:string;allergies:string;careNotes:string;familyMemberId?:string};
const blank=():Child=>({name:"",age:"",allergies:"",careNotes:""});
export default function KidsGuestRegistrationPage(){
 const {user}=useAuth();const family=user?.family?.filter(x=>x.relationship==="child")??[];
 const [guardianName,setGuardianName]=useState("");const [phone,setPhone]=useState("");const [email,setEmail]=useState("");const [children,setChildren]=useState<Child[]>([blank()]);
 const [consent,setConsent]=useState(false);const [website,setWebsite]=useState("");const [busy,setBusy]=useState(false);const [status,setStatus]=useState("");const [reference,setReference]=useState("");
 function update(i:number,change:Partial<Child>){setChildren(old=>old.map((c,n)=>n===i?{...c,...change}:c))}
 async function submit(e:React.FormEvent<HTMLFormElement>){e.preventDefault();setBusy(true);setStatus("");try{const r=await fetch("/api/kids/arrivals",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({guardianName,phone,email,children,website})});const d=await r.json();if(!r.ok)throw Error(d.error||"Unable to submit");setReference(d.reference);setStatus(d.message)}catch(e){setStatus(e instanceof Error?e.message:"Please see a Kids Ministry teacher.")}finally{setBusy(false)}}
 return <main className="mx-auto max-w-xl space-y-5 px-4 py-8 text-slate-900"><p className="text-sm font-bold uppercase tracking-widest text-blue-700">Shanah City</p><h1 className="text-3xl font-bold">Shanah Kids · Express Check-In</h1><p className="text-slate-600">At church? Complete this quick arrival form, then show your reference to a Kids Ministry teacher for secure check-in. No pickup authorization is issued online.</p>
 {reference?<section role="status" className="space-y-3 rounded-2xl border bg-green-50 p-6 text-center"><p className="font-semibold">Arrival submitted</p><p className="text-3xl font-black tracking-wider">{reference}</p><p>{status}</p><button type="button" onClick={()=>{setReference("");setStatus("");setChildren([blank()])}} className="rounded-xl border px-4 py-3">Register another family</button></section>:
 <form onSubmit={submit} className="space-y-5 rounded-2xl border bg-white p-4">
 <h2 className="text-lg font-bold">1. Parent or guardian</h2>
 <label className="block text-sm font-semibold">Full name<input required minLength={2} maxLength={100} value={guardianName} onChange={e=>setGuardianName(e.target.value)} autoComplete="name" className="mt-1 min-h-12 w-full rounded-xl border p-3 text-base"/></label>
 <label className="block text-sm font-semibold">Phone<input required type="tel" value={phone} onChange={e=>setPhone(e.target.value)} autoComplete="tel" className="mt-1 min-h-12 w-full rounded-xl border p-3 text-base"/></label>
 <label className="block text-sm font-semibold">Email (optional)<input type="email" value={email} onChange={e=>setEmail(e.target.value)} autoComplete="email" className="mt-1 min-h-12 w-full rounded-xl border p-3 text-base"/></label>
 <h2 className="text-lg font-bold">2. Children arriving today</h2>
 {family.length>0&&<p className="rounded-xl bg-blue-50 p-3 text-sm">Your account has registered children. Select one below to avoid typing their name again. A teacher will verify your family before check-in.</p>}
 {children.map((c,i)=><fieldset key={i} className="space-y-3 rounded-xl border p-3"><legend className="px-1 font-semibold">Child {i+1}</legend>
 {family.length>0&&<label className="block text-sm">Registered child<select value={c.familyMemberId||""} onChange={e=>{const found=family.find(x=>x.id===e.target.value);update(i,{familyMemberId:found?.id||"",name:found?.name||"",age:""})}} className="mt-1 min-h-12 w-full rounded-xl border p-3"><option value="">New child / enter manually</option>{family.map(x=><option key={x.id} value={x.id}>{x.name}</option>)}</select></label>}
 <label className="block text-sm font-semibold">Child's name<input required minLength={2} maxLength={100} value={c.name} readOnly={Boolean(c.familyMemberId)} onChange={e=>update(i,{name:e.target.value})} className="mt-1 min-h-12 w-full rounded-xl border p-3"/></label>
 {!c.familyMemberId&&<label className="block text-sm font-semibold">Age<input required value={c.age} onChange={e=>update(i,{age:e.target.value})} maxLength={20} placeholder="e.g. 4 years" className="mt-1 min-h-12 w-full rounded-xl border p-3"/></label>}
 <label className="block text-sm font-semibold">Allergies (if any)<input value={c.allergies} onChange={e=>update(i,{allergies:e.target.value})} maxLength={300} placeholder="None / describe" className="mt-1 min-h-12 w-full rounded-xl border p-3"/></label>
 <label className="block text-sm font-semibold">Important care or accessibility information (optional)<textarea rows={2} value={c.careNotes} onChange={e=>update(i,{careNotes:e.target.value})} maxLength={300} className="mt-1 w-full rounded-xl border p-3"/></label>
 {children.length>1&&<button type="button" className="text-sm font-semibold text-red-700" onClick={()=>setChildren(old=>old.filter((_,n)=>n!==i))}>Remove child</button>}
 </fieldset>)}
 {children.length<6&&<button type="button" onClick={()=>setChildren(old=>[...old,blank()])} className="min-h-12 w-full rounded-xl border border-blue-600 font-semibold text-blue-700">+ Add another child</button>}
 <div className="hidden"><label>Website<input value={website} onChange={e=>setWebsite(e.target.value)} tabIndex={-1}/></label></div>
 <label className="flex items-start gap-3 text-sm"><input required type="checkbox" checked={consent} onChange={e=>setConsent(e.target.checked)} className="mt-1"/><span>I am the parent or authorized guardian and agree to provide these details to the Shanah Kids team for today's check-in. This is not consent to marketing messages.</span></label>
 <button type="submit" disabled={busy||!consent} className="min-h-12 w-full rounded-xl bg-blue-700 px-4 font-bold text-white disabled:opacity-50">{busy?"Submitting…":"Send to Kids Check-In Desk"}</button>{status&&<p role="alert" className="rounded-xl bg-amber-50 p-3 text-sm">{status}</p>}
 </form>}
 <p className="text-xs text-slate-600">For child safety, a teacher must confirm guardian identity, room assignment, authorized pickup, and any care requirements before completing check-in. This QR form alone does not check a child in.</p></main>
}
