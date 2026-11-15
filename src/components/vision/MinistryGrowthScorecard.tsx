"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { MinistryKey, VisionMinistryScorecard } from "@/lib/vision-ministry-scorecards";

export function MinistryGrowthScorecard({ ministry }: { ministry: MinistryKey }) {
  const [data, setData] = useState<VisionMinistryScorecard | null>(null);
  const [error, setError] = useState("");
  useEffect(() => {
    let active = true;
    setData(null); setError("");
    fetch("/api/vision/ministry-scorecard?ministry=" + encodeURIComponent(ministry), { cache: "no-store" })
      .then(async response => {
        const body = await response.json();
        if (!response.ok) throw new Error(body.error || "Unable to load ministry scorecard.");
        return body;
      }).then(body => { if (active) setData(body.scorecard); })
      .catch(e => { if (active) setError(e instanceof Error ? e.message : "Unable to load scorecard."); });
    return () => { active = false; };
  }, [ministry]);
  return <section aria-label="Ministry leadership scorecard" className="min-w-0 space-y-7 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-8 lg:p-10">
    <div className="space-y-2">
      <p className="text-sm font-extrabold uppercase tracking-wide text-blue-800">2027 · Year of Expansion</p>
      <h2 className="text-2xl font-extrabold leading-tight tracking-tight text-slate-950 sm:text-3xl">{data?.title ?? "Ministry"} Leadership Scorecard</h2>
      <p className="text-base leading-relaxed text-slate-700">This is an evidence-based summary of the ministry's existing monthly reports, not an extra reporting form. The Senior Pastor can refine targets and activities through the pastoral vision before approval.</p>
    </div>
    {error && <p role="alert" className="break-words rounded-xl bg-red-50 p-4 text-base font-semibold text-red-800">{error}</p>}
    {!error && !data && <p role="status" className="text-base font-medium text-slate-600">Loading reported ministry progress…</p>}
    {data && <>
      <div className="grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {data.metrics.map(item => <div key={item.key} className="min-w-0 space-y-2 rounded-2xl border border-slate-200 bg-slate-50 p-5 sm:p-6">
          <h3 className="break-words text-base font-extrabold leading-snug text-slate-950">{item.label}</h3>
          <p className="break-words text-2xl font-extrabold text-blue-800 sm:text-3xl">{item.actual ?? "Not yet reported"}</p>
          <p className="text-sm font-semibold text-slate-600">{item.target == null ? "Trend monitoring" : "Working annual target: " + item.target} · {item.unit}</p>
        </div>)}
      </div>
      <p className="text-base font-medium leading-relaxed text-slate-700">{data.reportedMonths} of 12 monthly reporting periods submitted or pastor-reviewed. Draft, returned or missing reports do not count as accomplishments.</p>
      <h3 className="text-xl font-extrabold text-slate-950">Quarterly leadership performance</h3>
      <div className="grid min-w-0 grid-cols-1 gap-4 md:grid-cols-2">
        {data.quarters.map(quarter => <article key={quarter.quarter} className="min-w-0 space-y-3 break-words rounded-2xl border border-slate-200 p-5">
          <h4 className="text-lg font-extrabold text-slate-950">Q{quarter.quarter} · 2027</h4>
          <p className="text-base text-slate-700">Submitted monthly reports: {quarter.reports}/3 · Pastor-reviewed reports: {quarter.reviewedReports}</p>
          <p className="text-base font-semibold text-slate-700">Quarterly review: {quarter.leadershipReview ? "Completed" : "Not yet confirmed"}</p>
          {quarter.summary && <p className="whitespace-pre-wrap break-words text-base leading-relaxed text-slate-700">{quarter.summary}</p>}
        </article>)}
      </div>
      {ministry === "kids" && <p className="rounded-xl bg-slate-50 p-5 text-base font-semibold leading-relaxed text-slate-800">Child safety and privacy: this dashboard shows aggregate ministry counts only. Never enter identifiable children, family medical details, safeguarding concerns or incident reports into vision discussions or scorecard notes.</p>}
      <div className="border-t border-slate-200 pt-6">
        <p className="text-base leading-relaxed text-slate-700">Use the established ministry report to record actual results; use the private Vision Center for leader proposals and quarterly pastoral review.</p>
        <Link href="/groups" className="mt-4 inline-flex rounded-xl border border-blue-200 bg-blue-50 px-5 py-3 text-base font-bold text-blue-800">Open Ministry Reports</Link>
      </div>
    </>}
  </section>;
}
