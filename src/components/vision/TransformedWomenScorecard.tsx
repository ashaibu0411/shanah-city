"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { TransformedWomenScorecard } from "@/lib/transformed-women-scorecard";

type Metric = TransformedWomenScorecard["metrics"]["monthlyTouchpoints"];
function MetricCard({ label, metric }: { label: string; metric: Metric }) {
  return <div className="min-w-0 space-y-2 break-words rounded-2xl border border-slate-200 bg-slate-50 p-5 sm:p-6">
    <p className="text-base font-bold leading-snug text-slate-950">{label}</p>
    <p className="text-2xl font-extrabold tracking-tight text-blue-800 sm:text-3xl">{metric.actual ?? "Not yet reported"}</p>
    <p className="text-sm font-semibold text-slate-600">{metric.target !== null ? "Annual target: " + metric.target : "Trend monitoring"} · {metric.unit}</p>
  </div>;
}
export function TransformedWomenScorecard() {
  const [data, setData] = useState<TransformedWomenScorecard | null>(null);
  const [error, setError] = useState("");
  useEffect(() => {
    let active = true;
    fetch("/api/vision/transformed-women-scorecard", { cache: "no-store" })
      .then(async response => {
        if (!response.ok) throw new Error("Women’s Ministry scorecard could not be accessed.");
        return response.json();
      })
      .then(body => { if (active) setData(body.scorecard); })
      .catch(e => { if (active) setError(e instanceof Error ? e.message : "Unable to load scorecard."); });
    return () => { active = false; };
  }, []);
  return <section aria-label="Transformed Women Ministry Scorecard" className="min-w-0 space-y-7 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-8 lg:p-10">
    <div className="space-y-2">
      <p className="text-sm font-extrabold uppercase tracking-wide text-blue-800">Shanah City · 2027 ministry accountability</p>
      <h2 className="text-2xl font-extrabold tracking-tight text-slate-950 sm:text-3xl">Transformed Women Ministry Scorecard</h2>
      <p className="text-base leading-relaxed text-slate-700">Based on submitted and reviewed monthly Women’s Ministry reports. Missing counts are not presented as achieved results.</p>
    </div>
    {error && <p role="alert" className="rounded-xl bg-red-50 p-4 text-base font-semibold text-red-800">{error}</p>}
    {!data && !error && <p role="status" className="text-base text-slate-600">Loading ministry results…</p>}
    {data && <>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <MetricCard label="Monthly prayer & connection touchpoints" metric={data.metrics.monthlyTouchpoints}/>
        <MetricCard label="Quarterly development gatherings" metric={data.metrics.focusedGatherings}/>
        <MetricCard label="Annual Transformed Women flagship" metric={data.metrics.annualFlagship}/>
        <MetricCard label="Quarterly leadership reviews" metric={data.metrics.quarterlyReviews}/>
        <MetricCard label="Women engaged per month" metric={data.metrics.engagedWomen}/>
        <MetricCard label="Verified Sunday participation" metric={data.metrics.sundayAttendance}/>
      </div>
      <p className="break-words text-base font-medium leading-relaxed text-slate-700">
        {data.reportedMonths} of 12 monthly reports submitted. Sunday attendance growth: <strong>{data.sundayGrowthPercent === null ? "Not yet reported" : data.sundayGrowthPercent + "%"}</strong>.
        {data.baselineEvidence ? " Baseline source: " + data.baselineEvidence : " No verified 2026 comparison baseline is recorded."}
        {" "}No growth-percentage target has been set without pastoral approval.
      </p>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="min-w-0 space-y-3 rounded-2xl border border-slate-200 p-5">
          <h3 className="text-xl font-extrabold text-slate-950">Sisterhood, Care & Leadership</h3>
          <p className="text-base text-slate-700">New women connected: <strong>{data.engagement.newcomers ?? "Not yet reported"}</strong></p>
          <p className="text-base text-slate-700">Follow-up conversations: <strong>{data.engagement.followUps ?? "Not yet reported"}</strong></p>
          <p className="text-base text-slate-700">Women mentored: <strong>{data.engagement.mentored ?? "Not yet reported"}</strong></p>
        </div>
        <div className="min-w-0 space-y-3 rounded-2xl border border-slate-200 p-5">
          <h3 className="text-xl font-extrabold text-slate-950">Annual Transformed Women Gathering</h3>
          <p className="text-base text-slate-700">Tentative: May 2027. Final date, format, and budget require pastoral approval.</p>
          <p className="text-base text-slate-700">Invitations: <strong>{data.engagement.flagshipInvites ?? "Not yet reported"}</strong></p>
          <p className="text-base text-slate-700">Guests attended: <strong>{data.engagement.flagshipGuests ?? "Not yet reported"}</strong></p>
        </div>
      </div>
      <div className="space-y-4">
        <h3 className="text-xl font-extrabold text-slate-950">Quarterly performance</h3>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">{data.quarters.map(q => <article key={q.quarter} className="min-w-0 space-y-2 break-words rounded-2xl border border-slate-200 p-5">
          <h4 className="text-lg font-extrabold text-slate-950">Q{q.quarter} · 2027</h4>
          <p className="text-base text-slate-700">Reports: {q.reportedMonths}/3 · Reviewed: {q.reviewedReports}</p>
          <p className="text-base text-slate-700">Monthly touchpoints: {q.touchpoints ?? "Not yet reported"} · Focused gatherings: {q.focusedGatherings ?? "Not yet reported"}</p>
          <p className="text-base font-semibold text-slate-700">Leadership review: {q.reviewed ? "Completed" : "Not yet confirmed"}</p>
          {q.actions && <p className="whitespace-pre-wrap break-words text-base leading-relaxed text-slate-700">{q.actions}</p>}
        </article>)}</div>
      </div>
      <div className="border-t border-slate-200 pt-6">
        <p className="text-base leading-relaxed text-slate-700">Enter results once through the existing Women’s Ministry monthly report. The Vision Center summarizes those records instead of duplicating the reporting workflow.</p>
        <Link href="/groups" className="mt-4 inline-flex rounded-xl border border-blue-200 bg-blue-50 px-5 py-3 text-base font-bold text-blue-800">Open Ministries & reporting</Link>
      </div>
    </>}
  </section>;
}
