"use client";

import { useCallback, useEffect, useState } from "react";

type WeekResponse = {
  weekStart: string;
  weekEnd: string;
  canManage: boolean;
  bulletin: { title: string; body: string; published: boolean } | null;
  events: Array<{id:string;title:string;date:string;time:string;location:string}>;
};
function dateText(iso:string) {
  return new Date(`${iso}T12:00:00`).toLocaleDateString("en-US", {month:"short",day:"numeric"});
}
function eventDay(iso:string) {
  return new Date(`${iso}T12:00:00`).toLocaleDateString("en-US", {weekday:"short",month:"short",day:"numeric"});
}

function parseAnnouncements(body: string) {
  return body.split(/\r?\n/).map(line => line.trim()).filter(Boolean).map(line => {
    const clean = line.replace(/^(?:\d+[.)]\s+|[-•]\s+)/, "");
    const separator = clean.match(/:\s+|\s+\|\s+/);
    if (separator && separator.index !== undefined) return { heading: clean.slice(0, separator.index), details: clean.slice(separator.index + separator[0].length) };
    return { heading: clean, details: "" };
  });
}

/** Unified public and member-app weekly announcement center. */
export function WeeklyAnnouncements({ website = false }: { website?: boolean }) {
  const [offset, setOffset] = useState<0|1>(0);
  const [data, setData] = useState<WeekResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [published, setPublished] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const reload = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch(`/api/weekly-announcements?offset=${offset}`, {cache:"no-store"});
      if (!response.ok) throw new Error("Could not load weekly announcements.");
      const next:WeekResponse = await response.json();
      setData(next);
      setTitle(next.bulletin?.title || "");
      setBody(next.bulletin?.body || "");
      setPublished(next.bulletin?.published ?? true);
    } catch (cause) {
      setData(null);
      setError(cause instanceof Error ? cause.message : "Could not load announcements.");
    } finally {
      setLoading(false);
    }
  }, [offset]);

  useEffect(() => { void reload(); setEditing(false); setNotice(""); }, [reload]);

  async function save() {
    setBusy(true);setError("");setNotice("");
    try {
      const response = await fetch("/api/weekly-announcements",{
        method:"POST",headers:{"Content-Type":"application/json"},
        body:JSON.stringify({offset,title,body,published}),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Could not save announcement.");
      setEditing(false);setNotice(published ? "This week's bulletin is published." : "Bulletin saved as unpublished.");
      await reload();
    } catch(cause) {
      setError(cause instanceof Error ? cause.message : "Could not save bulletin.");
    } finally {setBusy(false);}
  }

  async function shareBulletin() {
    if (!data?.bulletin?.published) return;
    const text = [data.bulletin.title, ...parseAnnouncements(data.bulletin.body).map((item, index) => (index + 1) + ". " + [item.heading, item.details].filter(Boolean).join(": "))].join("\n\n");
    try {
      if (navigator.share) await navigator.share({ title: data.bulletin.title, text });
      else { await navigator.clipboard.writeText(text); setNotice("Bulletin copied. You can paste it into a message."); }
    } catch (cause) { if (!(cause instanceof Error && cause.name === "AbortError")) setError("Unable to share the bulletin."); }
  }
  return <section id="weekly-announcements" className="scroll-mt-28 overflow-hidden rounded-[26px] border border-[#d8e4eb] bg-white shadow-sm">
    <div className="flex flex-wrap items-center justify-between gap-5 bg-[#0b3556] px-6 py-7 text-white sm:px-9">
      <div>
        <p className="text-xs font-extrabold uppercase tracking-[0.19em] text-[#f4d091]">Stay connected</p>
        <h2 className="mt-2 font-display text-3xl font-bold sm:text-4xl">This Week at Shanah City</h2>
        <p className="mt-2 text-sm text-blue-100">{data ? `${dateText(data.weekStart)} – ${dateText(data.weekEnd)}` : "Church announcements & upcoming gatherings"}</p>
      </div>
      <div className="flex gap-2" aria-label="Choose announcement week">
        <button type="button" onClick={() => setOffset(0)} aria-pressed={offset===0} className={`rounded-full px-4 py-2 text-xs font-extrabold ${offset===0 ? "bg-[#f7d39c] text-[#0b3556]" : "border border-white/40 text-white"}`}>This week</button>
        <button type="button" onClick={() => setOffset(1)} aria-pressed={offset===1} className={`rounded-full px-4 py-2 text-xs font-extrabold ${offset===1 ? "bg-[#f7d39c] text-[#0b3556]" : "border border-white/40 text-white"}`}>Next week</button>
      </div>
    </div>
    <div className="grid gap-6 p-4 sm:p-7 lg:grid-cols-[1.05fr_.95fr]">
      <div>
        <p className="text-xs font-extrabold uppercase tracking-[0.15em] text-[#0b74a5]">Church bulletin</p>
        {loading ? <p className="mt-4 text-slate-600">Loading announcements…</p> : data?.bulletin?.published ? (
          <div className="mt-3">
            <h3 className="font-display text-xl font-bold leading-tight text-[#142d49] sm:text-2xl">{data.bulletin.title}</h3>
            <p className="mt-2 text-xs font-semibold text-slate-600">{dateText(data.weekStart)} – {dateText(data.weekEnd)}</p>
            <ol className="mt-4 divide-y divide-[#e6dfd2] border-y border-[#e6dfd2]">
              {parseAnnouncements(data.bulletin.body).map((item,index)=><li key={index} className="flex items-start gap-3 py-4">
                <span aria-hidden="true" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#f0e9dc] text-xs font-extrabold text-[#765c35]">{String(index+1).padStart(2,"0")}</span>
                <div className="min-w-0 flex-1"><p className="break-words text-base font-bold leading-snug text-[#142d49]">{item.heading}</p>
                  {item.details && <p className="mt-1 break-words text-sm leading-relaxed text-slate-700">{item.details}</p>}
                </div>
              </li>)}
            </ol>
            <button type="button" onClick={shareBulletin} className="mt-4 rounded-lg border border-[#d8c9af] px-4 py-2 text-sm font-semibold text-[#142d49]">Share bulletin</button>
          </div>
        ) : <p className="mt-4 text-sm leading-7 text-slate-600">No weekly bulletin has been published yet. Check the upcoming events for this week.</p>}
        {!website && data?.canManage && !editing ? <button type="button" onClick={() => setEditing(true)} className="mt-6 rounded-full border border-[#0b6899] px-5 py-2.5 text-xs font-bold text-[#0b6899]">Edit weekly announcements</button> : null}
        {!website && data?.canManage && editing ? <div className="mt-6 space-y-3 rounded-2xl bg-[#f0f6fa] p-5">
          <label className="block text-sm font-bold text-[#142d49]">Bulletin headline
            <input value={title} onChange={e=>setTitle(e.target.value)} maxLength={180} className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 font-normal" placeholder="Announcements for this week"/>
          </label>
          <label className="block text-sm font-bold text-[#142d49]">Announcements
            <textarea value={body} onChange={e=>setBody(e.target.value)} rows={9} maxLength={6000} className="mt-2 min-h-48 w-full resize-y rounded-xl border border-slate-300 bg-white px-4 py-3 font-normal leading-7" placeholder={"Enter each announcement on a new line…\nRemember to include any deadlines or important next steps."}/>
          </label>
          <label className="flex items-center gap-3 text-sm font-semibold"><input type="checkbox" checked={published} onChange={e=>setPublished(e.target.checked)}/> Publish to website and app</label>
          <div className="flex flex-wrap gap-2"><button type="button" disabled={busy} onClick={save} className="rounded-full bg-[#086e9f] px-6 py-3 text-sm font-bold text-white disabled:opacity-50">{busy ? "Saving…" : "Save bulletin"}</button><button type="button" onClick={()=>setEditing(false)} className="rounded-full px-5 py-3 text-sm font-semibold text-slate-700">Cancel</button></div>
        </div> : null}
      </div>
      <div className="rounded-2xl bg-[#edf5f9] p-6 sm:p-7">
        <p className="text-xs font-extrabold uppercase tracking-[0.15em] text-[#0b74a5]">Coming up this week</p>
        {loading ? <p className="mt-4 text-slate-600">Loading events…</p> : data?.events.length ? <div className="mt-5 space-y-4">{data.events.slice(0,7).map((event,i)=><div key={event.id+"-"+event.date} className={i>0?"border-t border-[#cbdde8] pt-4":""}><p className="text-xs font-extrabold text-[#0b719e]">{eventDay(event.date)}</p><p className="mt-1 font-display text-lg font-bold text-[#163650]">{event.title}</p><p className="mt-1 text-sm text-slate-600">{event.time}{event.location ? " · "+event.location : ""}</p></div>)}</div> : <p className="mt-4 text-sm leading-7 text-slate-600">No additional events are listed for this week. Join us Sunday at 10:00 AM.</p>}
        <a href={website?"/events":"/calendar"} className="mt-7 inline-flex border-b-2 border-[#0b719e] pb-1 text-sm font-bold text-[#075882]">View full calendar ↗</a>
      </div>
    </div>
    {error ? <p role="alert" className="mx-6 mb-5 text-sm font-semibold text-red-700">{error}</p> : null}
    {notice ? <p role="status" className="mx-6 mb-5 text-sm font-semibold text-emerald-800">{notice}</p> : null}
  </section>;
}
