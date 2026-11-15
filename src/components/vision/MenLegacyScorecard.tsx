"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { MenVisionScorecard } from "@/lib/men-vision-scorecard";

type Metric = MenVisionScorecard["metrics"]["prayer"];

function Measurement({ title, metric, growth = false }: { title: string; metric: Metric; growth?: boolean }) {
  const value = growth ? metric.growthPct : metric.actual;
  const reported = value !== null && value !== undefined;
  const suffix = growth ? "%" : metric.unit === "sessions" || metric.unit === "reviews" ? "" : "";
  return (
    <div className="min-w-0 rounded-2xl border border-slate-200 bg-slate-50 p-5 sm:p-6">
      <p className="text-base font-bold leading-snug text-slate-950">{title}</p>
      <p className="mt-3 break-words text-2xl font-extrabold tracking-tight text-blue-800 sm:text-3xl">
        {reported ? `${value}${suffix}` : "Not yet reported"}
      </p>
      <p className="mt-2 text-sm font-semibold text-slate-600">
        Target: {metric.target}{growth ? "%" : ` ${metric.unit}`}
        {growth && metric.baseline != null ? ` · Baseline: ${metric.baseline}` : ""}
      </p>
      {growth && metric.actual !== null && <p className="mt-1 text-sm leading-relaxed text-slate-600">Current average: {metric.actual} attendees · {metric.reportedMonths} reporting months</p>}
    </div>
  );
}

export function MenLegacyScorecard() {
  const [data, setData] = useState<MenVisionScorecard | null>(null);
  const [error, setError] = useState("");
  useEffect(() => {
    let active = true;
    fetch("/api/vision/men-scorecard", { cache: "no-store" })
      .then(async res => { if (!res.ok) throw new Error("Scorecard is not available for this account."); return res.json(); })
      .then(json => { if (active) setData(json.scorecard ?? null); })
      .catch(err => { if (active) setError(err instanceof Error ? err.message : "Could not load scorecard."); });
    return () => { active = false; };
  }, []);
  return (
    <section className="min-w-0 space-y-7 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-8 lg:p-10" aria-label="Men of Legacy ministry scorecard">
      <div className="space-y-2">
        <p className="text-sm font-extrabold uppercase tracking-wide text-blue-800">2027 · Measurable ministry growth</p>
        <h2 className="text-2xl font-extrabold tracking-tight text-slate-950 sm:text-3xl">Men of Legacy Ministry Scorecard</h2>
        <p className="text-base leading-relaxed text-slate-700">Based on submitted monthly Men of Legacy reports. Missing submissions or attendance baselines are never counted as achieved results.</p>
      </div>
      {error && <p role="alert" className="rounded-xl bg-red-50 p-4 font-medium text-red-800">{error}</p>}
      {!data && !error && <p role="status" className="text-base font-medium text-slate-600">Loading ministry results…</p>}
      {data && (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            <Measurement title="Monthly men's prayers held" metric={data.metrics.prayerMeetings} />
            <Measurement title="Prayer attendance growth" metric={data.metrics.prayer} growth />
            <Measurement title="Bi-monthly breakfasts held" metric={data.metrics.breakfasts} />
            <Measurement title="Breakfast attendance growth" metric={data.metrics.breakfast} growth />
            <Measurement title="Men's Sunday attendance growth" metric={data.metrics.sunday} growth />
            <Measurement title="Quarterly ministry reviews" metric={data.metrics.quarterlyReviews} />
          </div>
          <p className="text-sm font-medium leading-relaxed text-slate-600">{data.reportedMonths} of 12 monthly reports submitted. {data.baselineEvidence ? `Baseline source: ${data.baselineEvidence}` : "2026 attendance baselines have not yet been documented in an accepted monthly report."} Sunday's target is 20–30% growth.</p>
          <div className="space-y-4">
            <h3 className="text-xl font-extrabold text-slate-950">Quarterly performance</h3>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {data.quarters.map(q => <div key={q.quarter} className="min-w-0 space-y-2 break-words rounded-xl border border-slate-200 p-5">
                <h4 className="text-lg font-extrabold text-slate-950">Q{q.quarter} · 2027</h4>
                <p className="text-base text-slate-700">Monthly reports: <strong>{q.reportedMonths}/3</strong> · Pastor-reviewed reports: <strong>{q.reviewedMonths}</strong></p>
                <p className="text-base text-slate-700">Prayer gatherings: <strong>{q.prayerSessions ?? "Not yet reported"}</strong> · Breakfasts: <strong>{q.breakfastSessions ?? "Not yet reported"}</strong></p>
                <p className="text-base font-semibold text-slate-700">Quarterly review: {q.reviewCompleted ? "Completed" : "Not yet confirmed"}</p>
                {q.summary && <p className="whitespace-pre-wrap break-words text-base leading-relaxed text-slate-700">{q.summary}</p>}
              </div>)}
            </div>
          </div>
          <div className="border-t border-slate-200 pt-6">
            <p className="text-base font-medium leading-relaxed text-slate-700">Leaders record attendance and action plans once through the existing monthly ministry report. The Vision Center summarizes those reports; it is not a replacement reporting form.</p>
            <Link href="/groups" className="mt-4 inline-flex rounded-xl border border-blue-200 bg-blue-50 px-5 py-3 text-base font-bold text-blue-800">Open Ministries & monthly reporting</Link>
          </div>
        </>
      )}
    </section>
  );
}
